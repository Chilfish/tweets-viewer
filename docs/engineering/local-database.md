# 本地开发环境（PostgreSQL + Neon HTTP 代理）

本地跑抓取与入库不需要线上 Neon：本机 Postgres 加一层 `/sql` 代理，就能让 `@neondatabase/serverless` 继续用 HTTP 驱动，代码与线上完全同路。`LOCAL=1` 是总开关。

## 为什么需要代理

项目里所有数据库访问都走 `drizzle-orm/neon-http` + `@neondatabase/serverless` 的 HTTP 驱动，`DB` 类型也绑在这个驱动上。这个驱动只会说 Neon 的 `POST /sql` 协议，无法直连 Postgres 的 TCP 端口。

所以本地分两层：

| 场景 | 路径 |
| --- | --- |
| 脚本（Bun） | `neon()` → `NEON_HTTP_ENDPOINT` → 代理 → 本机 Postgres |
| API（wrangler / workerd） | 同上；workerd 没有 TCP socket，只能走代理 |

代理把 `/sql` 翻译成 `pg` 查询，脚本与 Worker 走同一条路径，因此本地验证覆盖的是真实代码路径。

代码位置：

- `apps/scripts/src/lib/local-config.ts` — `LOCAL=1` 判定、本地默认地址、环境横幅
- `apps/scripts/src/lib/dev-services.ts` — 定位 `pg_ctl`、启停 Postgres、建库、跑迁移
- `apps/scripts/src/commands/dev/db.ts` — `bun run ig dev db`
- `apps/scripts/src/commands/dev/proxy.ts` — `bun run ig dev proxy`
- `packages/database/index.ts` — `createDb({ url, endpoint })`，`endpoint` 存在时设置 `neonConfig.fetchEndpoint`

## 一次性安装

Windows（Scoop）：

```powershell
scoop install postgresql
```

macOS：`brew install postgresql`；Linux 用系统包管理器安装。

`ig dev db` 会自动定位可执行文件与数据目录：

- `pg_ctl`：`PG_CTL` → `PATH` → `scoop prefix postgresql` → `%SCOOP%\apps\postgresql\current\bin` → `C:\Program Files\PostgreSQL\*\bin`
- 数据目录：`PGDATA` → `%SCOOP%\persist\postgresql\data` → 安装目录下的 `data`

macOS / Linux 从 `PATH`、`pg_config --bindir`、`/usr/lib/postgresql/*/bin`、Homebrew 的 `opt/postgresql*` 查找。

## 环境变量

只用一个文件：项目根目录 `.env`（已在 `.gitignore`）。**这不是 wrangler 的 `.dev.vars`**，脚本与 `env.server.ts` 都读它。

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `LOCAL` | 未设置 | `1` / `true` / `yes` 开启本地模式 |
| `DATABASE_URL` | — | 本机时是 `postgres://postgres@localhost:5432/tweets_dev`；多库时逗号分隔 |
| `NEON_HTTP_ENDPOINT` | — | 本地是 `http://127.0.0.1:4444/sql`；设置后 neon 驱动改打这个地址 |
| `TWEET_KEYS` | — | Twitter 抓取用，`env.server.ts` 必填 |
| `INSTAGRAM_COOKIES` | — | IG 抓取用，至少含 `sessionid` + `csrftoken` |
| `IG_CDN_BASE` | `https://s3.chilfish.top` | 媒体链接前缀；本地要指向自己的存储时改这里 |

`bun run ig dev db` 会 upsert `LOCAL` / `DATABASE_URL` / `NEON_HTTP_ENDPOINT` 三行，`TWEET_KEYS` 等既有行保持不动。

`LOCAL=1` 时若 `DATABASE_URL` 为空，回落到 `postgres://postgres@localhost:5432/tweets_dev`；`NEON_HTTP_ENDPOINT` 为空时回落到 `http://127.0.0.1:4444/sql`。线上（`LOCAL=0`）不读取这两个默认值，行为与现在一致。

