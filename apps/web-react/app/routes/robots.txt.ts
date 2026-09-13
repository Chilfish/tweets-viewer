import type { Route } from './+types/robots.txt'

/**
 * GET /robots.txt — 爬虫规则。
 *
 * 站点为全公开、只读的归档阅读器，无私有路径，故整体 `Allow: /`；
 * 仅声明站点地图位置。注入当前部署域名，任意域名下均可用。
 */
export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
