import type { IGPost, IGUserInfo, PaginatedResponse } from '@tweets-viewer/shared'
import type { AppType } from '../common'
import { getInsPosts, getInsUserByName } from '@tweets-viewer/database'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { Hono } from 'hono'

const app = new Hono<AppType>()

interface InsPageResponse {
  user: IGUserInfo | null
  posts: PaginatedResponse<IGPost>
}

app.get('/:name', async (c) => {
  const db = c.var.db
  const name = c.req.param('name')
  const page = Number(c.req.query('page') || 1)

  const [user, posts] = await Promise.all([
    getInsUserByName(db, name),
    getInsPosts({ db, username: name, page, pageSize: PAGE_SIZE }),
  ])

  if (!user) {
    return c.json({ user: null, posts } satisfies InsPageResponse, 404)
  }

  return c.json({ user, posts } satisfies InsPageResponse)
})

export default app
