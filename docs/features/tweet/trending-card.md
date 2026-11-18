# Trending 卡片增强（jetfuel_attachment）

> 更新时间：2026-11-18

## 背景

部分链接卡的 `unified_card` binding 只包含基础标题 / 描述，官方页面渲染的完整数据
（分类、头像组、posts 数、更新版描述与图片）来自响应里的 `jetfuel_attachment` 字段。
payload 是 base64 编码的 X 私有「节点化字典压缩帧」，格式不稳定（官方明确 not a stable schema），
因此解析策略是「尽力而为 + 回退」。

触发条件：`TweetRequests.details()` 的 features 中 `responsive_web_jetfuel_frame: true`。
本项目已开启。

## 数据链

```
TweetResultByRestId
  └─ card（unified_card binding）        → 基础 title / description / imageUrl
  └─ jetfuel_attachment.payload          → parseTrendingCard() → TrendingCardInfo
                                              ↓
                                    mapTwitterCard() 合并：jetfuel 优先
```

## 数据模型

`LinkPreviewCard.trending?: TrendingCardInfo`：

```ts
export interface TrendingCardInfo {
  source: 'jetfuel'
  url: string
  imageUrl: string
  categories: string[]
  avatars: string[]
  postsCount?: string
  title: string
  description?: string
}
```

## 合并策略

`helper/parseTweet.ts#mapTwitterCard(cardData, jetfuelAttachment?)`：

1. 先解析 `unified_card`，作为基线；
2. 若存在 `jetfuelAttachment.payload`：`parseTrendingCard(payload)`；
3. 成功 → 用 jetfuel 的 `title` / `description` / `imageUrl` / `url` 覆盖，
   设置 `layout: 'trending'` 与 `trending` 结构化字段；
4. 失败 / 解析为空 → 保留 `unified_card` 结果，并输出 `console.warn` 提示 payload 结构变更；
5. `jetfuel_attachment` 缺失（旧响应 / 非 Trending 推文）→ 静默走普通卡。

## 组件

`apps/web-react/app/components/tweet/TrendingCard.tsx#TrendingCardView`，
由 `TweetLinkCard` 在 `card.trending` 存在时优先渲染。

结构（对照官方渲染）：

- 外链 `<a>` 圆角边框；
- 图片区 `aspect-[18/10]`，底部渐变遮罩保证文字可读；
- 覆盖层（自下而上）：
  - meta 行：分类，`•` 分隔；
  - 标题：`line-clamp-3`；
  - 头像组（最多 3 个，`Avatar`）+ `• {postsCount}`；
  - 描述：`line-clamp-2`。

主图 `alt=""`（装饰图，标题 `h3` 已承载可访问名称）；头像使用 `Avatar` 保持圆形与尺寸一致。

## 边界

- 解析失败不影响普通卡片渲染。
- `trending` 非空时优先渲染，不依赖 `title` / `description` / `imageUrl` 的合并结果。
- 无 `trending` 时保持现有链接卡布局不变。
