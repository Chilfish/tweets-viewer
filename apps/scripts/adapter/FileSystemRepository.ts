import type { InsertTweet } from '@tweets-viewer/database'
import type { User } from '@tweets-viewer/shared'
import type { ITweetRepository } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'

interface UserIndexEntry {
  restId: string
  screenName: string
  createdAt: string // ISO Date string
}

export class FileSystemRepository implements ITweetRepository {
  private baseDir: string
  private indexFile: string

  constructor(baseDir: string = './data/tweets') {
    this.baseDir = baseDir
    this.indexFile = path.join(this.baseDir, 'users.json')
  }

  private getTweetFilePath(screenName: string): string {
    return path.join(this.baseDir, `${screenName}-tweets.json`)
  }

  private async ensureDir() {
    try {
      await fs.access(this.baseDir)
    }
    catch {
      await fs.mkdir(this.baseDir, { recursive: true })
    }
  }

  async getUsersWithLatestTweetDate(): Promise<
    { restId: string, createdAt: Date }[]
  > {
    await this.ensureDir()

    try {
      const content = await fs.readFile(this.indexFile, 'utf-8')
      const users: UserIndexEntry[] = JSON.parse(content)

      return users.map(u => ({
        restId: u.restId,
        createdAt: new Date(u.createdAt),
      }))
    }
    catch (e) {
      // 如果文件不存在或解析失败，视为没有任何同步记录
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      console.warn('[FileSystem] Failed to read users.json index', e)
      return []
    }
  }

  /**
   * 保存推文并更新 users.json 索引
   */
  async saveUserTweets(
    user: Pick<User, 'screenName' | 'restId'> & { tweetEnd: Date },
    newTweets: InsertTweet[],
  ): Promise<number> {
    if (newTweets.length === 0)
      return 0
    await this.ensureDir()

    // 1. 处理推文数据文件 (screenName-tweets.json)
    const tweetFilePath = this.getTweetFilePath(user.screenName)
    let existingTweets: InsertTweet[] = []

    try {
      const content = await fs.readFile(tweetFilePath, 'utf-8')
      existingTweets = JSON.parse(content)
    }
    catch (e) {
      // 文件不存在则为空数组
    }

    // 去重合并 (基于 tweetId)
    const tweetMap = new Map<string, InsertTweet>()
    existingTweets.forEach(t => tweetMap.set(t.tweetId, t))
    newTweets.forEach(t => tweetMap.set(t.tweetId, t))

    const mergedTweets = Array.from(tweetMap.values())
      // 按时间倒序排列 (最新的在前)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

    // 写入推文文件
    await fs.writeFile(tweetFilePath, JSON.stringify(mergedTweets, null, 2))

    // 2. 更新索引文件 (users.json)
    await this.updateUserIndex(user)

    return newTweets.length
  }

  /**
   * 原子性更新索引文件中的单个用户状态
   */
  private async updateUserIndex(
    user: Pick<User, 'screenName' | 'restId'> & { tweetEnd: Date },
  ) {
    let users: UserIndexEntry[] = []

    try {
      const content = await fs.readFile(this.indexFile, 'utf-8')
      users = JSON.parse(content)
    }
    catch (e) {
      // 忽略文件不存在错误，准备新建
    }

    const index = users.findIndex(u => u.restId === user.restId)
    const newEntry: UserIndexEntry = {
      restId: user.restId,
      screenName: user.screenName,
      createdAt: user.tweetEnd.toISOString(),
    }

    if (index !== -1) {
      // 如果新时间比旧时间晚，则更新
      // 注意：这里我们信任传入的 tweetEnd 是最新的
      const oldDate = new Date(users[index].createdAt)
      if (user.tweetEnd > oldDate) {
        users[index] = newEntry
      }
    }
    else {
      // 新用户
      users.push(newEntry)
    }

    await fs.writeFile(this.indexFile, JSON.stringify(users, null, 2))
  }
}
