import { getUsers } from '@db/index'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get', async (c) => {
  const users = await getUsers()

  return c.json(users)
})

export default app
