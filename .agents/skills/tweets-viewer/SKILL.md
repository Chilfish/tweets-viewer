---
name: tweets-viewer
description: >-
  推文 / Instagram 归档阅读器 API 使用指南（只读离线归档，无需 API Key）。
  统一入口 scripts/tweets-viewer.ps1：tweets 拉某用户全量推文归档（日期范围 / 排除回复 /
  keyset 游标分页）、medias 只看含图/视频的推文、search 跨库或限定用户关键词检索、
  today / today-all 回顾「那年今日」、stats 查归档覆盖年份与条数、users / user 查归档用户、
  ins 拉 IG 用户信息与帖子、image 取随机归档图、status 看服务状态。
  当需要按用户读历史推文、查某人推文是否已归档、在归档里搜关键词、
  回顾往年同月同日推文、或按用户取 IG 帖子时使用；替代实时搜索 API 的模糊匹配与条数上限。
license: MIT
compatibility: 需要 PowerShell 7+（pwsh）与网络访问；纯 PowerShell 封装，不依赖 curl/python3
metadata:
  author: Chilfish
  version: "1.0.0"
  base-url: https://tweet-api.chilfish.top
  site: https://tweet.chilfish.top
  repository: https://github.com/Chilfish/tweets-viewer
  updated: "2026-09-17"
---

# Tweets Viewer API

推文 / Instagram 归档的只读检索服务：数据来自离线归档（PostgreSQL），支持按用户回放时间线、
跨库搜索与「那年今日」。纯只读——没有发推、点赞、关注等任何写入接口。

- 阅读器前端: https://tweet.chilfish.top（导航与页面说明见 https://tweet.chilfish.top/llms.txt）
- 后端 API: https://tweet-api.chilfish.top
- OpenAPI 3.1 规范: `references/tweets-viewer-openapi.json`（随本 skill 附带；线上同步自 `https://tweet-api.chilfish.top/openapi.json`，交互式文档 https://tweet-api.chilfish.top/scalar）
- 接口契约: https://raw.githubusercontent.com/Chilfish/tweets-viewer/main/docs/API_DOCUMENTATION.md

**关键**：本 API 没有「按推文 ID 取单条」的接口。要定位某条推文，用 `tweets` 按用户翻页、
`search` 按关键词检索，或加 `--start/--end` 收窄日期窗口。

## 何时使用

| 需求 | 用哪个 |
| --- | --- |
| 读某人的历史推文全量归档 | `tweets` |
| 只看某人的图片/视频推文 | `medias` |
| 在归档里按关键词找推文 | `search` |
| 回顾往年同月同日的推文 | `today` / `today-all` |
| 确认某人归档覆盖了哪些年份、多少条 | `stats` |
| 列出所有已归档用户 / 查单个用户资料 | `users` / `user` |
| 按 X 用户名取 IG 帖子 | `ins` |
| 随便取一张归档图 | `image` |
| 排查服务是否正常、缓存了多少 | `status` |

不要把本 API 当作实时搜索用：它是抓取脚本入库后的快照，某用户没归档就没有数据（返回空数组），
也不会自动包含「刚刚」发的推文。

## 快速开始

统一入口 `scripts/tweets-viewer.ps1`（纯 PowerShell，无需 Key）：

```powershell
# 仓库内 vendored 副本优先，回落到全局安装
$S = @("$PWD/.agents/skills", "$HOME/.agents/skills") |
  ForEach-Object { Join-Path $_ 'tweets-viewer/scripts/tweets-viewer.ps1' } |
  Where-Object { Test-Path $_ } | Select-Object -First 1

pwsh -NoProfile -File $S tweets ttisrn_0710 --size 20
pwsh -NoProfile -File $S search "こんびず" --name ttisrn_0710
pwsh -NoProfile -File $S stats ttisrn_0710
pwsh -NoProfile -File $S help
```

任何命令加 `--json` 输出原始 JSON；直接调接口见下方「核心接口」。

## 命令速查

| 命令 | 接口 | 用法 |
| --- | --- | --- |
| `tweets` | `/v3/tweets/get/{name}` | `tweets <name> [--page N\|--cursor C] [--size N] [--reverse] [--start D --end D] [--no-replies]` |
| `medias` | `/v3/tweets/medias/{name}` | `medias <name> [--page N\|--cursor C] [--size N] [--reverse] [--start D --end D]` |
| `search` | `/v3/tweets/search` | `search "q" [--name U] [--page N\|--cursor C] [--size N] [--reverse]` |
| `today` | `/v3/tweets/get/{name}/last-years-today` | `today <name> [--page N\|--cursor C] [--size N]` |
| `today-all` | `/v3/tweets/last-years-today` | `today-all [--page N\|--cursor C] [--size N]` |
| `stats` | `/v3/tweets/stats/{name}` | `stats <name>` |
| `users` | `/v3/users/all` | `users` |
| `user` | `/v3/users/get/{name}` | `user <name>` |
| `ins` | `/v3/ins/{name}` | `ins <name> [--page N]` |
| `image` | `/v3/image/get` | `image [--name U] [--out FILE]` |
| `status` | `/` | `status` |

