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

/**
 * GET /ins/:name
 *
 * :name = twitter userName (not IG username).
 * Looks up IG user info from users.ins_json_data and paginated posts from ins_posts.
 * Returns 404 only when both user info AND posts are empty.
 */
app.get('/:name', async (c) => {
  const db = c.var.db
  const twitterUsername = c.req.param('name')
  const page = Number(c.req.query('page') || 1)

  const [user, posts] = await Promise.all([
    getInsUserByName(db, twitterUsername),
    getInsPosts({ db, username: twitterUsername, page, pageSize: PAGE_SIZE }),
  ])

  if (!user && posts.data.length === 0) {
    return c.json({ user: null, posts } satisfies InsPageResponse, 404)
  }

  return c.json({ user, posts } satisfies InsPageResponse)
})

export default app
