# 部署清单 (Deploy Checklist)

> 目标：验证前端（Vercel）与 API（Cloudflare Workers）的发布满足标准。
> 部署命令：`bun run deploy`（API）/ Vercel 自动部署（前端，push main 后）。

## 性能预算（4D-2，"性能是功能"）

以 Lighthouse（移动端模拟，`/tweets/:name` 与首页）为准，**预算即门槛**，超预算视为发布阻塞：

| 指标 | 预算 | 说明 |
|---|---|---|
| LCP | < 2.0s | 首屏主要内容（静态壳 + 骨架屏可接受，内容水合后补齐） |
| CLS | < 0.1 | 骨架屏 → 内容切换不得引起布局跳动 |
| INP | < 200ms | 无限滚动/翻页交互响应 |
| TBT | < 200ms | 主线程阻塞（长列表渲染注意） |

- 回归工具：Lighthouse CI / 手动 Lighthouse 跑分；改动涉及列表渲染/媒体加载时必测
- API 侧：`/v3/tweets/*` 响应应命中 CDN 缓存（`s-maxage=3600`），P95 延迟目标 < 500ms（含 Workers → Neon 往返）

## 前端（Vercel, `tweet.chilfish.top`）

- [ ] `bun run build:client` 构建通过（SSR 无报错）
- [ ] 首页 / `/tweets/:name` / `/media/:name` / `/search` / `/memo` / `/ins` / `/about` 全部路由可达
- [ ] 首屏正常渲染（无 Hydration 错误）；动态内容客户端渲染（SPA-first，见 ADR-010）
- [ ] 无限滚动（keyset cursor 续载）+ 分页器交互正常
- [ ] 日期范围筛选（DateRangeFilter）与按年浏览（YearNavigator）在浅色/深色模式正常
- [ ] 移动端（<768px）布局无溢出；底栏保持 5 tab
- [ ] 控制台无 500/404 API 错误

## API（Cloudflare Workers, `tweet-api.chilfish.top`）

- [ ] `bun run deploy` 部署成功，`wrangler.json` 配置（DATABASE_URL, TWEET_KEYS, RATE_LIMITER）
- [ ] 核心端点冒烟：`GET /v3/tweets/get/:name`、`/v3/tweets/medias/:name`、`/v3/tweets/search?q=`、`/v3/users/all`、`/v3/ins/:name`
- [ ] 日期范围 `start`/`end`（含 date-only 值）返回正确
- [ ] 分页边界：末页 `meta.hasMore=false` 正确
- [ ] 限流生效（Workers 200 req/60s + hono-rate-limiter）

## 数据同步（GitHub Actions）

- [ ] `fetch-daily.yml` cron（北京时间 00:00）最近一次运行成功
- [ ] `DATABASE_URL` / `TWEET_KEYS` / `INSTAGRAM_COOKIES` secrets 存在且未过期
- [ ] 新增用户/推文已入库（`/v3/users/all` 可查到）

## 发布纪律

- 前端部署由 Vercel 自动触发（push main），API 部署显式 `bun run deploy`
- 数据无破坏性变更；若改 schema，需先迁移（Drizzle）
- 发版前本地跑 `bun lint` + 各包 `bun test` 确认绿
