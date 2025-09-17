import type {
  QuotedTweet,
  ReTweet,
  Tweet,
  TweetMedia,
  User,
  UserInfo,
} from '@tweets-viewer/shared'

// 模拟用户数据
const mockUsers: Record<string, User> = {
  elonmusk: {
    restId: '44196397',
    name: 'Elon Musk',
    screenName: 'elonmusk',
    avatarUrl:
      'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg',
    profileBannerUrl:
      'https://pbs.twimg.com/profile_banners/44196397/1690621312',
    followersCount: 150000000,
    followingCount: 200,
    bio: 'CTO of X (formerly Twitter), CEO of Tesla & SpaceX',
    location: 'Mars',
    website: 'https://x.com',
    birthday: new Date('1971-06-28'),
    createdAt: new Date('2009-06-02'),
    tweetStart: new Date('2022-01-01'),
    tweetEnd: new Date('2024-01-01'),
  },
  vercel: {
    restId: '1273307623645925376',
    name: 'Vercel',
    screenName: 'vercel',
    avatarUrl:
      'https://pbs.twimg.com/profile_images/1565710214019444737/if82cpbS_400x400.jpg',
    profileBannerUrl:
      'https://pbs.twimg.com/profile_banners/1273307623645925376/1598284537',
    followersCount: 500000,
    followingCount: 150,
    bio: 'Develop. Preview. Ship. The best frontend teams use Vercel.',
    location: 'San Francisco, CA',
    website: 'https://vercel.com',
    birthday: new Date('2020-06-17'),
    createdAt: new Date('2020-06-17'),
    tweetStart: new Date('2022-01-01'),
    tweetEnd: new Date('2024-01-01'),
  },
}

// 模拟媒体数据
const sampleMedia: TweetMedia[] = [
  {
    url: 'https://picsum.photos/600/400?random=1',
    type: 'photo',
    width: 600,
    height: 400,
  },
  {
    url: 'https://picsum.photos/600/400?random=2',
    type: 'photo',
    width: 600,
    height: 400,
  },
  {
    url: 'https://picsum.photos/600/400?random=3',
    type: 'photo',
    width: 600,
    height: 400,
  },
  {
    url: 'https://picsum.photos/600/400?random=4',
    type: 'photo',
    width: 600,
    height: 400,
  },
]

// 模拟推文内容
const sampleTweets = [
  'Just shipped a new feature that will change everything! 🚀',
  "Working on something exciting. Can't wait to share it with you all!",
  'The future is looking bright ☀️',
  'Sometimes the best solution is the simplest one.',
  'Coffee ☕ + Code 💻 = Magic ✨',
  'Building the next generation of web applications',
  'Open source is the way forward 🌟',
  'Design is not just what it looks like and feels like. Design is how it works.',
  'The only way to do great work is to love what you do.',
  'Innovation distinguishes between a leader and a follower.',
  'Stay hungry, stay foolish.',
  'Code never lies, comments sometimes do.',
  'First, solve the problem. Then, write the code.',
  'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
  'Programs must be written for people to read, and only incidentally for machines to execute.',
]

// 生成随机数
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)]

// 生成用户信息
const generateUserInfo = (screenName: string): UserInfo => {
  const user = mockUsers[screenName] || mockUsers['elonmusk']
  return {
    name: user.name,
    screenName: user.screenName,
    avatarUrl: user.avatarUrl,
  }
}

// 生成推文媒体
const generateMedia = (): TweetMedia[] => {
  const mediaCount = randomInt(0, 10) > 7 ? randomInt(1, 4) : 0
  return Array.from({ length: mediaCount }, (_, index) => ({
    ...sampleMedia[index % sampleMedia.length],
    url: `https://picsum.photos/600/400?random=${Math.random()}`,
  }))
}

// 生成引用推文
const generateQuotedTweet = (depth = 0): QuotedTweet | null => {
  // 只有20%的概率有引用推文，且不超过1层深度
  if (depth > 0 || randomInt(1, 10) > 2) return null

  const userNames = Object.keys(mockUsers)
  const randomUserName = randomChoice(userNames)

  return {
    user: generateUserInfo(randomUserName),
    tweet: generateTweet(randomUserName, depth + 1, false),
  }
}

// 生成转推
const generateRetweet = (
  originalScreenName: string,
  depth = 0,
): ReTweet | null => {
  // 只有15%的概率是转推，且不超过1层深度
  if (depth > 0 || randomInt(1, 10) > 1.5) return null

  const userNames = Object.keys(mockUsers)
  const randomUserName =
    userNames.find((name) => name !== originalScreenName) || 'vercel'

  return {
    user: generateUserInfo(randomUserName),
    tweet: generateTweet(randomUserName, depth + 1, false),
  }
}

// 生成单条推文
export const generateTweet = (
  screenName: string,
  depth = 0,
  canRetweet = true,
): Tweet => {
  const tweetId = Math.random().toString(36).substring(2, 15)
  const userId = mockUsers[screenName]?.restId || '44196397'

  // 生成创建时间（最近30天内的随机时间）
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const createdAt = new Date(
    thirtyDaysAgo.getTime() +
      Math.random() * (now.getTime() - thirtyDaysAgo.getTime()),
  )

  return {
    id: tweetId,
    tweetId: tweetId,
    userId: userId,
    createdAt: createdAt,
    fullText: randomChoice(sampleTweets),
    media: generateMedia(),
    retweetCount: randomInt(0, 10000),
    quoteCount: randomInt(0, 1000),
    replyCount: randomInt(0, 500),
    favoriteCount: randomInt(0, 50000),
    viewsCount: randomInt(1000, 1000000),
    retweetedStatus: canRetweet ? generateRetweet(screenName, depth) : null,
    quotedStatus: generateQuotedTweet(depth),
  }
}

// 获取用户信息
export const getUser = (screenName: string): User => {
  return mockUsers[screenName] || mockUsers['elonmusk']
}

export const fetchUsers = () => mockUsers

// 生成推文列表
export const generateTweets = (screenName: string, count: number): Tweet[] => {
  return Array.from({ length: count }, () => generateTweet(screenName))
}

// 模拟API延迟
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// API查询参数接口（为未来API对接准备）
export interface TweetsQueryParams {
  sortBy?: 'date'
  sortOrder?: 'asc' | 'desc'
  startDate?: Date | null
  endDate?: Date | null
}

// 分页获取推文
export const getTweets = async (
  screenName: string,
  page: number = 1,
  pageSize: number = 10,
  params?: TweetsQueryParams,
): Promise<{ tweets: Tweet[]; hasMore: boolean }> => {
  await delay(randomInt(300, 800)) // 模拟网络延迟

  let tweets = generateTweets(screenName, pageSize)

  // 在mock阶段应用筛选（未来会在API层处理）
  if (params?.startDate || params?.endDate) {
    tweets = tweets.filter((tweet) => {
      const tweetDate = new Date(tweet.createdAt)
      if (params.startDate && tweetDate < params.startDate) return false
      if (params.endDate && tweetDate > params.endDate) return false
      return true
    })
  }

  // 在mock阶段应用排序（未来会在API层处理）
  if (params?.sortBy === 'date') {
    tweets.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return params.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
  }

  // 模拟是否还有更多数据（90%的概率有更多）
  const hasMore = page < 20 && randomInt(1, 10) > 1

  return {
    tweets,
    hasMore,
  }
}
