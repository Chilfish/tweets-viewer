import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { Context } from 'hono'
import type { AppType } from '../common'
import {
  extractMediaImageUrls,
  getRandomMediaImageTweet,
} from '@tweets-viewer/database'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'
import { errorResponse, jsonResponse, optionalNameParameter } from '../utils/openapi'

const app = new Hono<AppType>()

/** 图片条目：图片链接 + 来源推文完整 JSON */
interface ImageEntry {
  url: string
  tweet: EnrichedTweet
}

const nameSchema = z.string().min(1).max(50).regex(/^\w+$/)

/** 解析可选 `name` query；返回 `null` 表示非法，`undefined` 表示未指定 */
function parseOptionalName(c: Context): string | undefined | null {
  const raw = c.req.query('name')
  if (!raw)
    return undefined
  return nameSchema.safeParse(raw).success ? raw : null
}

/** 从推文随机选一张图片，构造图片条目 */
function pickImageEntry(tweet: EnrichedTweet): ImageEntry | null {
  const urls = extractMediaImageUrls(tweet)
  if (!urls.length)
    return null

  return { url: urls[Math.floor(Math.random() * urls.length)]!, tweet }
}

app.get('/get', describeRoute({
  tags: ['Image'],
  summary: '获取随机图片',
  description: '从归档推文中随机选取一张媒体图片（排除转推），可选 `name` 限定用户；返回图片链接与来源推文。',
  parameters: [optionalNameParameter()],
  responses: {
    200: jsonResponse('随机图片条目（图片链接 + 来源推文）', 'ImageEntry'),
    400: errorResponse,
    404: errorResponse,
  },
}), async (c) => {
  const name = parseOptionalName(c)
  if (name === null)
    return c.json({ error: 'invalid name' }, 400)

  const tweet = await getRandomMediaImageTweet({ db: c.var.db, name })
  const entry = tweet ? pickImageEntry(tweet) : null
  if (!entry)
    return c.json({ error: 'no image available' }, 404)

  c.header('Cache-Control', 'no-store')
  return c.json(entry)
})

export default app
