/**
 * Daily Instagram fetch via @chilfish/gallery-dl-instagram SDK.
 *
 * Reads tracked usernames from ins_users table, fetches latest posts
 * via SDK extract(), and upserts to database. post_id unique constraint
 * handles dedup; user info updated each run (avatar/fullname may change).
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
import { createInsPosts, createInsUser, schema } from '@tweets-viewer/database'
import { drizzle } from 'drizzle-orm/neon-http'

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
  maxPosts?: number,
): Promise<IGPost[]> {
  const all: IGPost[] = []

  for await (const msg of ig.extract(url)) {
    if (msg.type === 'directory') {
      const post = convertToIGPost((msg as DirectoryMsg).metadata)
      if (post) {
        all.push(post)
        if (all.length % 10 === 0)
          console.log(`  ... ${all.length} posts`)
        if (maxPosts !== undefined && all.length >= maxPosts)
          return all
      }
    }
    else if (msg.type === 'queue') {
      if (maxPosts !== undefined && all.length >= maxPosts)
        return all
      const budget = maxPosts !== undefined ? maxPosts - all.length : undefined
      const children = await handleQueue(ig, msg as QueueMsg, budget)
      for (const c of children) all.push(c)
    }
  }

  return all
}

async function handleQueue(
  ig: InstagramSDK,
  msg: QueueMsg,
  remaining?: number,
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
    if (remaining !== undefined && posts.length >= remaining)
      break
    if (m.type === 'directory') {
      const post = convertToIGPost((m as DirectoryMsg).metadata)
      if (post)
        posts.push(post)
    }
  }
  return posts
}

// ─── Per-user fetch ───

async function fetchUser(ig: InstagramSDK, username: string): Promise<void> {
  const url = `https://www.instagram.com/${username}/`
  console.log(`\n@${username} — extracting...`)

  ig.config.set('extractor.instagram.user.include', 'all')
  const posts = await collectAll(ig, url)

  if (posts.length === 0) {
    console.log(`  No posts found for @${username}`)
    return
  }

  console.log(`  Collected ${posts.length} posts`)

  const user = extractUserInfo(posts)
  if (user) {
    await createInsUser({ db, user })
    console.log(`  User: ${user.fullname} (@${user.username})`)
  }

  const result = await createInsPosts({ db, posts, username })
  console.log(`  Posts: ${result.rowCount} new / ${posts.length} total`)
}

// ─── Entry ───

export async function fetchInsDaily(): Promise<void> {
  const cookies = process.env.INSTAGRAM_COOKIES
  if (!cookies) {
    console.error('INSTAGRAM_COOKIES not set — skipping IG fetch')
    return
  }

  // Read usernames from ins_users table
  const users = await db
    .select({ username: schema.insUsersTable.username })
    .from(schema.insUsersTable)

  const trackedUsers = users.map(u => u.username)

  if (trackedUsers.length === 0) {
    console.warn('No users in ins_users table — skipping IG fetch')
    return
  }

  console.log(`IG Daily Fetch — ${trackedUsers.length} user(s): ${trackedUsers.join(', ')}`)

  const ig = await createSDK({ cookies })

  for (const username of trackedUsers) {
    try {
      await fetchUser(ig, username)
    }
    catch (err: any) {
      console.error(`  Error @${username}:`, err.message)
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
