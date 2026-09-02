# 平台 × 第三方工具调研报告（Platform & Tool Research）

> **调研时效**：2026-08 ~ 2026-09 实时核证。调研方式：web_search 后端本次不可用（auth-required），
> 因此全部结论通过 **web_fetch 直接核实 GitHub 仓库页 / README / 源码 / 官方 API 文档**得出，
> 活跃时间精确到月。lucide 标注 ⭐ 的工具为**本项目（新的 Unified SNS Viewer）推荐首选**。
>
> **阅读前提**：本文档回答「每个平台用什么第三方工具抓、能拿到什么字段」，并最终落到
> [DATA-MODEL.md](./DATA-MODEL.md) 的统一模型与 [SCAFFOLD.md](./SCAFFOLD.md) 的落地节奏。
> **设计取向**：本项目是**低频定期增量、纯个人归档**场景（对齐 tweets-viewer 的 dailyUpdate 节奏），
> 因此「稳定 > 广度」—— 评分 **1-5，5 = 最适配低频增量归档**。

---

## 1. 生态与法律环境总览（决定性事实，先读）

| 事实 | 影响 |
|---|---|
| **Nitter 已死**：X Corp. 于 2026-08-24 发出 C&D 律师函，要求**永久下架所有 Nitter 实例与仓库**（[GitHub 页面已挂声明](https://github.com/zedeus/nitter)） | X 第三方前端路线彻底关闭，只剩「账号型抓取」一条路 |
| **twitter-api-dump 仓库 404**、**BirdHound 在 GitHub 无此仓库** | 上一代 X 抓取方案多数已被移除/改名，选型必须现场核证 |
| **snscrape / twint 早已归档**（[snscrape](https://github.com/JustAnotherArchivist/snscrape) 停留在 2022 前后，Twitter scraper 实际失效） | 历史教程里的方案不可直接采用 |
| **B 站反向生态被律师函整体关停**：[bilibili-api](https://github.com/Nemo2011/bilibili-api) 2026-07-06 归档（上海市弘安律所代表 B 站）、[bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect) 2026-01-30 归档（2026-01-28 律函） | B 站动态抓取只剩「直连公开端点」与少数存活工具，且随时可能进一步收紧 |
| 微博 / IG / Reddit / Bluesky / Mastodon 生态无重大法律事件，稳定 | 这些平台可放心投入 |

> **合规基调**：本项目为**个人归档、只读展示、低频增量**（对齐 tweets-viewer 全部先例）。所有工具仅用于
> 抓取**公开内容 / 自己账号可见内容**，不做商业化、不公开代理服务、不规避风控（不用打码平台）。

---

## 2. 平台推荐总表

| 平台 | 首选工具 ⭐ | 备选 | 获取方式 | 适配评分 | 一句话结论 |
|---|---|---|---|---|---|
| **X / Twitter** | [twscrape](https://github.com/vladkens/twscrape) | tweety、tweet-harvest | 账号 Cookie 池（`auth_token`+`ct0`），SNScrape 风格模型，JSONL 输出 | 4 | 唯一还在维护的通用型 X 抓取库；需自备账号池、低频跑 |
| **Instagram** | [Instaloader](https://instaloader.github.io/codesnippets.html) ⭐ | gallery-dl | 页面/GraphQL + 登录 Cookie；JSON 侧车文件 | 5 | 本项目已用 `@chilfish/gallery-dl-instagram` SDK，Instaloader 作对照/评论补充 |
| **YouTube 社区帖** | **自研 innerTube 续传引擎**（本项目已定型验证） | [yp-dl](https://github.com/NothingNaN/YoutubeCommunityScraper) | `youtubei/v1/browse` continuation + SOCS cookie | 5 | 滚动自动化已验证不可行（节流卡死）；innerTube 续传正确 |
| **Bilibili 动态** | **直连公开端点** `api.bilibili.com/x/polymer/web-dynamic/v1/feed/space` | MediaCrawler、f2 | 浏览器 UA + 游客 Cookie | 4 | 官方库已全部关停；直连端点需自行维护签名/字段解析 |
| **微博** | [weiboSpider](https://github.com/dataabc/weiboSpider) ⭐ | [WeiboSpider](https://github.com/nghuyong/WeiboSpider)（Scrapy）、[weibo-crawler](https://github.com/dataabc/weibo-crawler) | 移动端页面 + 登录 Cookie（约 3 个月过期） | 4 | 字段最全（含来源客户端、转发评论）；Cookie 需定期续期 |
| **Reddit** | [PRAW](https://github.com/praw-dev/praw) ⭐ | 官方 OAuth REST | 官方 API（OAuth） | 5 | 官方 API 即是正道，免反爬 |
| **Bluesky** | **官方公开端点** `https://public.api.bsky.app`（`app.bsky.feed.getAuthorFeed` 等） | — | 免鉴权只读 API | 5 | 零成本、零风险，直接裸调 |
| **Mastodon** | **公开 REST API** + [Mastodon.py](https://github.com/halcy/Mastodon.py) v2.2.2 | — | 公开实例端点免鉴权 | 5 | 同 Bluesky，协议级开放 |
| **Threads** | [Threads-Scraper](https://github.com/Zeeshanahmad4/Threads-Scraper) | — | Playwright 屏扫（无 API） | 2-3 | 无官方 API，屏扫脆弱；**建议第二阶段再支持** |
| **抖音** | [f2](https://github.com/Johnserf-Seed/f2) ⭐ | Evil0ctal API、MediaCrawler | 内置 XBogus/ABogus 签名；公开作品免登录 | 4 | 签名内置省心；低频抓公开作品足够 |
| **TikTok** | [TikTok-Api](https://github.com/davidteather/TikTok-Api) | — | 私有端点 | 2 | 脆弱、经常修；**低优先级** |
| **小红书** | [MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) | [XHS-Downloader](https://github.com/JoeanAmier/XHS-Downloader)（12.6k⭐）、[xhs (Go)](https://github.com/ReaJason/xhs) | QR 登录 + Playwright | 2-3 | 反爬最重（风控/验证码），维护成本高；**最后接入** |

**优先级建议**（第一阶段只做前三档）：`⭐5 分档（IG/YT/Bsky/Mastodon/Reddit）` → `4 分档（X 账号池/B站直连/微博/抖音）`
→ `2-3 分档（Threads/TikTok/小红书）`。第一版 UI + 数据模型用 5 分档平台打通全链路，再横向扩展。

---

## 3. 分平台详述

### 3.1 X / Twitter —— 账号型抓取是唯一活路

- **twscrape**（⭐）：Python，[vladkens/twscrape](https://github.com/vladkens/twscrape)。用 `auth_token` + `ct0` 的账号
  Cookie 池轮转，模型为 SNScrape 风格（`Tweet`/`User` dataclass 含 `id/rawContent/date/url/likeCount/retweetCount/replyCount/quoteCount/viewCount/mentionedUsers/hashtags/media` 等），
  输出可落 JSONL，支持定时洗 `guest_token`。抓全量用户时间线（`/api/v1/tweet/UserTimeline`）。
- **tweety**（[mahrtayyab/tweety](https://github.com/mahrtayyab/tweety)，670⭐）：需登录态（cookie/登录），API 表面更友好，作备选。
- **tweet-harvest**：Playwright 驱动，适合少量账号 UI 自动化，不推荐做主力。
- **结论**：`auth_token+ct0` 账号池方案（twscrape）为**当前唯一通用型活路**；注意低频（每日 1 次）避免触发风控；
  本项目的 rettiwt-api fork 若仍可用可作私有通道，但不依赖。

### 3.2 Instagram —— Instaloader / gallery-dl（双轨）

- **Instaloader**（⭐）：Python，[instaloader.github.io](https://instaloader.github.io/codesnippets.html)，命令行/库两用，
  `--no-pictures` 可只导元数据 JSON 侧车（`Post.json_metadata` 含 `node` 字段：`display_url/video_url/edge_media_to_caption/
  edge_media_preview_like/taken_at_timestamp/is_video` 等）。需登录 Cookie（长期有效，比微博稳）。
- **gallery-dl**（[mikf/gallery-dl](https://github.com/mikf/gallery-dl)）：本项目已封装的 `@chilfish/gallery-dl-instagram` SDK
  即为同源方案，输出 `IGPost` 结构（本项目 `packages/shared/types.ts` 的 `IGPost/IGMedia/IGAudio` 已是干净样本）。
- **结论**：沿用现有 SDK 增量；Instaloader 负责补评论/档案统计。适配难度 **5**。

### 3.3 YouTube 社区帖 —— 自研 innerTube 续传引擎（已有定论）

- 本项目 2026-09-02 已实战定型（见开发记忆）：**`ytInitialData` 内嵌首屏 + 同源 `youtubei/v1/browse` POST
  `{context: INNERTUBE_CONTEXT, continuation}` 循环追 token**，全部在单次 `page.evaluate(async)` 内完成；
  滚动驱动已弃用（后台节流实测卡死、只抓到 4/60 条）。
- 实测字段：`backstagePostRenderer`（正文 `contentText`/`publishedTimeText`）、多图
  `backstageAttachment.postMultiImageRenderer.images[].backstageImageRenderer.image.thumbnails[].url`、
  原图手术 = `yt3.ggpht` URL 第一个 `=` 后整段换 `=s0`（实测 1575×2100 直链）、**绝对时间不公开 → capturedAt 兜底**。
  完整引擎细节（续传 token 解析：`onResponseReceivedEndpoints/Actions/Commands` 兼容分支）已沉淀在
  tweets-viewer 的抓取实验记录（youtube-posts-poc 目录与开发日志），新项目直接移植该引擎源码。
- **yp-dl**（[NothingNaN/YoutubeCommunityScraper](https://github.com/NothingNaN/YoutubeCommunityScraper)，MIT，2026-07 活跃）：
  JSON 字段 `post_link / time_since / utc_timestamp / video_link / image_links / text_content / poll_content`，
  用 SOCS cookie —— 与新项目适配器的字段映射可直接照搬。
- **结论**：新项目直接移植本项目已验证的 innerTube 引擎（README/MEMORY 里有完整技术细节），yp-dl 作字段对照。适配 **5**。

### 3.4 Bilibili 动态 —— 官方库已死，直连公开端点

- 法律事实：`bilibili-api`（2026-07-06 归档）、`bilibili-API-collect`（2026-01-30 归档）都被律函下架，**不要再依赖任何
  bilibili 轮子仓库**。
- 现行路线：直连 `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=<uid>` （浏览器 UA + 游客 Cookie 即可），
  响应含 `items[].modules.module_dynamic`（desc.text / major.archive / major.opus / major.draw 图片列表 / forward 转发）与
  `module_author`（name/face/uid）、`module_stat`（like/forward/comment）。
- **结论**：用 f2 / MediaCrawler 或自写轻量直连客户端（本项目 rettiwt-api 的 HTTP 封装模式可复用）。适配 **4**。

### 3.5 微博 —— weiboSpider 字段最全

- **weiboSpider**（[dataabc/weiboSpider](https://github.com/dataabc/weiboSpider)，⭐）：移动端点 + cookie，输出字段含
  `id / mblogid / created_at / text_raw / source（来自 xxx 客户端）/ reposts_count / comments_count / attitudes_count /
  pic_num / pics[].url / retweeted_status（转发原帖嵌套）/ isLongText` —— **与 UnifiedPost 的 Core+Rich 映射几乎一一对应**。
- **WeiboSpider**（[nghuyong/WeiboSpider](https://github.com/nghuyong/WeiboSpider)，Scrapy 框架）：称持续维护，适合大规模。
- **结论**：首选 dataabc 版；Cookie 约 3 个月过期需脚本提醒续期。适配 **4**。

### 3.6 Reddit / Bluesky / Mastodon —— 官方开放 API

- **Reddit**：PRAW（BSD，仍维护），官方 OAuth API（免费档有速率限制，个人归档够用）。`submission.title/selftext/url/score/created_utc`。
- **Bluesky**：`https://public.api.bsky.app` 免鉴权只读（`app.bsky.feed.getAuthorFeed` / `getPostThread`），
  JSON 字段标准 AT 协议 —— **零风险 5 分最优解**。
- **Mastodon**：任意实例公开 REST（`/api/v1/accounts/{id}/statuses`），免鉴权；Mastodon.py v2.2.2（2026-08 更新）活跃。
  字段：`content`（HTML！需清洗成纯文本+实体）、`media_attachments[].url/type`、`reblogs_count/favourites_count/replies_count`、
  `reblog`（转嘟嵌套）、`in_reply_to_id`。
- **结论**：三平台都是「官方 API 即是正道」，适配 **5**。注意 Mastodon `content` 是 HTML，清洗层需去标签转纯文本/实体。

### 3.7 Threads / TikTok / 抖音 / 小红书 —— 高风险区（低优先级）

- **Threads**：无官方 API；[Zeeshanahmad4/Threads-Scraper](https://github.com/Zeeshanahmad4/Threads-Scraper) 为 Playwright 屏扫
  （`screenshot` 模式取文本），脆弱、无结构化 JSON。建议第二阶段以后再评估。
- **TikTok**：[TikTok-Api](https://github.com/davidteather/TikTok-Api) 私有端点+抓包，经常性失效。低优先级。
- **抖音**：[f2](https://github.com/Johnserf-Seed/f2)（Apache-2.0）内置 XBogus/ABogus 签名，公开作品免登录可抓，
  文档质量好 —— 国内短视频唯一推荐。适配 **4**。
- **小红书**：[MediaCrawler](https://github.com/NanmiCoder/MediaCrawler)（QR 登录 + Playwright，风控重/验证码）、
  [XHS-Downloader](https://github.com/JoeanAmier/XHS-Downloader)（侧重下载）、[xhs (Go)](https://github.com/ReaJason/xhs)。
  反爬成本最高，**最后接入**。适配 **2-3**。

---

## 4. 字段可得性矩阵（12 平台 × 统一字段）

> 映射到 [DATA-MODEL](./DATA-MODEL.md) 的分层：**Core = 全平台必有；Rich = 有则填，无则回落；Extra = 平台专属**。
> ✅ 可靠可得 · ◐ 部分可得/需清洗 · — 基本不可得

| 统一字段 | X | IG | YT帖 | B站 | 微博 | Reddit | Bsky | Mast | Threads | 抖音 | TikTok | 小红书 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ | ✅ | ✅ | ✅ |
| `text` 正文 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅(facets 生成) | ◐(HTML清洗) | ✅(屏扫) | ◐ | ✅ | ✅ |
| `createdAt` | ✅ | ✅ | ◐(capturedAt) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `author` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `media[].photo` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ | ✅ | ✅ | ✅ |
| `media[].video` | ✅ | ✅ | — | ✅ | ◐ | ◐ | ✅ | ✅ | ◐ | ✅ | ✅ | ◐ |
| `media.width/height` | ✅ | ✅ | ✅ | ◐ | ◐ | ◐ | ◐ | ◐ | — | ◐ | ◐ | ◐ |
| `entities` 富文本 | ✅ | ◐(tags) | ◐ | ◐ | ◐ | — | ✅(facets) | ◐(解析HTML) | — | — | — | — |
| `metrics.likes` | ✅ | ✅ | ◐ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ | ◐ | ◐ | ◐ |
| `metrics.reposts` | ✅ | — | — | ✅ | ✅ | — | ✅ | ✅ | — | — | — | ◐ |
| `metrics.replies` | ✅ | ◐(需额外) | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | ◐ | ◐ | — |
| `metrics.views` | ✅ | ◐ | ◐ | ✅ | ◐ | — | ◐ | — | — | ✅ | ✅ | — |
| `tags` | ✅ | ✅ | — | — | ✅ | — | ✅ | ◐ | — | — | ◐ | ✅ |
| `repostOf` | ✅ | — | — | ✅ | ✅ | — | ✅(quote) | ✅(reblog) | — | — | — | ◐ |
| `quotedPost` | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ◐ |
| `extra` 平台专属 | ◐(卡片) | ✅(音乐/位置) | ✅(时长/轮播) | ✅(dynType/bvid) | ✅(来源客户端) | ◐ | — | — | — | ◐ | — | ◐ |

> **矩阵结论（直接支撑最坏情况分层）**：**没有任何字段在全部 12 平台都完整可得** —— 连 `media.width/height`、
> `entities` 都大面积缺失。唯一全部 ✅ 的只有 `id / text / createdAt / author / photo-url`。
> 这**独立验证了 DATA-MODEL §1 的「Core = id/platform/url/text/createdAt/author/media[]」设计**：
> 富文本/指标/嵌套/平台专属一律进 Rich/Extra 层，前端按存在性渲染。

---

## 5. 对统一数据模型的影响

1. **文本层（最关键的清洗动作）**：Mastodon `content` 是 HTML、Reddit 是自渲染 Markdown、微博 `text_raw` 含标签实体 ——
   清洗适配器必须统一到「纯文本 + 可选 entities」两轨（DATA-MODEL §6.2）；**不允许富文本 string 进存储**。
2. **时间近似**：YouTube 社区帖无绝对时间（实测只有相对时间）→ `capturedAt` 进 `meta.archived`（DATA-MODEL §6.1）。
3. **嵌套层**：只有 X/微博/Reddit/Bsky/Mastodon/B站 有转帖/引用语义；且 Mastodon 的 `reblog` 是跨账号转发（作者不同），
   与微博 `retweeted_status`（同构嵌套）语义不同 —— 清洗时统一为 `repostOf`，作者取原帖作者（对齐本项目
   `retweeted_original_id` 先例）。
4. **媒体层**：图片 URL 大多可直取（IG/YT 需原图手术与代理标记，见 DATA-MODEL §6.3-6.4）；视频直链 X/IG/B站/抖音可靠，
   YouTube 社区帖无视频（`video_link` 是外部跳转）。

---

## 6. 落地建议（运维与对接）

1. **对接本项目 PG 模式**：所有工具输出 → 适配器 normalize → `posts` 表（结构化列 + `jsonData` 全量），
   对齐 DATA-MODEL §8 草稿；导入脚本 `apps/scripts/import-<platform>.ts` 一次一种工具输出（对齐 `import-ins-data.ts`）。
2. **Cookie 运维**：微博（~3 个月）、IG（长期但需保活）、X 账号池（多账号轮转）—— 抽一个 `cookieManager`
   统一存放/过期提醒（GitHub Secrets + 本地 .env，参考 `INSTAGRAM_COOKIES` 先例）。
3. **调度**：GitHub Actions cron 每日 1 次增量（对齐本项目 `dailyUpdate.ts` 节奏）；高风险平台不纳入 cron，
   改为手动/周更，降低触发风控概率。
4. **产出物**：每个平台第一阶段先落「fixtures + normalize 测试」（10-30 条真实导出样本），再写导入脚本。
5. **风险预案**：任何工具失效 → 保留原始导出 JSON 文件（工具输出即归档，不删源），适配器升级即可重洗（`cleanVersion`）。