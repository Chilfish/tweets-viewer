import type { LinkPreviewCard } from './card'
import type { Entity } from './entities'
import type { MediaDetails } from './media'
import type { TweetUser } from './user'

export interface EnrichedTweet {
  // --- 唯一标识与基础元数据 ---
  id: string
  url: string
  lang: string
  created_at: string // ISO 8601 格式
  text: string
  user: TweetUser

  // --- 内容实体 ---
  /** 格式化后的实体数组 (Hashtags, Mentions, URLs) */
  entities: Entity[]
  media_details?: MediaDetails[]
  /** 是否为行内媒体显示 */
  is_inline_media?: boolean

  // --- 社交互动计数 (Engagement Metrics) ---
  reply_count: number
  view_count: number
  like_count: number
  quote_count?: number

  // --- 关联关系与状态 ---
  /** 如果是回复，记录父推文 ID */
  parent_id?: string
  /** 如果是转发，记录原始推文 ID */
  retweeted_original_id?: string

  // --- 引用推文处理 ---
  quoted_tweet_id?: string
  /** 递归引用，允许树状展示 */
  quoted_tweet?: EnrichedTweet

  // --- 外部扩展 ---
  /** 链接预览卡片 */
  card?: LinkPreviewCard
}
