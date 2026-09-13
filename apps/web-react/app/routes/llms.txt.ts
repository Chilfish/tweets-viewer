import type { Route } from './+types/llms.txt'
import { buildLlmsTxt } from '~/lib/llms'

/**
 * GET /llms.txt — AI 爬虫 / 代理友好的站点索引（llmstxt.org 规范）。
 *
 * 纯 markdown：H1 标题 → blockquote 简介 → 说明 → `## ` 分区（Pages /
 * Backend API / Machine Readable / Documentation），每区为 `- [文本](链接):
 * 描述` 子弹列表。站点页面用相对链接（任意部署域名下可用），API 与仓库文档
 * 指向外部绝对地址。规范参考：https://llmstxt.org/
 */
export function loader(_args: Route.LoaderArgs) {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'all',
    },
  })
}
