/**
 * app/lib/sitemap.ts
 *
 * sitemap.xml 构建器：首页 + 全局视图（/memo、/search）+ 各归档用户的时间线 /
 * 媒体页。用户清单由路由 loader 从 `/v3/users/all` 拉取（拉取失败时降级为仅
 * 静态页）。
 *
 * 规范参考：https://www.sitemaps.org/protocol.html
 */

export interface SitemapUrl {
  loc: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: string
}

/** XML 文本转义（用户名理论上仅含 [A-Za-z0-9_]，仍防御性处理） */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 站点地图 URL 清单（静态页 + 每个归档用户的时间线 / 媒体页 + 额外条目） */
export function buildSitemapUrls(
  baseUrl: string,
  userNames: string[] = [],
  extras: SitemapUrl[] = [],
): SitemapUrl[] {
  return [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/memo`, changefreq: 'daily', priority: '0.7' },
    { loc: `${baseUrl}/search`, changefreq: 'weekly', priority: '0.5' },
    ...userNames.flatMap(name => [
      { loc: `${baseUrl}/tweets/${name}`, changefreq: 'weekly', priority: '0.8' } as const,
      { loc: `${baseUrl}/media/${name}`, changefreq: 'monthly', priority: '0.6' } as const,
    ]),
    ...extras,
  ]
}

/** sitemap.xml 构建（baseUrl 注入当前部署域名） */
export function buildSitemap(
  baseUrl: string,
  userNames: string[] = [],
  extras: SitemapUrl[] = [],
): string {
  const urls = buildSitemapUrls(baseUrl, userNames, extras)
    .map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
