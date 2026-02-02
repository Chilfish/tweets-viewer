import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'

import type { AppType } from '../common'
import { getAllUsers, getUserByName } from '@tweets-viewer/database'
import { Hono } from 'hono'
import { getContext } from 'hono/context-storage'

const app = new Hono<AppType>()

app.get('/all', async (c) => {
  const { db } = getContext<AppType>().var

  const users: EnrichedUser[] = await getAllUsers(db)

  return c.json(users)
})

app.get('/get/:name', async (c) => {
  const name = c.req.param('name')

  const { db } = getContext<AppType>().var

  const user: EnrichedUser | null = await getUserByName(db, name)
  if (!user)
    return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})

export default app
