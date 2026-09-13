/**
 * sitemap.xml 构建器单测：XML 结构合法、静态页 + 每用户页齐全、特殊字符转义。
 */
import { describe, expect, it } from 'vitest'
import { buildSitemap, buildSitemapUrls } from '../sitemap'

const BASE = 'https://tweet.chilfish.top'

describe('buildSitemapUrls', () => {
  it('无用户时仅含静态页', () => {
    const urls = buildSitemapUrls(BASE, [])
    expect(urls.map(u => u.loc)).toEqual([
      `${BASE}/`,
      `${BASE}/memo`,
      `${BASE}/search`,
    ])
  })

  it('每个用户产出时间线 + 媒体两条', () => {
    const urls = buildSitemapUrls(BASE, ['alice', 'bob'])
    expect(urls).toHaveLength(3 + 2 * 2)
    expect(urls.map(u => u.loc)).toEqual(expect.arrayContaining([
      `${BASE}/tweets/alice`,
      `${BASE}/media/alice`,
      `${BASE}/tweets/bob`,
      `${BASE}/media/bob`,
    ]))
  })

  it('把额外条目（如后端 OpenAPI 规范）追加到末尾', () => {
    const extras = [
      { loc: 'https://tweet-api.chilfish.top/openapi.json', changefreq: 'monthly' as const, priority: '0.3' },
    ]
    const urls = buildSitemapUrls(BASE, ['alice'], extras)
    expect(urls.at(-1)?.loc).toBe('https://tweet-api.chilfish.top/openapi.json')
    expect(urls).toHaveLength(3 + 2 + 1)
  })
})

describe('buildSitemap', () => {
  it('输出合法 XML 结构', () => {
    const xml = buildSitemap(BASE, [])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true)

    const open = (xml.match(/<url>/g) ?? []).length
    const close = (xml.match(/<\/url>/g) ?? []).length
    expect(open).toBe(close)
    expect(open).toBe(3)
  })

  it('包含每用户页并携带 changefreq / priority', () => {
    const xml = buildSitemap(BASE, ['alice'])
    expect(xml).toContain(`<loc>${BASE}/tweets/alice</loc>`)
    expect(xml).toContain('<changefreq>weekly</changefreq>')
    expect(xml).toContain('<priority>1.0</priority>')
  })

  it('转义 loc 中的 XML 特殊字符', () => {
    const xml = buildSitemap('https://example.com/?a=1&b=2', [])
    expect(xml).toContain('https://example.com/?a=1&amp;b=2')
    expect(xml).not.toContain('a=1&b=2')
  })
})
