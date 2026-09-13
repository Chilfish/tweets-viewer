import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/sitemap.xml'
import type { SitemapUrl } from '~/lib/sitemap'
import { apiUrl } from '@tweets-viewer/shared'
import { buildSitemap } from '~/lib/sitemap'
import { apiClient } from '~/lib/utils'

/**
 * GET /sitemap.xml — 站点地图。
 *
 * 静态页（首页 / 全局那年今日 / 全局搜索）+ 各归档用户的时间线 / 媒体页 +
 * 后端 OpenAPI 规范。用户清单从 `/v3/users/all` 拉取；拉取失败时降级为仅静态页，
 * 绝不因此 500（站点地图是辅助资源，可用性优先于完整性）。
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  let userNames: string[] = []
  try {
    const { data } = await apiClient.get<EnrichedUser[]>('/users/all', { timeout: 5000 })
    userNames = data
      .map(user => user.userName)
      .filter((name): name is string => Boolean(name))
  }
  catch (err) {
    console.error('sitemap: failed to load users:', err)
  }

  // 后端 OpenAPI 规范（挂在 API 根路径）。跨主机条目会被搜索引擎按同主机规则
  // 忽略，此处仅作显式声明，不影响本站条目。
  const extras: SitemapUrl[] = [
    { loc: `${apiUrl}/openapi.json`, changefreq: 'monthly', priority: '0.3' },
  ]

  return new Response(buildSitemap(baseUrl, userNames, extras), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
