/** 可携带创建时间的对象（推文用 created_at，兼容 createdAt 兜底）。 */
interface DateCarrier {
  created_at?: string
  createdAt?: string
}

export interface YearGroup<T> {
  year: number
  tweets: T[]
}

/** 解析创建时间的年份；无法解析时返回 0（渲染侧用兜底文案）。 */
function getYear<T extends DateCarrier>(tweet: T): number {
  const source = tweet.created_at ?? tweet.createdAt
  if (!source)
    return 0
  const date = new Date(source)
  return Number.isNaN(date.getTime()) ? 0 : date.getFullYear()
}

/**
 * 把推文按年份分组（连续段分组，保持原始顺序）。
 * 用于「那年今日」仪式感体验：只在年份变化处切分，不重新排序，
 * 因此无限滚动追加旧年份数据后分组自然扩展。
 */
export function groupTweetsByYear<T extends DateCarrier>(tweets: T[]): YearGroup<T>[] {
  const groups: YearGroup<T>[] = []
  for (const tweet of tweets) {
    const year = getYear(tweet)
    const last = groups[groups.length - 1]
    if (last && last.year === year) {
      last.tweets.push(tweet)
    }
    else {
      groups.push({ year, tweets: [tweet] })
    }
  }
  return groups
}
