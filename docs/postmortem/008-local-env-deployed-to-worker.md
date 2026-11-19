# 008-本地配置被发布到线上 Worker

## 摘要

`bun run deploy` 把 `.env` 里 `LOCAL=1` 的本机配置写进 Workers 的 `vars`——线上库地址变成 `postgres://postgres@localhost:5432/tweets_dev`，`NEON_HTTP_ENDPOINT` 变成 `http://127.0.0.1:4445/sql`。Worker 里没有本机代理，所有查库的端点直接 500。

## 影响

- 范围：线上 API 全部依赖数据库的端点（`/v3/tweets/*`、`/v3/users/*`、`/v3/ins/*`），持续到修复部署为止
- 代价：一次线上不可用；另有一次修复中的二次故障（见下）

## 时间线

- 某次在 `LOCAL=1` 状态下执行 `bun run deploy`，`nitro.config.ts` 从 `env.server.ts` 读值写进 `wrangler.vars`
- 线上 `/v3/users/all` 持续 500，日志只有 stack：`NeonHttpPreparedQuery.queryWithCache`
- 排查确认构建产物 `.output/server/wrangler.json` 的 `vars` 全是本机值
- 改为 Worker secret 后**又出现一次 500**：`index.mjs:481` 的 `c.env.NEON_HTTP_ENDPOINT` 抛错

## 根因

- **直接原因**：`apps/server/nitro.config.ts` 在构建期把环境变量写进 `vars`，`.env` 是本地配置，部署即泄漏
- **系统条件 1**：`bun run deploy` 没有环境守卫，`LOCAL=1` 与 `LOCAL=0` 走同一条路径
- **系统条件 2**：`apps/server/wrangler.json` 是历史遗留产物，nitro 用 `defu` 把它合并进来，其中的凭据也会进产物
- **系统条件 3**：`apps/server/index.ts` 用 `process.env.X || c.env.X`，Nitro 只调 `app.fetch(request)`，Hono 的 `c.env` 是 `undefined`。之前 `vars` 存在时靠短路绕过，改成 secret 后必然走到 `c.env.X` 崩掉
- **根因归类**：`流程缺失` + `设计建模`

## 行动项

- [x] `bun run deploy` 走 `ig deploy` 固定线上模式：`DATABASE_URL_REMOTE` 覆盖、清空 `.output` 后从零构建
- [x] 构建产物扫描：`DATABASE_URL` / `TWEET_KEYS` / `NEON_HTTP_ENDPOINT` 残留或本机地址 → 中止部署（`apps/scripts/src/lib/deploy-scan.ts`）
- [x] `nitro.config.ts` 守卫：`LOCAL=1` + `NODE_ENV=production` 直接抛错；线上不写 `vars`
- [x] 线上凭据改 Worker secret；顺手删掉遗留的 `apps/server/wrangler.json`
- [x] `index.ts` 的 `c.env` 访问改可选链，缺 `DATABASE_URL` 时给出明确报错
- [x] `deploy-scan` 单测覆盖误报边界（OpenAPI 的 `localhost:3000` 不算）

## 复盘

- 凭据与本地地址必须靠机制隔离，不能靠「记得先改 `LOCAL`」的提醒
- 构建期注入运行时配置是反模式：配置应在运行期读取，构建产物只发代码
- 「改完配置就发」这条路要有负向测试——能拦住错误才算修好
