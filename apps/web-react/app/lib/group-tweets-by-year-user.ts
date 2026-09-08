/** 可携带创建时间的对象（推文用 created_at，兼容 createdAt 兜底）。 */
interface DateCarrier {
  created_at?: string
  createdAt?: string
}

/** 可携带作者信息的对象（EnrichedTweet 含 user.screen_name / user.userName 兜底）。 */
interface UserCarrier {
  user?: {
    screen_name?: string
    userName?: string
    name?: string
    profile_image_url_https?: string
  }
}

export interface UserGroup<T> {
  /** 作者 screen name（无作者信息时为 'unknown'） */
  userName: string
  /** 作者显示名（可选） */
  displayName?: string
  /** 作者头像 URL（可选） */
  avatarUrl?: string
  tweets: T[]
}

export interface YearUserGroup<T> {
  year: number
  users: UserGroup<T>[]
}

/** 解析创建时间的年份；无法解析时返回 0（渲染侧用兜底文案）。 */
function getYear<T extends DateCarrier>(tweet: T): number {
  const source = tweet.created_at ?? tweet.createdAt
  if (!source)
    return 0
  const date = new Date(source)
  return Number.isNaN(date.getTime()) ? 0 : date.getFullYear()
}

function getUserName<T extends UserCarrier>(tweet: T): string {
  return tweet.user?.screen_name ?? tweet.user?.userName ?? 'unknown'
}

/**
 * 把推文按「年份 → 作者」两层分组，保持原始时间线顺序。
 * 用于全量「那年今日」：年为主分组（章），同年内用户为小节（节）。
 *
 * 与 `groupTweetsByYear`/`groupTweetsByUser` 的「连续段分组」不同——
 * 同年内同一作者可能被不同作者的时间戳打散，这里必须**跨段归并**到同一个小节，
 * 因此用保序 Map 聚合而非连续段切分。年份与作者的小节顺序都按首次出现位置保留。
 */
export function groupTweetsByYearThenUser<T extends DateCarrier & UserCarrier>(tweets: T[]): YearUserGroup<T>[] {
  const years = new Map<number, Map<string, UserGroup<T>>>()

  for (const tweet of tweets) {
    const year = getYear(tweet)
    let yearUsers = years.get(year)
    if (!yearUsers) {
      yearUsers = new Map()
      years.set(year, yearUsers)
    }

    const userName = getUserName(tweet)
    let group = yearUsers.get(userName)
    if (!group) {
      group = {
        userName,
        displayName: tweet.user?.name,
        avatarUrl: tweet.user?.profile_image_url_https,
        tweets: [],
      }
      yearUsers.set(userName, group)
    }
    group.tweets.push(tweet)
  }

  return [...years.entries()].map(([year, userMap]) => ({
    year,
    users: [...userMap.values()],
  }))
}
