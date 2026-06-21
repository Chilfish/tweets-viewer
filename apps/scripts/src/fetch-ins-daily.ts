/**
 * Daily Instagram fetch via @chilfish/gallery-dl-instagram SDK.
 *
 * Reads tracked Instagram users from mapping.ts (INSUsernameToTwitter),
 * fetches only posts from the last 2 days via SDK extract(), and upserts
 * to database. Non-IG users are simply not in the mapping.
 *
 * post_id unique constraint handles dedup; user info updated each run.
 *
 * Env:
 *   DATABASE_URL          Neon Postgres connection
 *   INSTAGRAM_COOKIES     Instagram login cookie string
 */

import type {
  DirectoryMsg,
  ExtractorClass,
  InstagramSDK,
  Metadata,
  QueueMsg,
} from '@chilfish/gallery-dl-instagram'
import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { neon } from '@neondatabase/serverless'
import { createInsPosts, schema, upsertInsUserInfo } from '@tweets-viewer/database'
import { drizzle } from 'drizzle-orm/neon-http'
import { INSUsernameToTwitter } from './mapping'

const db = drizzle({
  client: neon(process.env.DATABASE_URL!),
  schema,
})

// ─── Convert SDK Metadata (ParsedPost) to IGPost ───

function convertToIGPost(meta: Metadata): IGPost | null {
  const files = (meta._files as Record<string, unknown>[]) ?? []
  if (files.length === 0)
    return null

  const user = meta.user as Record<string, unknown> | undefined

  const avatar: string | undefined
    = (user?.hd_profile_pic_url_info as { url?: string } | undefined)?.url
      ?? (user?.profile_pic_url_hd as string | undefined)
      ?? (user?.profile_pic_url as string | undefined)
      ?? (meta.profile_pic_url_hd as string | undefined)
      ?? (meta.profile_pic_url as string | undefined)

  let audio: IGPost['audio']
  for (const f of files) {
    if (f.audio_title || f.audio_url) {
      audio = {
        title: f.audio_title as string | undefined,
        subtitle: f.audio_subtitle as string | undefined,
        artist: f.audio_artist as string | undefined,
        duration: f.audio_duration as number | undefined,
        cover_artwork_uri: f.audio_cover_artwork_uri as string | undefined,
        cover_artwork_thumbnail_uri: f.audio_cover_artwork_thumbnail_uri as string | undefined,
        has_lyrics: f.audio_has_lyrics as boolean | undefined,
        is_explicit: f.audio_is_explicit as boolean | undefined,
      }
      break
    }
  }

  const media: IGPost['media'] = files.map(f => ({
    num: f.num as number,
    media_id: f.media_id as string,
    shortcode: f.shortcode as string | undefined,
    display_url: f.display_url as string,
    video_url: (f.video_url as string) ?? null,
    width: f.width as number,
    height: f.height as number,
    width_original: f.width_original as number | undefined,
    height_original: f.height_original as number | undefined,
    type: f.video_url ? 'video' as const : 'photo' as const,
    tagged_users: (f.tagged_users as unknown[] | undefined)?.length
      ? f.tagged_users as IGPost['media'][number]['tagged_users']
      : undefined,
  }))

  return {
    id: (meta.post_shortcode as string) ?? '',
    post_id: (meta.post_id as string) ?? '',
    url: (meta.post_url as string) ?? '',
    username: (meta.username as string) ?? '',
    fullname: (meta.fullname as string) ?? '',
    description: (meta.description as string) ?? '',
    tags: meta.tags as string[] | undefined,
    likes: (meta.likes as number) ?? 0,
    type: ((meta.type as string) === 'reel' ? 'reel' : 'post') as IGPost['type'],
    media,
    avatar_url: avatar,
    created_at: (meta.post_date as string) ?? (meta.date as string),
    location_name:
      (meta.location_slug as string | undefined)
      ?? (meta.location_name as string | undefined),
    coauthors: meta.coauthors as IGPost['coauthors'],
    verified: (user?.is_verified ?? meta.is_verified) as boolean | undefined,
    audio,
  }
}

/** Extract IGUserInfo from the first post of a batch */
function extractUserInfo(posts: IGPost[]): IGUserInfo | null {
  if (posts.length === 0)
    return null
  const p = posts[0]
  return {
    username: p.username,
    fullname: p.fullname,
    avatar_url: p.avatar_url,
    verified: p.verified,
    posts_count: posts.length,
  }
}

