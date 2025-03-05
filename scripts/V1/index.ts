import glob from 'fast-glob'
import { dir, readJson, writeJson } from '../utils'

export type TweetKey = `data-${string}`

export interface TweetConfig {
  name: TweetKey
  version: string
  tweetRange: {
    start: number
    end: number
  }
  [key: string]: any
}

export interface User {
  name: string // as id
  screen_name: string
  avatar_url: string
}

export const dataFolder = dir('D:/Downloads/tweet-data')
export const staticFolder = dir('D:/Codes/static/tweet')

const exclude = ['chilfish_', 'mika_d_dr']
export const dataFolders = await glob(`${dataFolder}/*`, {
  onlyDirectories: true,
}).then((folders) =>
  folders.filter((folder) => !exclude.some((el) => folder.includes(el))),
)

export const config = {
  versions: [] as TweetConfig[],
  async set(config: Partial<TweetConfig>) {
    const index = this.versions.findIndex((v) => v.name === config.name)
    if (index !== -1) {
      this.versions[index] = { ...this.versions[index], ...config }
    } else {
      this.versions.push(config as TweetConfig)
    }

    await writeJson(`${staticFolder}/versions.json`, this.versions, 'write', 0)
  },
  async get() {
    if (!this.versions.length) await this.init()

    return this.versions
  },
  async init() {
    this.versions = await readJson<TweetConfig[]>(
      `${staticFolder}/versions.json`,
      [],
    )

    return this.versions
  },
}
