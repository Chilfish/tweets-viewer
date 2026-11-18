# 给归档新增一个 Instagram 账号

五步：确认 twitter 用户已入库 → 导出 IG 数据 → 下载媒体并改写 CDN 链接 → 上传 R2 → 登记映射并入库。前三步在 [gallery-dl-ins](../../../gallery-dl-ins) 做，后两步在本仓库做。

`ins_posts.username` 存的是 **twitter userName**（FK → `users.userName`），不是 IG 用户名。所以写库前那个 twitter 用户必须已经在 `users` 表里，否则外键直接拒写。

---

## 0. 前置条件

| 项 | 位置 | 说明 |
| --- | --- | --- |
| `INSTAGRAM_COOKIES` | gallery-dl-ins `.env` | 完整 Cookie 串，至少含 `sessionid` + `csrftoken`。过期时表现为 401/`User not found` |
| `DATABASE_URL` | 本仓库 `.env` | `import-ins-data.ts` 经 `env.server.ts` 读取 |
| R2 写权限 | chill-s3 面板 | 上传 `instagram/` 前缀下的对象 |

账号未必有公开的 twitter 对应关系。IG 主页的简介里常有 `t.co` 短链，解析一下就能确认落在哪个归档用户上：

```bash
bun -e "const r=await fetch('https://t.co/XXXX',{redirect:'manual'}); console.log(r.headers.get('location'))"
```

先确认要写入的那一行确实存在：

```sql
select "userName", daily_fetch, ins_username from users where "userName" = 'ritsu_yumemita';
```

`daily_fetch = true` 才会进每日增量；`ins_username` / `ins_json_data` 为空就是还没接进来。

---

## 1. 导出 IG 数据

```bash
cd I:/dev/gallery-dl-ins
bun run scripts/export-user.ts https://www.instagram.com/ritsu_mgmg/
```

产出 `data/ritsu_mgmg.json`，结构是 `{ user, posts }`。`user` 是清洗后的资料（`userName` / `fullName` / `profileImage` / `followersCount` …），`posts` 是全部帖子，`created_at` 为 ISO 时间。

SDK 内置 6–12 秒随机请求间隔，且不提供关闭开关，所以帖子多的账号会连续发出数十上百次请求。撞上 429 就等一会儿重跑。

## 2. 下载媒体并改写 CDN 链接

```bash
bun run scripts/download-media.ts data/ritsu_mgmg.json
```

两个产出：

- `data/instagram/ritsu_mgmg/` — `<shortcode>-<序号>.<ext>`，图片 webp/jpg、视频 mp4
- `data/ritsu_mgmg.cdn.json` — 同样的数据，`display_url` / `video_url` / `avatar_url` / `user.profileImage` 改成 `https://s3.chilfish.top/instagram/...`

**入库必须用 `.cdn.json`。** 原 JSON 里的 `scontent-*.cdninstagram.com` 链接带签名和过期时间（`oe=`），几小时后全部 403。

## 3. 上传 R2

在 chill-s3 面板进到桶的 `instagram/` 前缀，导入文件夹 `ritsu_mgmg`，对象 key 落在：

```
instagram/ritsu_mgmg/<shortcode>-1.webp
instagram/ritsu_mgmg/<shortcode>-2.webp
```

头像要单独放到平铺位置 `instagram/ritsu_mgmg.jpg`（和用户目录同级，不在目录里）。`.cdn.json` 里的头像地址就是平铺形式。

传完抽查两个 key 是否为 200：

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://s3.chilfish.top/instagram/ritsu_mgmg.jpg
```

上传必须先于入库。顺序反了页面能打开，但每张图都是 404。

## 4. 登记映射

`apps/scripts/src/mapping.ts`：

```ts
'ritsu_mgmg': 'ritsu_yumemita',
```

key 是 IG 用户名，value 是 `users.userName`。反向表 `twitterToInsUsername` 由它自动派生，不用另写。

映射是导入脚本和每日抓取的共同入口：`import-ins-data.ts` 找不到 key 会跳过整个文件，`fetch-ins-daily.ts` 只抓「映射里有 + `daily_fetch = true`」的账号。

## 5. 入库

```bash
cd I:/dev/tweets-viewer
bun run apps/scripts/src/import-ins-data.ts ../gallery-dl-ins/data/ritsu_mgmg.cdn.json
```

脚本做两件事，都按 `post_id` upsert，可重复跑：

- `upsertInsUserInfo` → `users.ins_username` + `users.ins_json_data`
- `createInsPosts` → `ins_posts`，1000 条一批

---

## 验收

```bash
curl -s "https://tweet-api.chilfish.top/v3/ins/ritsu_yumemita?page=1" | head -c 400
```

四条都过才算接完：

- `user` 不为 `null`，`posts_count` 与导出条数接近
- `posts.data` 有时间倒序的帖子，`meta.total` 对得上
- 取一条 `display_url` 打开是 200
- 前端 `/ins/ritsu_yumemita` 头像、网格、灯箱都正常

前端返回的是 `axios-cache-interceptor` 的客户端缓存（5 分钟），导入前打开过该页面的标签页刷新一下再看。

## 踩过的坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 入库成功，页面图片全 404 | 用了 `ritsu_mgmg.json` 而非 `.cdn.json` | 签名 URL 过期，改用 `.cdn.json` 重导 |
| 头像 404，帖子图正常 | 头像传进了 `instagram/<用户名>/` 目录 | 平铺到 `instagram/<用户名>.jpg` |
| 导入打印 `No twitter mapping for IG username`，退出码却是 0 | `import-ins-data.ts` 逐文件 `catch` 后不改变 `exitCode` | 看日志不看退出码；这一步待补（见下） |
| 外键报错 | `users` 里没有对应 twitter 用户 | 先把推文归档跑完（`fetchTimeline.ts` + `insertToDB.ts`） |
| 429 / `User not found` | Cookie 过期或被限流 | 换 Cookie；间隔重试 |

## 已知缺口

- `import-ins-data.ts` 单文件失败不置 `process.exitCode`，批量导入时只能靠翻日志发现失败。下一步改成收集失败项、有失败即 exit ≠ 0。
- `dailyUpdate.ts` 的 IG 步骤目前是注释状态（`f282651`「skip the Instagram step until its cookies are refreshed」）。首次导入完成后，确认 Cookie 稳定再放开，否则每日 cron 会白跑。
- 上传 R2 仍靠面板手动操作，没有脚本。帖子量级增大后值得补一个 `PutObject` 批量上传，复用 chill-s3 里 `generate-thumbnails.ts` 的凭据读取方式。
