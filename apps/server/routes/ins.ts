import type { IGPost, IGUserInfo, PaginatedResponse } from '@tweets-viewer/shared'
import type { AppType } from '../common'
import { getInsPosts, getInsUserByName } from '@tweets-viewer/database'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { jsonResponse, nameParameter } from '../utils/openapi'

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
app.get('/:name', describeRoute({
  tags: ['Instagram'],
  summary: '获取 IG 用户信息与帖子',
  description: '`:name` 为 twitter userName（非 IG 用户名），服务端经 `users.ins_json_data` 映射。',
  parameters: [
    nameParameter(),
    {
      in: 'query',
      name: 'page',
      required: false,
      description: '页码（offset 定位）',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
  ],
  responses: {
    200: jsonResponse('IG 用户信息 + 分页帖子', 'IGUserPageResponse'),
    404: jsonResponse('该用户无 IG 数据且无帖子', 'IGUserPageResponse'),
  },
}), async (c) => {
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

  c.header('Cache-Control', 'public, max-age=300, s-maxage=3600')
  return c.json({ user, posts } satisfies InsPageResponse)
})

export default app