通用开关：`--json`（原始 JSON）、`--page`、`--size`（1-100）、`--cursor`、`--reverse`、
`--start`/`--end`、`--no-replies`、`--name`、`--out`。

## 参数说明

- `<name>` 是 X **Screen Name**（`^[A-Za-z0-9_]+$`，**不能含点号/连字符**，如 `meeeei.gt` 无效）。
  脚本接受直接粘贴 `https://x.com/ttisrn_0710` 或 `@ttisrn_0710` 并自动取出手柄；非法输入会报错退出。
- `q`：搜索关键词 1-200 字符，按归档全文匹配；省略 `--name` 即跨用户全库检索。
- `--size`：每页 1-100，默认 10。`--page`：从 1 开始，用于跳页；`--cursor`：keyset 游标，
  **优先于 `--page`**，用于滚动续载。
- `--reverse`：`true` = 旧→新（默认新→旧）。
- `--start` / `--end`：ISO 日期 `YYYY-MM-DD`；`tweets` 上两者成对提供，`medias` 上可只给 `--start`。
  需要近期内容时按当前日期推算。
- `--no-replies`：排除回复推文（仅 `tweets`；`medias` 与 `today-all` 本身就排除转推）。
- `--out`：仅 `image`，把图片下载到指定路径。

## 分页协议

所有列表接口统一返回 `{ data: [...], meta: {...} }`：

```json
{ "data": [ ... ], "meta": { "total": 1779, "page": 1, "pageSize": 1, "hasMore": true, "nextCursor": "2099831125908820242" } }
```

- `meta.total` 是**当前过滤条件下的总数**（不是本页条数）
- 翻页两种方式：跳页用 `page`，续载用上一响应的 `meta.nextCursor`
- `nextCursor` 为 `null` 即到底；脚本在人读模式下会打印 `nextCursor:` 或 `(无更多：nextCursor=null)`

## 数据结构要点

- **EnrichedTweet**（`data[]` 元素）：`id`、`text`、`url`（推文链接）、`lang`（en/ja/zxx…）、
  `created_at`（Twitter 格式 `Tue Sep 15 08:00:02 +0000 2026`）、`user`（TweetUser）、
  `entities`（Entity[]）、`media_details`（Media[]，含 `media_url_https` / `type` / `video_info`）、
  可选 `retweeted_original_id`、`quoted_tweet_id`，计数 `like_count` / `retweet_count` /
  `reply_count` / `view_count`
- **TweetUser**：`id_str`、`name`、`screen_name`、`profile_image_url_https`、
  `is_blue_verified`、`profile_image_shape`（Circle/Square/Hexagon）
- **EnrichedUser**（`users` 用 camelCase）：`userName`、`fullName`、`followersCount`、
  `followingsCount`、`statusesCount`、`likeCount`、`description`、`location`、`createdAt`、
  `isVerified`、`profileImage`、`profileBanner`、`pinnedTweets[]`
- **YearStat**：`{ year, count }`，按年份降序
- **ImageEntry**：`{ url, tweet }`（`tweet` 是完整 EnrichedTweet）
- **IGUserPageResponse**：`{ user: IGUserInfo | null, posts: { data: IGPost[], meta } }`
- **IGPost**：`id`（shortcode）、`url`、`username`、`fullname`、`description`（caption）、
  `tags`、`likes`、`type`（post/reel）、`media`（IGMedia[]，`display_url` / `video_url`）、
  `created_at`、`location_name`、`verified`、`audio`
- **错误**：`{ "error": "..." }`，配 400 / 404

## 输出与时区

- 时间戳默认换算成 **JST（UTC+9）** 渲染为 `yyyy-MM-dd HH:mm`，便于对日本活动时间；
  需要原始 UTC 字符串请用 `--json`。
- 推文一律附带 `url` 字段并打印出来；引用推文时用 markdown 链接引用该 URL，不要只抄正文。
- `image --out` 未指定时脚本不落盘，只打印图片 URL；要留存时显式给 `--out`，
  临时产物放 `$env:TEMP`，避免污染当前工作区/仓库根目录。
