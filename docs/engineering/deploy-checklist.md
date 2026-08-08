# 部署清单 (Deploy Checklist)

> 目标：验证前端（Vercel）与 API（Cloudflare Workers）的发布满足标准。
> 部署命令：`bun run deploy`（API）/ Vercel 自动部署（前端，push main 后）。

## 前端（Vercel, `tweet.chilfish.top`）

- [ ] `bun run build:client` 构建通过（SSR 无报错）
- [ ] 首页 / `/tweets/:name` / `/media/:name` / `/search` / `/memo` / `/ins` 全部路由可达
- [ ] SSR 首屏正常渲染（无 Hydration 错误）
- [ ] 无限滚动 + 分页器交互正常
- [ ] 日期范围筛选（DateRangeFilter）在浅色/深色模式正常
- [ ] 移动端（<768px）布局无溢出
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