// ─── Recursive collection ───

async function collectAll(
  ig: InstagramSDK,
  url: string,
  since: Date,
): Promise<IGPost[]> {
  const all: IGPost[] = []

  for await (const msg of ig.extract(url)) {
    if (msg.type === 'directory') {
      const meta = (msg as DirectoryMsg).metadata
      // SDK yields newest→oldest; stop once we pass the date cutoff
      const postDate = (meta.post_date ?? meta.date) as string | undefined
      if (postDate && new Date(postDate) < since)
        return all
      const post = convertToIGPost(meta)
      if (post) {
        all.push(post)
        if (all.length % 10 === 0)
          console.log(`  ... ${all.length} posts`)
      }
    }
    else if (msg.type === 'queue') {
      const children = await handleQueue(ig, msg as QueueMsg, since)
      for (const c of children) {
        if (c.created_at && new Date(c.created_at) < since)
          return all
        all.push(c)
      }
    }
  }

  return all
}

async function handleQueue(
  ig: InstagramSDK,
  msg: QueueMsg,
  since: Date,
): Promise<IGPost[]> {
  const ExtrClass = msg.metadata._extractor as
    | (ExtractorClass & { new(opts: Record<string, unknown>): { initialize: () => Promise<void>, [Symbol.asyncIterator]: () => AsyncGenerator<any, void, unknown> } })
    | undefined
  if (!ExtrClass)
    return []

  const url = msg.url
  let match = ExtrClass.pattern.exec(url)
  if (!match)
    match = ExtrClass.pattern.exec(url.replace(/\/$/, ''))

  if (!match)
    return []

  const child = Reflect.construct(ExtrClass, [{
    url,
    match,
    config: ig.config,
    http: ig.http,
    storage: ig.storage,
    log: ig.log,
  }]) as { initialize: () => Promise<void>, [Symbol.asyncIterator]: () => AsyncGenerator<any, void, unknown> }

  await child.initialize()

  const posts: IGPost[] = []
  for await (const m of child) {
    if (m.type === 'directory') {
      const meta = (m as DirectoryMsg).metadata
      const postDate = (meta.post_date ?? meta.date) as string | undefined
      if (postDate && new Date(postDate) < since)
        break
      const post = convertToIGPost(meta)
      if (post)
        posts.push(post)
    }
  }
  return posts
}

// ─── Per-user fetch ───

async function fetchUser(ig: InstagramSDK, twitterUsername: string, insUsername: string, since: Date): Promise<void> {
  const url = `https://www.instagram.com/${insUsername}/`
  console.log(`\n@${insUsername} (twitter: @${twitterUsername}) — extracting since ${since.toISOString().split('T')[0]}...`)

  ig.config.set('extractor.instagram.user.include', 'all')
  const posts = await collectAll(ig, url, since)

  if (posts.length === 0) {
    console.log(`  No posts found for @${insUsername}`)
    return
  }

  console.log(`  Collected ${posts.length} posts`)

  const user = extractUserInfo(posts)
  if (user) {
    await upsertInsUserInfo({
      db,
      twitterUsername,
      insUsername,
      user,
    })
    console.log(`  User: ${user.fullname} (@${user.username}) → users.ins_json_data`)
  }

  const result = await createInsPosts({ db, posts, username: twitterUsername })
  console.log(`  Posts: ${result.rowCount} new / ${posts.length} total`)
}

// ─── Entry ───

export async function fetchInsDaily(): Promise<void> {
  const cookies = process.env.INSTAGRAM_COOKIES
  if (!cookies) {
    console.error('INSTAGRAM_COOKIES not set — skipping IG fetch')
    return
  }

  const entries = Object.entries(INSUsernameToTwitter) as [string, string][]
  if (entries.length === 0) {
    console.warn('No Instagram users in mapping — skipping IG fetch')
    return
  }

  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  console.log(`IG Daily Fetch — ${entries.length} user(s): ${entries.map(([ins]) => ins).join(', ')} (since ${since.toISOString().split('T')[0]})`)

  const ig = await createSDK({ cookies })

  for (const [ins, twitter] of entries) {
    try {
      await fetchUser(ig, twitter, ins, since)
    }
    catch (err: any) {
      console.error(`  Error @${ins}:`, err.message)
    }
  }

  console.log('\nIG daily fetch complete.')
}

// Allow standalone run
const isMain = process.argv[1]?.includes('fetch-ins-daily')
if (isMain) {
  fetchInsDaily().catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
}
