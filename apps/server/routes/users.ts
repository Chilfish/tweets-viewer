import type { AppType } from '../../server/common'
import { Hono } from 'hono'
import { getContext } from 'hono/context-storage'

const app = new Hono()

app.get('/get', async (c) => {
  const { db } = getContext<AppType>().var
  // const users = await getUsers(db)
  return c.json([])
})

export default app