- 输出不会污染：脚本按 `[Console]::IsOutputRedirected` 自适应——交互终端保留颜色，
  被管道/CI/Agent 捕获时改写纯 stdout（`Write-Output`），因此不会出现 `#< CLIXML` 噪音。
  机器解析仍建议直接加 `--json`。

## 直接调用（PowerShell）

```powershell
$base = 'https://tweet-api.chilfish.top'

# 用户推文（分页 + 日期范围 + 排除回复）
(Invoke-RestMethod "$base/v3/tweets/get/ttisrn_0710?pageSize=20&start=2026-01-01&end=2026-09-17&noReplies=true").data

# 媒体推文 / 搜索 / 那年今日 / 统计
(Invoke-RestMethod "$base/v3/tweets/medias/ttisrn_0710?pageSize=30").data
(Invoke-RestMethod "$base/v3/tweets/search?q=$([uri]::EscapeDataString('こんびず'))&name=ttisrn_0710")
(Invoke-RestMethod "$base/v3/tweets/last-years-today?pageSize=20").data
Invoke-RestMethod "$base/v3/tweets/stats/ttisrn_0710"

# 用户 / 随机图 / IG
Invoke-RestMethod "$base/v3/users/get/ttisrn_0710"
Invoke-RestMethod "$base/v3/image/get?name=ttisrn_0710"
Invoke-RestMethod "$base/v3/ins/ttisrn_0710?page=1"
```

完整 schema 见 `references/tweets-viewer-openapi.json`。

## 故障排除

### 返回空数组 / `data: []`
**原因**：该用户未归档，或日期范围/关键词过窄；`ins` 还要求服务端 `users.ins_json_data` 里有映射。
**解决**：先 `users` 看该用户是否在归档列表里，再 `stats <name>` 看覆盖年份，
然后放宽 `--start/--end` 或换关键词。

### 400 `error` 且提到 `name`
**原因**：`name` 不匹配 `^\w+$`（含点号、连字符、中文）或超过 50 字符。
**解决**：确认用的是 X Screen Name 本身；脚本的 `Resolve-Name` 已会把链接/`@` 归一化。

### 翻页重复或跳页对不上
**原因**：`cursor` 与 `page` 混用——服务端以 `cursor` 优先。
**解决**：跳页只用 `--page`，续载只用上一响应的 `--cursor`，不要同时给。

### `nextCursor` 为 `null` 却还有更多
**原因**：说明本次过滤条件已到底（`meta.hasMore` 以游标口径计算）。
**解决**：以 `nextCursor` 为准判断是否继续。

### `stats` 没有期待中的年份
**原因**：归档是抓取时的快照，缺年是抓取遗漏，不是接口过滤。
**解决**：向 `https://github.com/Chilfish/tweets-viewer` 提补抓，不要在本 API 侧绕。

### 管道里出现 `#< CLIXML`
**原因**：写法用了 `Write-Host`（信息流被序列化）。
**解决**：本脚本已自适应；自写脚本时用 `Write-Output`，或直接 `--json`。

### `parameter name 'out' is ambiguous`
**原因**：脚本里写了 `param()` 或 `[CmdletBinding()]`，成为「进阶脚本」后自动启用通用参数，
`--out` 被当成 `-OutVariable` / `-OutBuffer` 的前缀。
**解决**：本 skill 的入口刻意不声明 `param()`，所有开关由 `$args` 手写解析。新增 `--xxx` 开关时
不要退回 `param()` 写法，否则 `--out` / `--e` / `--v` 这类前缀会再次撞上通用参数。

## 实现备注

- 不声明 `param()` / `[CmdletBinding()]`，用 `$args` 手写解析 `--flag`（原因见上）。
- HTTP 走 `Invoke-WebRequest` 取原文，再 `ConvertFrom-Json -DateKind String`（pwsh 7.5+，
  低版本自动回落）保留日期原始字符串——否则 ISO 日期会被隐式转成 `[datetime]`，
  时区换算就会出错。推文时间戳是 Twitter 原生格式，需 `TryParseExact('ddd MMM dd HH:mm:ss zzz yyyy')`。
- 人读模式下用 `WebUtility::HtmlDecode` 解码正文里的 `&amp;` 等实体；`--json` 保持原始值。
- 版本号单源：从同级 `SKILL.md` 的 frontmatter 读取，用于 UA，避免手写副本漂移。
- 单文件实现，无外部依赖，不依赖 curl / python3。
