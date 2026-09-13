/**
 * llms.txt 构建器单测（llmstxt.org 规范形状）：
 * - H1 标题 → blockquote 简介 → `## ` 分区 → `- [文本](链接): 描述` 子弹列表
 * - 纯 markdown（无 HTML / 表格 / 代码块）
 * - 站点页面用相对链接，API / 文档用外部绝对链接
 * - 覆盖全部前端路由与后端端点
 */
import { apiUrl } from '@tweets-viewer/shared'
import { describe, expect, it } from 'vitest'
import { apiEndpoints, buildLlmsTxt } from '../llms'

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt()
  const lines = txt.split('\n')

  it('以 H1 标题开头，后跟 blockquote 简介', () => {
    expect(lines[0]).toBe('# Tweets Viewer')
    expect(lines[1]).toBe('')
    expect((lines[2] ?? '').startsWith('> ')).toBe(true)
  })

  it('在 H2 分区下以链接子弹列表组织', () => {
    expect(txt).toContain('## Pages')
    expect(txt).toContain('## Backend API')
    expect(txt).toContain('## Machine Readable')
    expect(txt).toContain('## Documentation')

    const linkBullets = lines.filter(l => l.trim().startsWith('- ') && l.includes(']('))
    expect(linkBullets.length).toBeGreaterThan(10)
    for (const line of linkBullets)
      expect(line).toMatch(/^- \[[^\]]+\]\([^)]+\): /)
  })

  it('是纯 markdown：无 HTML 标签、无表格、无代码块', () => {
    expect(txt).not.toMatch(/<[a-z/]/i)
    expect(lines.some(l => l.includes('|'))).toBe(false)
    expect(txt).not.toContain('```')
  })

  it('站点页面用相对链接，API 与文档用外部绝对链接', () => {
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1] as string)

    const relative = hrefs.filter(h => h.startsWith('/'))
    const absolute = hrefs.filter(h => h.startsWith('https://'))

    // 站点页面（Pages / Machine Readable）用相对链接，任意域名可用
    expect(relative).toEqual(expect.arrayContaining([
      '/',
      '/search',
      '/memo',
      '/sitemap.xml',
      '/robots.txt',
    ]))
    // 外部链接仅指向 API 与 GitHub raw 文档
    for (const h of absolute) {
      expect(
        h.startsWith(`${apiUrl}/`)
        || h.startsWith('https://raw.githubusercontent.com/Chilfish/tweets-viewer/'),
      ).toBe(true)
    }
  })

  it('machine Readable 列出后端 OpenAPI 规范', () => {
    expect(txt).toContain(`[OpenAPI 3.1 规范](${apiUrl}/openapi.json)`)
  })

  it('覆盖全部前端路由', () => {
    expect(txt).toContain('](/tweets/')
    expect(txt).toContain('](/media/')
    expect(txt).toContain('](/ins/')
    expect(txt).toContain('](/search)')
    expect(txt).toContain('](/memo)')
  })

  it('覆盖全部后端端点，且标签唯一', () => {
    const labels = [...txt.matchAll(/^- \[([^\]]+)\]/gm)].map(m => m[1] as string)
    for (const endpoint of apiEndpoints)
      expect(labels).toContain(endpoint.label)

    expect(new Set(labels).size).toBe(labels.length)
  })

  it('apiEndpoints 均为 GET 且 href 指向 v3 基址', () => {
    for (const endpoint of apiEndpoints) {
      expect(endpoint.label.startsWith('GET ')).toBe(true)
      expect(endpoint.href.startsWith(`${apiUrl}/v3/`)).toBe(true)
    }
  })
})
