/** 可携带创建时间的对象（推文用 created_at，兼容 createdAt 兜底）。 */
interface DateCarrier {
  created_at?: string
  createdAt?: string
}

export interface DayGroup<T> {
  /** yyyy-MM-dd */
  dateKey: string
  tweets: T[]
}

/** 解析创建时间的本地日期键（yyyy-MM-dd）；无法解析时返回空串（渲染侧用兜底文案）。 */
function getDateKey<T extends DateCarrier>(tweet: T): string {
  const source = tweet.created_at ?? tweet.createdAt
  if (!source)
    return ''
  const date = new Date(source)
  if (Number.isNaN(date.getTime()))
    return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 把推文按自然日分组（连续段分组，保持原始顺序）。
 * 用于主时间线的「跨天日期分隔线」（iOS 消息分组范式）：
 * 只在日期变化处切分，不重新排序，因此无限滚动追加后分组自然扩展。
 */
export function groupTweetsByDay<T extends DateCarrier>(tweets: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  for (const tweet of tweets) {
    const dateKey = getDateKey(tweet)
    const last = groups[groups.length - 1]
    if (last && last.dateKey === dateKey) {
      last.tweets.push(tweet)
    }
    else {
      groups.push({ dateKey, tweets: [tweet] })
    }
  }
  return groups
}
