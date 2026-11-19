import type {
  DirectoryMsg,
  InstagramExtractorOptions,
  InstagramSDK,
  Message,
  Metadata,
  QueueMsg,
} from '@chilfish/gallery-dl-instagram'
import type { IGMedia, IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { InstagramInfoExtractor, InstagramUserExtractor } from '@chilfish/gallery-dl-instagram'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'

/**
 * 父子提取器共享的会话 token。
 *
 * 0.2.7 起用户 feed 走 doc_id GraphQL，`lsd` 与 `wwwClaim` 需要跨子提取器复用，
 * 否则每个子类都要重新拉首页换 token。
 */
export interface IgSessionState {
  csrfToken: { value: string }
  wwwClaim: { value: string }
  lsdToken: { value: string }
}

/** 一次抓取会话：SDK 实例 + 共享 token。 */
export interface IgSession {
  sdk: InstagramSDK
  state: IgSessionState
}

/** 抓取会话：只依赖 SDK 的公开导出面。 */
export async function createSession(cookies: string): Promise<IgSession> {
  const sdk = await createSDK({ cookies })
  const csrfToken = extractCsrfToken(cookies)
  return {
    sdk,
    state: {
      csrfToken: { value: csrfToken },
      wwwClaim: { value: '0' },
      lsdToken: { value: '' },
    },
  }
}

/** 从 Cookie 串里取 csrftoken；子提取器需要它发送 X-CSRFToken。 */
export function extractCsrfToken(cookies: string): string {
  const match = /(?:^|;\s*)csrftoken=([^;]+)/.exec(cookies)
  return match?.[1] ?? ''
}

function userRoot(username: string): string {
  return `https://www.instagram.com/${username}/`
}

interface ChildExtractor {
  initialize: () => Promise<void>
  [Symbol.asyncIterator]: () => AsyncGenerator<Message, void, unknown>
}

interface ExtractorConstructor {
  readonly pattern: RegExp
  new (opts: InstagramExtractorOptions): ChildExtractor
}

/** 用会话的共享配置与 token 构造提取器，等价于 SDK 内部的 `_resolve`。 */
function createExtractor(
  session: IgSession,
  ExtrClass: ExtractorConstructor,
  url: string,
): ChildExtractor {
  const match = ExtrClass.pattern.exec(url) ?? ExtrClass.pattern.exec(url.replace(/\/$/, ''))
  if (!match) {
    throw new Error(`无法匹配 IG 地址：${url}`)
  }

  return new ExtrClass({
    url,
    match,
    config: session.sdk.config,
    http: session.sdk.http,
    storage: session.sdk.storage,
    log: session.sdk.log,
    state: session.state,
  })
}

export interface CollectPostsOptions {
  /** 抓哪些子类，默认 `posts,reels`。 */
  include?: string
  /** 只要这个时间之后发布的帖子。 */
  since?: Date
  /** 每个子类最多抓多少条，用于快速验证。 */
  maxPosts?: number
  /** 每收满 N 条回调一次，用于进度日志。 */
  onProgress?: (count: number) => void
}

/**
 * 抓取一个账号的资料。
 *
 * 走 `/info/` 提取器：directory 消息里带关注数、简介、外链与 HD 头像，
 * 不需要内部 REST 客户端。
 */
export async function collectUserInfo(session: IgSession, username: string): Promise<IGUserInfo> {
  const extractor = createExtractor(session, InstagramInfoExtractor, `${userRoot(username)}info/`)
  for await (const msg of extractor) {
    if (msg.type !== 'directory') {
      continue
    }
    const meta = msg.metadata
    const user = meta.user as Record<string, unknown> | undefined
    const hd = user?.hd_profile_pic_url_info as { url?: string } | undefined

    return {
      username: (meta.username as string) ?? username,
      fullname: (meta.fullname as string) ?? '',
      avatar_url: hd?.url
        ?? (meta.profile_pic_url_hd as string | undefined)
        ?? (meta.profile_pic_url as string | undefined),
      verified: Boolean(meta.is_verified ?? user?.is_verified),
      bio: (meta.biography as string) || undefined,
      external_url: (meta.external_url as string) || undefined,
      followers_count: toNumber(meta.follower_count),
      following_count: toNumber(meta.following_count),
      posts_count: toNumber(meta.media_count),
    }
  }

  throw new Error(`@${username} 的资料为空（检查 Cookie 或账号是否可见）`)
}

/** 抓取一个账号的帖子，按 `post_shortcode` 去重。 */
export async function collectUserPosts(
  session: IgSession,
  username: string,
  options: CollectPostsOptions = {},
): Promise<IGPost[]> {
  const { sdk } = session
  sdk.config.set('extractor.instagram.user.include', options.include ?? 'posts,reels')
  if (options.maxPosts) {
    sdk.config.set('extractor.instagram.user.max-posts', options.maxPosts)
  }

  const posts = new Map<string, IGPost>()
  const extractor = createExtractor(session, InstagramUserExtractor, userRoot(username))

  for await (const msg of extractor) {
    if (msg.type === 'queue') {
      for (const post of await drainQueue(session, msg)) {
        addPost(posts, post, options)
      }
    }
    else if (msg.type === 'directory') {
      const post = convertToPost(msg as DirectoryMsg)
      if (post) {
        addPost(posts, post, options)
      }
    }
  }

  return [
    ...posts.values(),
  ]
}

function addPost(posts: Map<string, IGPost>, post: IGPost, options: CollectPostsOptions): void {
  if (options.since && post.created_at && new Date(post.created_at) < options.since) {
    return
  }
  posts.set(post.id, post)
  if (options.onProgress && posts.size % 20 === 0) {
    options.onProgress(posts.size)
  }
}

/** `queue` 消息里带着子提取器类，按 DownloadJob 的方式重新实例化。 */
function instantiateChild(session: IgSession, msg: QueueMsg): ChildExtractor | null {
  const ExtrClass = msg.metadata._extractor as ExtractorConstructor | undefined
  if (!ExtrClass) {
    return null
  }

  return createExtractor(session, ExtrClass, msg.url)
}

async function drainQueue(session: IgSession, msg: QueueMsg): Promise<IGPost[]> {
  const child = instantiateChild(session, msg)
  if (!child) {
    return []
  }

  await child.initialize()

  const posts: IGPost[] = []
  for await (const message of child) {
    if (message.type === 'directory') {
      const post = convertToPost(message as DirectoryMsg)
      if (post) {
        posts.push(post)
      }
    }
    else if (message.type === 'queue') {
      posts.push(...(await drainQueue(session, message as QueueMsg)))
    }
  }
  return posts
}

/** SDK metadata → IGPost。字段与既有的 `ins_posts.jsonData` 保持一致。 */
export function convertToPost(msg: DirectoryMsg): IGPost | null {
  const meta = msg.metadata
  const files = (meta._files as Record<string, unknown>[] | undefined) ?? []
  const user = meta.user as Record<string, unknown> | undefined

  const media: IGMedia[] = files
    .filter(file => typeof file.display_url === 'string' && file.display_url.length > 0)
    .map(file => ({
      num: file.num as number,
      media_id: file.media_id as string,
      shortcode: file.shortcode as string | undefined,
      display_url: file.display_url as string,
      video_url: (file.video_url as string) ?? null,
      width: (file.width as number) ?? 0,
      height: (file.height as number) ?? 0,
      width_original: file.width_original as number | undefined,
      height_original: file.height_original as number | undefined,
      type: file.video_url ? 'video' as const : 'photo' as const,
      tagged_users: (file.tagged_users as IGMedia['tagged_users']) ?? undefined,
    }))

  if (media.length === 0) {
    return null
  }

  const avatar = (user?.hd_profile_pic_url_info as { url?: string } | undefined)?.url
    ?? (user?.profile_pic_url_hd as string | undefined)
    ?? (user?.profile_pic_url as string | undefined)
    ?? (meta.profile_pic_url_hd as string | undefined)
    ?? (meta.profile_pic_url as string | undefined)

  return {
    id: (meta.post_shortcode as string) ?? '',
    post_id: String(meta.post_id ?? ''),
    url: (meta.post_url as string) ?? '',
    username: (meta.username as string) ?? '',
    fullname: (meta.fullname as string) ?? '',
    description: (meta.description as string) ?? '',
    tags: meta.tags as string[] | undefined,
    likes: (meta.likes as number) ?? 0,
    type: (meta.type as string) === 'reel'
      ? 'reel'
      : 'post',
    media,
    avatar_url: avatar,
    created_at: (meta.post_date as string) || (meta.date as string),
    location_name: (meta.location_slug as string | undefined) ?? (meta.location_name as string | undefined),
    coauthors: meta.coauthors as IGPost['coauthors'],
    verified: Boolean(user?.is_verified ?? meta.is_verified),
    audio: extractAudio(meta),
  }
}

function extractAudio(meta: Metadata): IGPost['audio'] {
  const files = (meta._files as Record<string, unknown>[] | undefined) ?? []
  for (const file of files) {
    if (file.audio_title || file.audio_url) {
      return {
        title: file.audio_title as string | undefined,
        subtitle: file.audio_subtitle as string | undefined,
        artist: file.audio_artist as string | undefined,
        duration: file.audio_duration as number | undefined,
        cover_artwork_uri: file.audio_cover_artwork_uri as string | undefined,
        cover_artwork_thumbnail_uri: file.audio_cover_artwork_thumbnail_uri as string | undefined,
        has_lyrics: file.audio_has_lyrics as boolean | undefined,
        is_explicit: file.audio_is_explicit as boolean | undefined,
      }
    }
  }
  return undefined
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }
  if (value && typeof value === 'object' && 'count' in value) {
    const count = (value as { count?: number }).count
    return typeof count === 'number'
      ? count
      : undefined
  }
  return undefined
}
