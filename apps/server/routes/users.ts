import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'

import type { AppType } from '../common'
import { getAllUsers, getUserByName } from '@tweets-viewer/database'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { getContext } from 'hono/context-storage'
import { errorResponse, jsonResponse, nameParameter } from '../utils/openapi'
import { USERS_CACHE_CONTROL } from './tweets'

const app = new Hono<AppType>()

app.get('/all', describeRoute({
  tags: ['Users'],
  summary: '获取所有用户',
  description: '数据库中记录的所有用户信息。',
  responses: {
    200: jsonResponse('用户列表', 'EnrichedUserList'),
  },
}), async (c) => {
  const { db } = getContext<AppType>().var

  const users: EnrichedUser[] = await getAllUsers(db)

  c.header('Cache-Control', USERS_CACHE_CONTROL)
  return c.json(users)
})

app.get('/get/:name', describeRoute({
  tags: ['Users'],
  summary: '获取指定用户信息',
  parameters: [nameParameter()],
  responses: {
    200: jsonResponse('用户信息', 'EnrichedUser'),
    404: errorResponse,
  },
}), async (c) => {
  const name = c.req.param('name')

  const { db } = getContext<AppType>().var

  const user: EnrichedUser | null = await getUserByName(db, name)
  if (!user)
    return c.json({ error: 'User not found' }, 404)
  c.header('Cache-Control', USERS_CACHE_CONTROL)
  return c.json(user)
})

export default app
