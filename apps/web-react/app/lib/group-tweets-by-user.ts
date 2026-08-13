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

function getUserName<T extends UserCarrier>(tweet: T): string {
  return tweet.user?.screen_name ?? tweet.user?.userName ?? 'unknown'
}

/**
 * 把推文按作者分组（连续段分组，保持原始顺序）。
 * 用于全局搜索（跨用户检索）：结果按用户分组展示，
 * 只在作者变化处切分，不重新排序，无限滚动追加后分组自然扩展。
 */
export function groupTweetsByUser<T extends UserCarrier>(tweets: T[]): UserGroup<T>[] {
  const groups: UserGroup<T>[] = []
  for (const tweet of tweets) {
    const userName = getUserName(tweet)
    const last = groups[groups.length - 1]
    if (last && last.userName === userName) {
      last.tweets.push(tweet)
    }
    else {
      groups.push({
        userName,
        displayName: tweet.user?.name,
        avatarUrl: tweet.user?.profile_image_url_https,
        tweets: [tweet],
      })
    }
  }
  return groups
}
