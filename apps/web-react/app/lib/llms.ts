/**
 * app/lib/llms.ts
 *
 * llms.txt 构建器（LLM 友好的站点索引）。
 *
 * 严格遵循 llmstxt.org 规范：H1 标题 → blockquote 简介 → 若干说明 → `## `
 * 分区（每区为 `- [文本](链接): 描述` 子弹列表），纯 markdown，无 HTML / 表格 /
 * 代码块。站点页面用相对链接（任意部署域名可用）；API 与仓库文档指向外部绝对
 * 地址（GitHub raw markdown，AI 可直接抓取正文）。
 *
 * 规范参考：https://llmstxt.org/
 */
import { apiUrl, fallbackUser } from '@tweets-viewer/shared'

/** 仓库文档基址（GitHub raw markdown，AI 可直接抓取纯文本正文） */
const DOCS_BASE = 'https://raw.githubusercontent.com/Chilfish/tweets-viewer/main'

/** 后端 API 基址（含版本前缀，随构建注入的 API_URL 变化） */
const API_BASE = `${apiUrl}/v3`

/** 后端 OpenAPI 3.1 规范（挂在 API 根路径，非 /v3 下） */
const OPENAPI_URL = `${apiUrl}/openapi.json`

/** llms.txt 示例链接使用的归档用户（仓库 fallback user，有推文与 IG 归档） */
const EXAMPLE_USER = fallbackUser

interface ApiEndpointLink {
  /** 链接文本（方法 + 路径模板） */
  label: string
  /** 演示用链接（填入示例值，AI 可直接拉取） */
  href: string
  description: string
}

/** 后端 API 端点清单（与 HTTP 端点一一对应） */
export const apiEndpoints: ApiEndpointLink[] = [
  { label: 'GET /v3/tweets/get/{name}', href: `${API_BASE}/tweets/get/${EXAMPLE_USER}`, description: '用户推文列表（page / pageSize / reverse / start / end / noReplies / cursor）' },
  { label: 'GET /v3/tweets/medias/{name}', href: `${API_BASE}/tweets/medias/${EXAMPLE_USER}`, description: '用户媒体推文（仅含图片/视频，排除转推）' },
  { label: 'GET /v3/tweets/search', href: `${API_BASE}/tweets/search?q=live`, description: '关键词搜索（q 必填；name 可选，缺省为全库检索）' },
  { label: 'GET /v3/tweets/get/{name}/last-years-today', href: `${API_BASE}/tweets/get/${EXAMPLE_USER}/last-years-today`, description: '单用户「那年今日」（历史同月同日推文）' },
  { label: 'GET /v3/tweets/last-years-today', href: `${API_BASE}/tweets/last-years-today`, description: '全量「那年今日」（跨用户，排除转推）' },
  { label: 'GET /v3/tweets/stats/{name}', href: `${API_BASE}/tweets/stats/${EXAMPLE_USER}`, description: '归档按年统计（年份 + 条数）' },
  { label: 'GET /v3/users/all', href: `${API_BASE}/users/all`, description: '全部归档用户（EnrichedUser[]）' },
  { label: 'GET /v3/users/get/{name}', href: `${API_BASE}/users/get/${EXAMPLE_USER}`, description: '单个归档用户' },
  { label: 'GET /v3/ins/{name}', href: `${API_BASE}/ins/${EXAMPLE_USER}`, description: 'Instagram 用户信息 + 帖子（分页；name 为 twitter userName）' },
  { label: 'GET /v3/image/get', href: `${API_BASE}/image/get`, description: '随机归档图片（图片链接 + 来源推文 JSON），可选 name 限定用户' },
]

/** llms.txt markdown 构建（站点页面相对链接，API / 文档绝对链接） */
export function buildLlmsTxt(): string {
  const apiBullets = apiEndpoints
    .map(e => `- [${e.label}](${e.href}): ${e.description}`)
    .join('\n')

  return `# Tweets Viewer

> Tweets Viewer 是一个「推文归档阅读器」：数据来自离线归档（PostgreSQL），前端提供沉浸式无限滚动 + 精确分页的阅读体验。纯只读、无社交交互。

- 数据源：Twitter/X 归档与 Instagram 归档，经抓取脚本入库后供检索与阅读
- 纯只读：不提供发推、点赞、关注等任何写入功能
- 前端：React Router v8（SPA-first + 静态壳，clientLoader + URL 驱动状态），URL 是视图状态的唯一来源
- 后端：Hono v4 + Drizzle ORM + Neon Postgres（Serverless），部署于 Cloudflare Workers；前端部署于 Vercel
- 分页协议：响应统一为 data + meta（total / page / pageSize / hasMore / nextCursor）；无限滚动用 cursor（keyset）续载，分页器跳页用 page

## Pages

- [/](/): 首页 — Hero + 归档用户入口 + 那年今日入口 + 功能介绍
- [/tweets/{name}](/tweets/${EXAMPLE_USER}): 主时间线 — 全量推文流，支持排序 / 日期范围 / 排除回复 / 无限滚动 + 分页器
- [/media/{name}](/media/${EXAMPLE_USER}): 媒体墙 — 仅图片 / 视频网格
- [/search](/search): 全库搜索 — 跨用户关键词检索（/search/{name} 限定单个用户）
- [/memo](/memo): 那年今日 — 按月日回顾历史同天推文（/memo/{name} 限定单个用户，按年分组）
- [/ins/{name}](/ins/${EXAMPLE_USER}): Instagram — 浏览归档用户的 IG 帖子

## Backend API

${apiBullets}

## Machine Readable

- [OpenAPI 3.1 规范](${OPENAPI_URL}): 后端全部接口的机器可读定义（路径 / 参数 / 响应 schema）；可交互文档 UI 见 ${apiUrl}/scalar
- [/sitemap.xml](/sitemap.xml): XML 站点地图（首页 + 全局视图 + 各归档用户的时间线 / 媒体页）
- [/robots.txt](/robots.txt): 爬虫规则
- [API 文档](${DOCS_BASE}/docs/API_DOCUMENTATION.md): 后端 REST 接口完整契约（PaginatedResponse / keyset 游标 / 错误码）

## Documentation

- [README](${DOCS_BASE}/README.md): 项目介绍、技术栈、快速开始与常用命令
- [文档索引](${DOCS_BASE}/docs/INDEX.md): 项目文档唯一入口（规格 / 架构 / API / 需求 / 规划 / 工程规范 / 尸检报告）
- [功能规格](${DOCS_BASE}/docs/Specification.md): 前端逻辑行为与 URL 路由协议的事实来源
- [架构总览](${DOCS_BASE}/docs/ARCHITECTURE.md): Monorepo 结构、数据流与部署拓扑

## Optional

- [贡献指南](${DOCS_BASE}/CONTRIBUTING.md): 分支模型、提交规范与门禁要求
- [变更日志](${DOCS_BASE}/CHANGELOG.md): 版本变更记录
`
}
