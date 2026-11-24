---
name: tweets-viewer
description: >-
  查询推文 / Instagram 离线归档的只读 API 与命令行工具（无需 API Key）。
  用 scripts/tweets-viewer.ts 按用户拉推文（日期范围、排除回复、keyset 游标）、
  只看含图片/视频的推文、跨库或限用户关键词搜索、回顾「那年今日」、
  查归档年份与条数、列出归档用户、取 IG 帖子与随机归档图、查看服务状态。
  当需要读某人历史推文、确认某人是否已归档、在归档里搜关键词、回顾往年同月同日、
  或按 X 用户名取 IG 帖子时使用。它是抓取入库后的快照，不是实时搜索。
license: MIT
compatibility: 需要 Bun 1.3+（推荐）或 Node 22.18+（原生 TypeScript 支持）与网络访问；单文件 TypeScript，无第三方依赖。
metadata:
  author: Chilfish
  version: "1.1.0"
  base-url: https://tweet-api.chilfish.top
  site: https://tweet.chilfish.top
  repository: https://github.com/Chilfish/tweets-viewer
  updated: "2026-11-24"
---

# Tweets Viewer API

推文 / Instagram 归档的只读检索服务。数据在 PostgreSQL 里，是抓取脚本入库时的快照。
没有发推、点赞、关注等写入接口，也没有「按推文 ID 取单条」的端点。

- 前端: <https://tweet.chilfish.top>（页面导航见 <https://tweet.chilfish.top/llms.txt>）
- API: <https://tweet-api.chilfish.top>
- OpenAPI 3.1: `references/tweets-viewer-openapi.json`（线上同步自 `/openapi.json`，交互文档 `/scalar`）
- 接口契约: <https://github.com/Chilfish/tweets-viewer/blob/main/docs/API_DOCUMENTATION.md>

## 怎么用

先确认脚本位置，再用 Bun 执行：

```bash
# 仓库内优先；在仓库外安装时换成 ~/.agents/skills/tweets-viewer/scripts/tweets-viewer.ts
S=.agents/skills/tweets-viewer/scripts/tweets-viewer.ts
bun "$S" tweets ttisrn_0710 --size 20
```

Windows PowerShell 下路径写法：

```powershell
$S = if (Test-Path .agents/skills/tweets-viewer/scripts/tweets-viewer.ts) {
  '.agents/skills/tweets-viewer/scripts/tweets-viewer.ts'
} else {
  "$HOME/.agents/skills/tweets-viewer/scripts/tweets-viewer.ts"
}
bun $S stats ttisrn_0710
```

任何命令加 `--json` 输出原始 JSON，适合程序解析；不加时输出人读格式。
脚本按 TTY 自动决定是否加颜色，被管道或 Agent 捕获时不输出 ANSI。

## 命令

| 命令 | HTTP 端点 | 必填 | 主要参数 |
| --- | --- | --- | --- |
| `tweets` | `/v3/tweets/get/{name}` | `name` | `--page` / `--cursor` / `--size` / `--reverse` / `--start`+`--end` / `--no-replies` |
| `medias` | `/v3/tweets/medias/{name}` | `name` | `--page` / `--cursor` / `--size` / `--reverse` / `--start`+`--end` |
| `search` | `/v3/tweets/search` | `q` | `--name` / `--page` / `--cursor` / `--size` / `--reverse` |
| `today` | `/v3/tweets/get/{name}/last-years-today` | `name` | `--page` / `--cursor` / `--size` / `--reverse` |
| `today-all` | `/v3/tweets/last-years-today` | 无 | `--page` / `--cursor` / `--size` / `--reverse` |
| `stats` | `/v3/tweets/stats/{name}` | `name` | `--json` |
| `users` | `/v3/users/all` | 无 | `--json` |
| `user` | `/v3/users/get/{name}` | `name` | `--json` |
| `ins` | `/v3/ins/{name}` | `name` | `--page`（`name` 是 X 用户名，不是 IG 用户名） |
| `image` | `/v3/image/get` | 无 | `--name` / `--out` / `--json` |
| `status` | `/` | 无 | `--json` |

运行 `bun "$S" help` 查看完整帮助。

## 参数规则

- **`name`**：X Screen Name，只接受 `[A-Za-z0-9_]+`，最长 50 字符。可直接粘贴
  `https://x.com/ttisrn_0710` 或 `@ttisrn_0710`，脚本会取出句柄；含点号/连字符的输入直接报错。
- **`q`**：1-200 字符；省略 `--name` 即跨用户全库检索。
- **分页**：`--page` 从 1 开始（offset 跳页），`--size` 1-100，默认 10。
  `--cursor` 是 1-19 位十进制 snowflake id（keyset 续载）。两者只能选一个，脚本会拒绝同时传入。