## 初始化

```bash
bun run ig dev db
```

依次做四件事：启动 Postgres（已在运行则跳过）→ 建 `tweets_dev` → 应用 `packages/database/migrations/` → 写 `.env`。

输出示例：

```text
[dev.db] Postgres 已在运行（D:\Scoop\apps\postgresql\current\data）
[dev.db] 数据库与迁移就绪：localhost:5432/tweets_dev
```

只做诊断、不改文件：

```bash
bun run ig dev db --dry-run
```

换库名或端口：

```bash
bun run ig dev db --url postgres://postgres@localhost:5433/tweets_dev
```

## 启动代理

```bash
bun run ig dev proxy
```

前台运行，`Ctrl-C` 结束。它只接受本机数据库地址，避免把线上库暴露到 localhost。

```bash
curl http://127.0.0.1:4444/health
# {"ok":true,"pid":925604,"host":"localhost:5432","database":"tweets_dev","queries":0}
```

跑过一次抓取后 `queries` 会增加，说明查询确实落在本地库。

端口被占用时换一个，并同步 `.env` 的 `NEON_HTTP_ENDPOINT`：

```bash
TWEETS_DB_PROXY_PORT=4445 bun run ig dev proxy
```

## 验证本地链路

```bash
bun run ig ins verify ritsu_yumemita
bun run ig ins verify ritsu_yumemita --json | jq .meta.mode   # "local"
```

`meta.mode` 由 `LOCAL` 决定。本地模式下的导入、查询、对账都写 `tweets_dev`，不会碰线上库。

本地 API 也走同一个代理：

```bash
bun dev:server
curl -s "http://localhost:3000/v3/ins/ritsu_yumemita?page=1" | jq '.user.fullname, .posts.meta.total'
```

## 切回线上

```bash
LOCAL=0 bun run ig ins verify ritsu_yumemita   # 单次覆盖
```

或把 `.env` 的 `LOCAL` 改成 `0`。线上模式只读 `DATABASE_URL`，不再回落到本机默认值。

`bun run ig dev db` 会把 `DATABASE_URL` 覆盖成本地地址。切回线上时记得把它改回 Neon 连接串；也可以在 `.env` 里另起一行 `DATABASE_URL_REMOTE` 供临时覆盖：

```bash
DATABASE_URL="$DATABASE_URL_REMOTE" LOCAL=0 bun run ig ins verify ritsu_yumemita
```

## 停止

Postgres 与代理都不随命令退出而停止（`dev proxy` 是前台进程，`Ctrl-C` 即停）。

```powershell
# 代理：先看 pid
curl http://127.0.0.1:4444/health
Stop-Process -Id <pid>

# Postgres
pg_ctl stop -D "$env:PGDATA"
```

## 排查

| 现象 | 检查 |
| --- | --- |
| `未找到 pg_ctl` | 设置 `PG_CTL` 指向可执行文件、`PGDATA` 指向数据目录，或按上面的顺序安装 PostgreSQL |
| `数据目录不可用` | 数据目录未初始化：`initdb -D <PGDATA>`；或 `PGDATA` 指错 |
| 连接被拒绝 / `ECONNREFUSED` | 代理没起：`bun run ig dev proxy`；确认 `.env` 的 `NEON_HTTP_ENDPOINT` 与代理端口一致 |
| 查询报 `relation "users" does not exist` | 迁移没跑：`bun run ig dev db` |
| 端口已被占用 | `TWEETS_DB_PROXY_PORT=4445 bun run ig dev proxy`，同时改 `.env` |
| `LOCAL=1` 但仍连线上 | 进程环境覆盖了文件：`LOCAL=1 bun run …` 显式传一次 |
| 页面数据是旧的 | 本地库有数据但前端有 5 分钟客户端缓存，刷新标签页 |
