# IG 归档 CLI

Instagram 归档只走一个入口：`bun run ig <group> <command> [选项]`。参数解析、日志、退出码与 JSON 信封由 `apps/scripts/src/cli/` 统一提供，命令实现在 `apps/scripts/src/commands/`。

抓取用已发布包 `@chilfish/gallery-dl-instagram`（`^0.2.7`，用户 feed 走 doc_id GraphQL）。根提取器与 `/info/` 提取器按 SDK 的方式直接实例化，父子提取器共享 `csrfToken` / `wwwClaim` / `lsdToken`，子类不再各自拉首页换 token。上游 `gallery-dl-ins/scripts` 不再需要手工执行。

## 常用

```bash
bun run ig --help                        # 分组
bun run ig ins --help                    # 分组下的命令
bun run ig ins add --help                # 单条命令的完整选项
```

## 新增一个账号

```bash
bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita
```

一条命令按顺序做五件事：抓取 → 下载媒体并改写链接 → 上传媒体 → 入库 → 对账。中途失败立刻停下，退出码非 0，不会留下「写了一半」的状态：

- 抓取、下载与上传都在入库之前完成，失败不写库；
- 上传目标由 `LOCAL` 决定：`1` 写本机 SILO，否则写 R2；
- 入库按 `post_id` upsert，重复跑不会产生重复行；
- 对账失败只报告，不回滚已写入的数据。

只想看会做什么：

```bash
bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita --dry-run
```

## 命令表

| 命令 | 作用 |
| --- | --- |
| `ins add <url\|账号> [--twitter <name>]` | 端到端：export → media → upload → import → verify |
| `ins export <账号> [--out <path>]` | 抓取资料与帖子，写 `data/<账号>.json` |
| `ins media <账号> \| --from <json>` | 下载媒体，写 `data/instagram/<账号>/` 与 `data/<账号>.cdn.json` |
| `ins import <file.json> [--twitter <name>]` | 写 `users.ins_username` / `users.ins_json_data` / `ins_posts` |
| `ins sync [--since <ISO>] [--account <账号>]` | 每日增量：按库里已关联且 `daily_fetch = true` 的账号抓取 |
| `ins verify <twitterName>` | 对账：资料、条数、时间顺序、媒体可达 |
| `ins upload <账号> [--bucket <name>]` | 上传媒体；`LOCAL=1` 写本机 SILO，否则写 R2 |
| `dev db` | 起本机 Postgres、建库、跑迁移、把本地段写进 `.env` |
| `dev proxy` | 前台启动 Neon `/sql` 兼容代理 |
| `dev storage` | 启动本机 SILO 并准备桶（匿名只读） |

本地服务与 `LOCAL=1` 的完整说明见 [local-database.md](./local-database.md)。

## 全局选项

每条命令都支持：

| 选项 | 说明 |
| --- | --- |
| `--json` | stdout 只输出一行 JSON 信封，日志改走 stderr |
| `--quiet` | 只保留警告与错误 |
| `--dry-run` | 只读：不写库、不写文件、不上传 |
| `--log-level <level>` | `debug` / `info` / `warn` / `error`，默认 `info` |
| `--log-file <path>` | 把日志以 NDJSON 追加写入文件 |
| `-h, --help` | 显示帮助 |

`--json` 的 stdout 只有信封，方便 `| jq`：

```json
{ "ok": true, "command": "ins.add",
  "data": { "insUsername": "ritsu_mgmg", "twitterUsername": "ritsu_yumemita", "posts": 412 },
  "error": null,
  "meta": { "mode": "local", "durationMs": 8231, "dryRun": false, "version": "0.0.0" } }
```

失败同样是信封，`error` 带稳定 `code`、说明与可直接照抄的 `hint`：

```json
{ "ok": false, "command": "ins.import", "data": null,
  "error": { "code": "MISSING_ENV", "message": "缺少环境变量 INSTAGRAM_COOKIES",
             "hint": "在项目根目录 .env 里配置 INSTAGRAM_COOKIES", "context": { "name": "INSTAGRAM_COOKIES" } },
  "meta": { "mode": "remote", "durationMs": 12, "dryRun": false, "version": "0.0.0" } }
```

## 退出码

| 码 | 含义 |
| --- | --- |
| 0 | 成功 / 已收敛 |
| 1 | 运行期失败；批量任务里部分项失败也走这里 |
| 2 | 用法错误：未知参数、缺必填、非法取值 |
| 3 | 配置缺失：`DATABASE_URL` / `INSTAGRAM_COOKIES` 未配置 |

命令不自己调用 `process.exit`，一律返回值或抛 `CliError`，由 runtime 映射。

## 日志与环境

- 每条命令开工前打印一行目标环境：`本地模式（LOCAL=1） · 数据库 localhost:5432/tweets_dev`。
- 人读日志写 stderr，stdout 只留给数据输出与信封。
- `--json` 不改变可读性：CI 日志仍然是人读的，机器契约只在显式传 `--json` 时生效。

## 输入输出

`data/` 下的中间产物保留，失败可重跑、也可人工核对：

```
data/
├─ ritsu_mgmg.json          # { user, posts }，IG CDN 原始链接
├─ ritsu_mgmg.cdn.json      # 同上，媒体链接已改写成 CDN 地址
└─ instagram/ritsu_mgmg/    # <shortcode>-<序号>.<ext>
```

**入库用 `.cdn.json`。** 原始 JSON 的 `scontent-*.cdninstagram.com` 链接带签名和过期时间（`oe=`），几小时后全部 403。

头像与帖子媒体是两个位置：帖子在 `instagram/<账号>/`，头像平铺在 `instagram/<账号>.jpg`。

`.cdn.json` 里的前缀由环境决定：线上是 `IG_CDN_BASE`（默认 `https://s3.chilfish.top`），`LOCAL=1` 时是本机桶 `http://127.0.0.1:9000/tweets-viewer`。本地导入的记录切回线上后要重新导入一次。

## 代码位置

```text
apps/scripts/src/
├─ cli.ts                 # 唯一入口
├─ cli/                   # runtime / logger / envelope / exit
├─ commands/
│  ├─ ins/                # add · export · media · import · sync · verify · upload
│  └─ dev/                # db · proxy · storage
└─ lib/                   # instagram · media · db · dev-services · dev-storage · local-config
```

## 迁移对照

| 旧 | 新 |
| --- | --- |
| `gallery-dl-ins/scripts/export-user.ts <url>` | `bun run ig ins export <账号>` |
| `gallery-dl-ins/scripts/download-media.ts <json>` | `bun run ig ins media <账号>` |
| `apps/scripts/src/import-ins-data.ts <json>` | `bun run ig ins import <json>` |
| `apps/scripts/src/fetch-ins-daily.ts` | `bun run ig ins sync` |
| `apps/scripts/src/mapping.ts` 手工加映射 | 入库时写 `users.ins_username` |
| 手工在 chill-s3 传 `data/instagram/` | `bun run ig ins upload <账号>` |