- **排序**：默认新→旧；`--reverse` 改为旧→新。也接受 `--reverse=false` / `--reverse=0`。
- **日期范围**：`--start` / `--end` 用 `YYYY-MM-DD`，必须成对提供，`end` 含当天。
  按排序键的 UTC 自然日筛选；转推按转发发生日归入范围。
- **排除回复**：`--no-replies` 仅 `tweets` 支持。`medias`、`today-all` 本身排除转推。
- **IG 分页**：服务端固定每页 15 条，只支持 `--page`，没有游标。
- **不支持的开关**：例如给 `search` 传 `--start`、给 `ins` 传 `--size`，脚本直接报错，不要静默忽略。

## 分页协议

所有列表返回 `{ data: [...], meta: {...} }`：

```json
{ "data": [], "meta": { "total": 1841, "page": 1, "pageSize": 10, "hasMore": true, "nextCursor": "2124735651220512809" } }
```

- `meta.total` 是**当前过滤条件下**的总数，不是本页条数。
- 跳页用 `meta.page` + `page` 参数；续载用 `meta.nextCursor` + `cursor` 参数。
- `nextCursor` 只在 `hasMore` 为 true 且本页有数据时返回；没有就是到底。
- IG 返回 `meta.hasMore`，但不返回 `nextCursor`；用 `--page` 翻页。

## 输出约定

- 时间戳默认换算成 **JST（UTC+9）**，渲染为 `YYYY-MM-DD HH:mm`。要原始字符串用 `--json`。
- 推文会打印 `url`；引用推文打印被引 URL，转推打印 `RT event <id>`（事件 id，不是原推 id）。
  用 markdown 引用推文时链接该 URL，不要只抄正文。
- `image --out FILE` 才会落盘，并自动创建父目录；不传只打印图片 URL。
  临时文件写到系统临时目录（Windows `$env:TEMP`，类 Unix `$TMPDIR`），不要污染仓库根目录。
- 数据走 stdout，错误走 stderr；成功和失败不会混在一条流里。
- `status.today` 是服务端按北京时间生成的当天时间，原样输出 ISO 字符串，不要当成推文时间。

## 直接调 HTTP

```bash
curl -s 'https://tweet-api.chilfish.top/v3/tweets/get/ttisrn_0710?pageSize=2&noReplies=true'
curl -s 'https://tweet-api.chilfish.top/v3/tweets/stats/ttisrn_0710'

# 搜索关键词含中文/日文时用 -G + --data-urlencode
curl -sG 'https://tweet-api.chilfish.top/v3/tweets/search' \
  --data-urlencode 'q=こんびず' --data-urlencode 'name=ttisrn_0710'
```

完整字段见 `references/data-shapes.md` 与 `references/tweets-viewer-openapi.json`。

## 先判断再重试

| 现象 | 原因 | 动作 |
| --- | --- | --- |
| `data: []` | 用户未归档，或日期/关键词太窄 | 先 `users` 看归档列表，再 `stats <name>` 看年份，然后放宽条件 |
| `medias` 日期范围没生效 | 只传了 `--start` 或 `--end` | 两个一起传；脚本会直接拒绝单边日期 |
| 400 且 `error` 提到 `name` | 用了显示名、含点号/连字符、或超过 50 字符 | 换 X Screen Name；链接和 `@` 由脚本归一化 |
| 400 且 `error` 提到 `cursor` | 不是 1-19 位十进制 snowflake id | 用上一页的 `meta.nextCursor`，不要自己拼 |
| 400 且 `error` 提到 `start` / `end` | 日期格式错误或只给了一边 | 用 `YYYY-MM-DD`，成对提供 |
| `user` 返回 404 | 该用户没有归档记录 | 用 `users` 确认；集合端点对未归档用户返回 200 + 空数组 |
| `ins` 没有用户信息 | `users.ins_json_data` 里没有映射 | 只能读已有归档，先确认该账号已入库 |
| `image` 返回 404 | 该范围内没有带图片的媒体推文 | 去掉 `--name` 或换用户 |
| 日期/「那年今日」对不上 | 「那年今日」按**北京时间**判定当天 | 跨时区时以服务端日期为准 |
| 找不到脚本 | vendored 副本不存在 | 改用 `~/.agents/skills/tweets-viewer/scripts/tweets-viewer.ts` |

不要把本 API 当实时搜索：刚发的推文不会立刻出现，未归档用户也没有数据。

## 维护

- 脚本是单文件 TypeScript，无第三方依赖；命令分发、参数校验、HTTP 与格式化都在
  `scripts/tweets-viewer.ts`，新增命令时顺手补 `help` 与本文命令表。
- 版本号单源：脚本从本文件 frontmatter 的 `metadata.version` 读取，用于 User-Agent。
- API 地址用 `TWEETS_VIEWER_BASE_URL` 覆盖，默认生产地址。
- 接口签名变化时同步三处：`apps/server/routes/*.ts` 的 `describeRoute`、
  `docs/API_DOCUMENTATION.md`、本 skill 的 `references/`。
