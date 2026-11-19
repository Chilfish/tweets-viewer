# X client transaction ID 与外壳 cookie

> 更新时间：2026-11-19
> 关联：上游 `@chilfish/tweet` 的 `src/lib/transaction.ts` 与 `tests/transaction.test.ts`
>
> 运行时已迁到 `@chilfish/tweet@0.2.0`；本仓库旧 Fork 已删除，只保留
> `packages/tweet-types` 归档类型。下文代码路径为历史参考（同名实现已在上游包内）。

## 结论

- `x-client-transaction-id` 需要从 X 页面外壳里的 `ondemand.s` webpack chunk map 推导 key byte indices。
- X 的新 Rolldown/Vite 外壳已经删掉这个 chunk map；只有**旧外壳**才有。
- 同一 URL `x.com/home`：匿名 → 新外壳（无 `ondemand.s`）；**带登录 cookie → 旧外壳（有 `ondemand.s`）**。
- 因此修复点是：**请求外壳时附上解码后的 cookie**。不是换页面。

## 机制

| 输入 | 来源 | 旧外壳 | 新外壳 |
| --- | --- | --- | --- |
| site verification key | `<meta name="twitter-site-verification">` | ✅ | ✅ |
| anim frames | `#loading-x-anim-*` 的 SVG path | ✅ | ✅ |
| key byte indices | `ondemand.s` chunk 内的正则 | ✅ | ❌ |

只有 indices 依赖 webpack chunk map，所以问题收敛为「如何拿到旧外壳」。

## 实现

`@chilfish/tweet` 的 `src/lib/services/public/FetcherService.ts`：

```ts
export const X_SHELL_URLS = [
  'https://x.com/home',
  'https://x.com/i/topics',
  'https://x.com/i/display',
  'https://x.com/i/timeline',
  'https://x.com/i/communitynotes',
]

export function buildXShellHeaders(headers, apiKey) {
  const shellHeaders = { ...headers }
  if (apiKey)
    shellHeaders.cookie = AuthService.decodeCookie(apiKey)
  return shellHeaders
}
```

- `_fetchXHomePage()` 使用 `buildXShellHeaders(this.config.headers, this.config.apiKey)`；
- 有 `apiKey`（生产 `TWEET_KEYS`）时，所有候选页面都会返回旧外壳，`/home` 即可命中；
- 无 `apiKey` 的 guest 场景仍可能拿到新外壳，保留其余候选页作为 fallback；
- `isUsableXDocument()` 校验「site verification key + `ondemand.s`」两者同时存在。

## 证据

同一 URL，仅切换 `Cookie` 头：

| 模式 | 响应大小 | `ondemand.s` |
| --- | --- | --- |
| 匿名 `/home` | ~16.8 KB | 0 |
| 带 cookie `/home` | ~305 KB | 1 |
| 带 cookie `/i/topics` | ~305 KB | 1 |

indices 每次构建都会变，不能 pin 或长期缓存；必须在运行时解析当前 chunk。

## 复现

```bash
KEY=$(grep -E '^\s*TWEET_KEYS\s*=' .env | cut -d= -f2- | cut -d, -f1 | tr -d ' ')
COOKIE=$(node -e "process.stdout.write(Buffer.from(process.argv[1],'base64').toString())" "$KEY")

UA='Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0'
curl -sL --compressed -A "$UA" https://x.com/home | grep -c ondemand.s                # 0 = 新外壳
curl -sL --compressed -A "$UA" -H "Cookie: $COOKIE" https://x.com/home | grep -c ondemand.s  # 1 = 旧外壳
```

## 测试

`@chilfish/tweet` 的 `tests/transaction.test.ts`（本仓库 fork 的同类测试保留作历史参考）：

- `isUsableXDocument` 接受同时含 verification key 与 `ondemand.s` 的文档；
- 拒绝新外壳（无 chunk map）与缺少 verification key 的文档；
- `X_SHELL_URLS` 首项为 `/home`；
- `buildXShellHeaders` 在有 / 无 `apiKey` 时分别附加 / 不附加 cookie。
