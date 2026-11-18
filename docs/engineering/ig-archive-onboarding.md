# 给归档新增一个 Instagram 账号

> **状态**：目标流程，代码实现中（2026-11-18）。命令落地前按文末「过渡期」的旧脚本执行。

一条命令：`bun run ig ins add <IG 账号> --twitter <twitter userName>`。它按顺序做抓取、下载媒体、入库、对账，失败即停。

写库前那个 twitter 用户必须已经在 `users` 表里：`ins_posts.username` 存的是 **twitter userName**（FK → `users.userName`），不是 IG 用户名，缺行会直接触发外键错误。

命令细节见 [ig-cli.md](./ig-cli.md)，本地库见 [local-database.md](./local-database.md)。

---

## 0. 确认对应关系

账号未必有公开的 twitter 对应关系。IG 主页简介里常有 `t.co` 短链，解析一下就能确认落在哪个归档用户上：

```bash
bun -e "const r=await fetch('https://t.co/XXXX',{redirect:'manual'}); console.log(r.headers.get('location'))"
```

确认那一行存在，并且还没接 IG：

```sql
select "userName", daily_fetch, ins_username from users where "userName" = 'ritsu_yumemita';
```

`ins_username` / `ins_json_data` 为空就是还没接进来；`daily_fetch = true` 才会进每日增量。

`.env` 需要 `INSTAGRAM_COOKIES`（至少含 `sessionid` + `csrftoken`）和 `DATABASE_URL`。Cookie 过期时抓取会报 401 或 `User not found`。

## 1. 先看会做什么

```bash
bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita --dry-run
```

`--dry-run` 只报告将要执行的步骤，不抓取、不写文件、不写库。

## 2. 正式执行

```bash
bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita
```

四步的产物与检查点：

| 步骤 | 产物 | 失败时 |
| --- | --- | --- |
| 抓取 | `data/ritsu_mgmg.json` | 不写库，退出码 1 |
| 下载媒体 + 改写链接 | `data/instagram/ritsu_mgmg/`、`data/ritsu_mgmg.cdn.json` | 同上 |
| 入库 | `users.ins_username` / `users.ins_json_data` / `ins_posts` | 已写入的部分保留，可重复跑 |
| 对账 | — | 报告失败项，退出码 1 |

想分步执行、中途核对：

```bash
bun run ig ins export ritsu_mgmg
bun run ig ins media ritsu_mgmg
bun run ig ins import data/ritsu_mgmg.cdn.json --twitter ritsu_yumemita
bun run ig ins verify ritsu_yumemita
```

## 3. 上传媒体

入库前媒体必须已经能访问。本地验证可以先跳过这步，上线前必须完成：

```bash
bun run ig ins upload ritsu_mgmg
```

对象 key：

```
instagram/ritsu_mgmg/<shortcode>-1.webp
instagram/ritsu_mgmg/<shortcode>-2.webp
instagram/ritsu_mgmg.jpg                 # 头像，平铺，不在目录里
```

没有 R2 凭据时命令会给出下一步提示，不会假装成功。也可以在 chill-s3 面板手动导入文件夹。

上传必须先于入库。顺序反了页面能打开，但每张图都是 404。

## 4. 验收

```bash
bun run ig ins verify ritsu_yumemita
```

四条都过才算接完：

- `user` 不为 `null`，`posts_count` 与导出条数接近
- `posts.meta.total` 与导出条数一致
- 全部 `created_at` 可解析且严格递减
- 抽样 `display_url` 返回 200

线上再确认一次：

```bash
curl -s "https://tweet-api.chilfish.top/v3/ins/ritsu_yumemita?page=1" | head -c 400
```

前端 `/ins/ritsu_yumemita` 的头像、网格、灯箱正常。前端有 5 分钟客户端缓存，导入前打开过的标签页要刷新。

## 日常增量

```bash
bun run ig ins sync                 # 库里 ins_username 非空且 daily_fetch = true 的账号
bun run ig ins sync --since 2026-11-16T00:00:00Z
bun run ig ins sync --account ritsu_mgmg
```

`dailyUpdate.ts` 的 cron 走同一个实现。账号是否被每日抓取由 `users.daily_fetch` 决定，不再有第二份名单。

## 踩过的坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 入库成功，页面图片全 404 | 导入用了 `ritsu_mgmg.json` 而非 `.cdn.json` | 签名 URL 过期，用 `.cdn.json` 重导 |
| 头像 404，帖子图正常 | 头像传进了 `instagram/<账号>/` 目录 | 平铺到 `instagram/<账号>.jpg` |
| 外键报错 | `users` 里没有对应 twitter 用户 | 先把推文归档跑完（`fetchTimeline.ts` + `insertToDB.ts`） |
| 429 / `User not found` | Cookie 过期或被限流 | 换 Cookie；SDK 自带 6–12 秒请求间隔，等一会儿重跑 |
| 抓到的帖子数明显偏少 | 账号是私密号，或 Cookie 失效导致只返回公开部分 | 用有效 Cookie 重跑，并核对 `posts_count` |
| `verify` 报时间顺序错误 | 库里混入了上一版导入的旧行 | 用同一条命令重跑，upsert 会覆盖 |

## 过渡期（CLI 落地前）

命令实现完成前，按下面的旧脚本执行，步骤与产物和上面一致：

```bash
# 1. 导出
cd I:/dev/gallery-dl-ins
bun run scripts/export-user.ts https://www.instagram.com/ritsu_mgmg/

# 2. 下载媒体 + 改写 CDN 链接
bun run scripts/download-media.ts data/ritsu_mgmg.json

# 3. 在 chill-s3 面板把 data/instagram/ritsu_mgmg/ 传到 instagram/ 前缀
#    头像平铺成 instagram/ritsu_mgmg.jpg

# 4. 登记映射：apps/scripts/src/mapping.ts 加一行
#    'ritsu_mgmg': 'ritsu_yumemita',

# 5. 入库
cd I:/dev/tweets-viewer
bun run apps/scripts/src/import-ins-data.ts ../gallery-dl-ins/data/ritsu_mgmg.cdn.json
```

旧脚本的两处已知问题在 CLI 里修掉：缺少映射时 `import-ins-data.ts` 只打日志、退出码仍为 0；上传 R2 没有脚本。

