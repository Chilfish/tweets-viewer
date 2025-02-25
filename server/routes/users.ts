import type { AppType } from '../../server/common'
import { getUsers } from '@db/index'
import { Hono } from 'hono'
import { getContext } from 'hono/context-storage'

const app = new Hono()

app.get('/get', async (c) => {
  const { db } = getContext<AppType>().var
  const users = await getUsers(db)
  return c.json(users)
})

export default app
