# 本地开发环境（PostgreSQL + 对象存储）

本地跑抓取、入库与浏览不需要线上 Neon 或 R2：本机 Postgres 加一层 `/sql` 代理，本机 SILO 代替 R2。`LOCAL=1` 是总开关，同时切换数据库、对象存储与媒体地址。

## 为什么需要代理

项目里所有数据库访问都走 `drizzle-orm/neon-http` + `@neondatabase/serverless` 的 HTTP 驱动，`DB` 类型也绑在这个驱动上。这个驱动只会说 Neon 的 `POST /sql` 协议，无法直连 Postgres 的 TCP 端口。

所以本地分两层：

| 场景 | 路径 |
| --- | --- |
| 脚本（Bun） | `neon()` → `NEON_HTTP_ENDPOINT` → 代理 → 本机 Postgres |
| API（wrangler / workerd） | 同上；workerd 没有 TCP socket，只能走代理 |

代理把 `/sql` 翻译成 `pg` 查询，脚本与 Worker 走同一条路径，因此本地验证覆盖的是真实代码路径。

对象存储没有这个问题：SILO 直接说 S3 HTTP API，`aws4fetch` 与浏览器都能直连。

本地编排由 [`@chilfish/devkit`](https://github.com/Chilfish/devkit) 提供：Postgres 定位与启停、建库、迁移、`/sql` 代理、SILO、`dev server` 多进程。原理与完整参数见 devkit 的 [local-dev](https://github.com/Chilfish/devkit/blob/main/docs/guide/local-dev.md) 与 [config](https://github.com/Chilfish/devkit/blob/main/docs/reference/config.md)。

项目侧只保留：

- `apps/scripts/dev.config.ts` — devkit 配置（本机库、代理端点、迁移目录、SILO 桶、两个 dev server）
- `apps/scripts/src/lib/local-config.ts` — 多库地址取首个、远端 R2 解析、媒体前缀
- `apps/scripts/src/lib/errors.ts` — 错误 `cause` 展开（devkit 0.1.2 尚未内置）
- `packages/database/index.ts` — `createDb({ url, endpoint })`，`endpoint` 存在时设置 `neonConfig.fetchEndpoint`

`dev` 命令组（`dev server` / `dev db` / `dev proxy` / `dev storage`）由 `createDevCommands(devkit)` 生成，本项目只覆盖中文 describe 文案。

## 一次性安装

Windows（Scoop）：

```powershell
scoop install postgresql
scoop install silo
```

macOS：`brew install postgresql`；SILO 用 `brew tap pgsty/infra && brew install pgsty/infra/silo`。Linux 用系统包管理器装 Postgres，SILO 下载对应二进制放进 `PATH`。

`ig dev db` 与 `ig dev storage` 的可执行文件查找顺序（`PG_CTL` / `PGDATA` / Scoop / 标准安装目录，`SILO_BIN` / `PATH` / Scoop / MinIO 回退）由 devkit 维护，见 [local-dev](https://github.com/Chilfish/devkit/blob/main/docs/guide/local-dev.md#postgres-discovery)。本项目只需保证 Postgres 与 SILO 在 `PATH` 中，或用 `PG_CTL` / `PGDATA` / `SILO_BIN` 显式指定。

## 环境变量

只用一个文件：项目根目录 `.env`（已在 `.gitignore`）。**这不是 wrangler 的 `.dev.vars`**，脚本与 `env.server.ts` 都读它。

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `LOCAL` | 未设置 | `1` / `true` / `yes` 开启本地模式 |
| `DATABASE_URL` | — | 本机时是 `postgres://postgres@localhost:5432/tweets_dev`；多库时逗号分隔 |
| `NEON_HTTP_ENDPOINT` | — | 本地是 `http://127.0.0.1:4444/sql`；设置后 neon 驱动改打这个地址 |
| `S3_ENDPOINT` | `http://127.0.0.1:9000` | 本地对象存储地址 |
| `S3_ACCESS_KEY_ID` | `silo-admin` | 本地凭据；优先于 `MINIO_ROOT_USER` |
| `S3_SECRET_ACCESS_KEY` | `silo-admin` | 本地凭据；优先于 `MINIO_ROOT_PASSWORD` |
| `R2_BUCKET` | `tweets-viewer` | 本地桶名；线上同名变量指 R2 桶 |
| `SILO_BIN` | 自动查找 | SILO 可执行文件路径 |
| `SILO_DATA` | `cache/silo-data` | SILO 数据目录 |
| `TWEET_KEYS` | — | Twitter 抓取用，`env.server.ts` 必填 |
| `INSTAGRAM_COOKIES` | — | IG 抓取用，至少含 `sessionid` + `csrftoken` |
| `IG_CDN_BASE` | `https://s3.chilfish.top` | 线上媒体前缀；`LOCAL=1` 时由 devkit 写成 `http://127.0.0.1:9000/tweets-viewer` |
| `DATABASE_URL_REMOTE` | — | 线上库连接串；`LOCAL=0` 时由 devkit 展开为 `DATABASE_URL` |

`bun run ig dev db` 由 devkit 的 `ensureEnvFile` 对齐 `.env`：upsert `LOCAL` / `DATABASE_URL` / `NEON_HTTP_ENDPOINT` / `IG_CDN_BASE`，注释与 `TWEET_KEYS` 等既有行保持不动。devkit 0.1.2 不再自动把原 `DATABASE_URL` 另存为 `DATABASE_URL_REMOTE`，远程连接串需要自己维护。

`LOCAL=1` 时 `DATABASE_URL` 不是本机地址会被强制替换成本机库，`NEON_HTTP_ENDPOINT` 同理会指向本机代理，`IG_CDN_BASE` 指向本机桶。线上（`LOCAL=0`）把 `DATABASE_URL_REMOTE` 展开为 `DATABASE_URL`，不读取本地默认值。

## 部署与线上凭据

`bun run deploy` 是唯一的部署入口（`bun run ig deploy`），固定按线上处理：

1. 用 `DATABASE_URL_REMOTE` 覆盖库地址，置 `LOCAL=0`、清掉 `NEON_HTTP_ENDPOINT`；
2. 清空 `apps/server/.output` 后从零构建；
3. 产物里出现 `DATABASE_URL` / `TWEET_KEYS` / `NEON_HTTP_ENDPOINT` 就中止，出现本机地址也中止；
4. 通过后才 `nitro deploy --prebuilt`。

线上凭据**不进构建产物**，走 Worker secret：

```bash
cd apps/server
bunx wrangler secret put DATABASE_URL    # 值取 .env 的 DATABASE_URL_REMOTE
bunx wrangler secret put TWEET_KEYS
bunx wrangler secret list --name tweet-api
```

直接跑 `bun --cwd apps/server deploy` 会被 `nitro.config.ts` 的守卫拦住：`LOCAL=1` + 生产构建直接抛错。

## 初始化数据库

```bash
bun run ig dev db
```

依次做四件事：启动 Postgres（已在运行则跳过）→ 建 `tweets_dev` → 应用 `packages/database/migrations/` → 写 `.env`。

只做诊断、不改文件：

```bash
bun run ig dev db --dry-run
```

换库名或端口：

```bash
bun run ig dev db --url postgres://postgres@localhost:5433/tweets_dev
```

## 本地对象存储（SILO）

SILO 是 MinIO 的维护分支，S3 API 与 `MINIO_*` 变量契约不变。启动、建桶与匿名只读策略由 devkit 的 `ensureSiloRunning` 负责（见 [local-dev](https://github.com/Chilfish/devkit/blob/main/docs/guide/local-dev.md#storage-silo)）；本节只列本项目参数。

```bash
bun run ig dev storage
```

| 项 | 默认 |
| --- | --- |
| S3 端点 | `http://127.0.0.1:9000` |
| 控制台 | `http://127.0.0.1:9001` |
| 桶 | `tweets-viewer` |
| 数据目录 | `cache/silo-data` |
| 日志 | `logs/silo.log` |

`LOCAL=1` 时媒体地址一律指向本机桶：

```
http://127.0.0.1:9000/tweets-viewer/instagram/<账号>/<shortcode>-<序号>.<ext>
http://127.0.0.1:9000/tweets-viewer/instagram/<账号>.<ext>
```

所以 `ins media` 写出的 `.cdn.json`、`ins upload` 的上传目标、`ins verify` 的可达性检查，全部指向这套地址。切回线上重导一次即可换回 `s3.chilfish.top`。

上传用 `aws4fetch` 签 S3 请求，与线上 R2 同一份代码，区别只在端点和凭据。

## 启动开发：一条命令

```bash
bun run dev
```

`bun run dev` 等价于 `bun run ig dev server`。devkit 会先跑 `ensureDevServices`：启动 Postgres → 建库 → 跑迁移 → 对齐 `.env` → 后台拉起 `/sql` 代理与 SILO，然后才启动 `dev.servers` 里的 server 与 client。Postgres、代理与 SILO 是独立后台进程，`Ctrl-C` 只结束两个前台 server，本地服务继续运行，下次 `bun run dev` 直接复用。

只做前置、不起服务器：

```bash
bun run ig dev db          # 初始化数据库与 .env
bun run ig dev server --dry-run   # 只看会启动什么
```

对象存储缺失不阻塞读库：页面能打开，只是上传与图片会失败，命令会打印原因。

线上模式（`LOCAL` 未设置）会跳过全部本地服务，直接启动 server 与 client。

`dev server` 的代理端口取 `apps/scripts/dev.config.ts` 的 `database.proxyEndpoint`；单独用 `dev proxy` 时可用 `--port` 覆盖。`TWEETS_DB_PROXY_PORT` 已不再被读取（迁移期弃用），改端口时同步改 `dev.config.ts` 与 `.env` 的 `NEON_HTTP_ENDPOINT`。端口被另一个库的代理占用时直接报错，不会静默连错库。

## 单独启动代理

```bash
bun run ig dev proxy
```

前台运行，`Ctrl-C` 结束。它只接受本机数据库地址，避免把线上库暴露到 localhost。

```bash
curl http://127.0.0.1:4444/health
# {"ok":true,"pid":925604,"host":"localhost:5432","database":"tweets_dev","queries":0}
```

跑过一次抓取或访问过页面后 `queries` 会增加，说明查询确实落在本地库。

端口被占用时换一个，并同步 `.env` 的 `NEON_HTTP_ENDPOINT`：

```bash
bun run ig dev proxy --port 4445
```

## 验证本地链路

```bash
bun run ig ins media --from data/yunoch1.cdn.json
bun run ig ins upload yunoch1
bun run ig ins import data/yunoch1.cdn.json --twitter yuno_yumemita
bun run ig ins verify yuno_yumemita
bun run ig ins verify yuno_yumemita --json | jq .meta.mode   # "local"
```

`verify` 会把抽样媒体与头像指向本机桶做 HEAD 检查，返回 200 才算通过。`meta.mode` 由 `LOCAL` 决定。

本地 API 也走同一套服务：

```bash
bun run dev:server                                      # wrangler dev，3000
curl -s "http://127.0.0.1:3000/v3/ins/yuno_yumemita" | jq '.user.fullname, .posts.meta.total'
```

判断读的是哪个库，看 `/v3/users/all` 的条数：本地库初始只有少数用户。要拉齐线上账号名单与 IG 帖子：

```bash
LOCAL=1 bun run ig ins refresh --no-download
```

`ins refresh` 会先从 `DATABASE_URL_REMOTE` 同步整张 `users` 表，再对全部 `ins_username` 账号全量抓取帖子；
`--no-download` 表示只同步数据、媒体链接指向线上 CDN。限流中断后加 `--missing` 续跑。

本机已经有别的项目占了 4444 时，把 `.env` 的 `NEON_HTTP_ENDPOINT` 改成 `http://127.0.0.1:4445/sql`，`bun run dev` 会把代理起在 4445。

## 切回线上

```bash
LOCAL=0 bun run ig ins verify yuno_yumemita   # 单次覆盖
```

或把 `.env` 的 `LOCAL` 改成 `0`。线上模式把 `DATABASE_URL_REMOTE` 展开为 `DATABASE_URL`，并读取 `R2_*`；`.env` 里由本地模式写下的 `NEON_HTTP_ENDPOINT` / `IG_CDN_BASE` 会被忽略——前者只对本机库生效，后者只有非本机地址才会被采用。显式设置的 `DATABASE_URL` 优先于文件。

本地导入过的记录里存的是本机媒体地址，切回线上后先重写再重导一次 `.cdn.json`，让链接回到 `s3.chilfish.top`：

```bash
LOCAL=0 bun run ig ins media yunoch1
LOCAL=0 bun run ig ins import data/yunoch1.cdn.json --twitter yuno_yumemita
```

线上媒体先上传（无 `R2_*` 凭据时可用 `wrangler r2 object put static/instagram/<账号>/<文件>`；`s3.chilfish.top` 绑的是 `static` 桶），再入库。

## 停止

Postgres、代理与 SILO 都不随命令退出而停止（`dev proxy` 是前台进程，`Ctrl-C` 即停）。

```powershell
# 代理：先看 pid
curl http://127.0.0.1:4444/health
Stop-Process -Id <pid>

# SILO：默认监听 9000
Get-NetTCPConnection -LocalPort 9000 | Select-Object -ExpandProperty OwningProcess | Stop-Process

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
| 端口已被占用 | `bun run ig dev proxy --port 4445`，同时改 `dev.config.ts` 的 `database.proxyEndpoint` 与 `.env` 的 `NEON_HTTP_ENDPOINT` |
| `LOCAL=1` 但仍连线上 | 进程环境覆盖了文件：`LOCAL=1 bun run …` 显式传一次 |
| 页面数据是旧的 | 本地库有数据但前端有 5 分钟客户端缓存，刷新标签页 |
| `未找到 silo 可执行文件` | 装 SILO 并加入 `PATH`，或设 `SILO_BIN`；读库不受影响 |
| 上传报 `MISSING_ENV` | `LOCAL=1` 时不该出现；检查 `LOCAL` 是否被进程环境覆盖成 0 |
| 图片 404 / 403 | 先 `bun run ig ins upload <账号>`；403 说明桶匿名读没设上，重跑 `ig dev storage` |
| 端口 9000 被占 | 改 `S3_ENDPOINT` 与 `SILO_DATA` 后重跑 `ig dev storage`；同时改 `IG_CDN_BASE` 不需要，它跟随 `S3_ENDPOINT` |
