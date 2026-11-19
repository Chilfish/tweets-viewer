# 投票推文（Poll）

> 更新时间：2026-11-18
> 关联：[carousel-card.md](./carousel-card.md)（同为 card 承载的结构变体）

## 目标

让投票推文完整呈现：

- 纯文字投票：2–4 个选项、票数、百分比、最终 / 进行中状态；
- 带图投票：选项图片（2 列网格）+ 标签 + 百分比；
- 解析独立于链接卡（`card`），不影响 `media_details` / `space` 链路；
- 只读展示结果快照，不实现投票动作。

## 上游数据

投票不是独立对象，X 用 `card` 承载，信息全部在 `card.binding_values`。

| 形态 | `card.name` 样例 | 选项字段 |
| --- | --- | --- |
| 纯文字 | `poll2choice_text_only` / `poll3...` / `poll4...` | `choiceN_label`、`choiceN_count` |
| 带图 | `poll4choice_image`；syndication 实测为 `{id}:poll_choice_images` | 额外 `choiceN_image` 系列 + `choiceN_image_color` |

公共字段：

```jsonc
{
  "choice1_label": { "string_value": "Yes" },
  "choice1_count": { "string_value": "10063044" },
  "counts_are_final": { "boolean_value": true },
  "end_datetime_utc": { "string_value": "12/19/2022 11:20:32" },
  "duration_minutes": { "string_value": "720" },
  "choice_count": { "string_value": "4" }
}
```

带图选项的图片档位：`choiceN_image`（280）、`_small`、`_large`（420）、`_x_large`、`_original`；主色在 `choiceN_image_color.image_color_value.palette[0].rgb`。

## 数据模型

`packages/tweet-types/poll.ts`，挂在 `EnrichedTweet.poll`：

```ts
export interface PollChoice {
  label: string
  count: number
  percentage: number
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  color?: string
}

export interface TweetPoll {
  choices: PollChoice[]
  totalVotes: number
  countsAreFinal: boolean
  endDatetime?: string
  durationMinutes?: number
  hasImages: boolean
}
```

不塞进 `LinkPreviewCard`：投票与链接卡语义不同，`TweetLinkCard` 的「无标题 / 描述 / 图片即不渲染」规则会误杀 poll。

## 解析规则

`@chilfish/tweet` 的 `src/lib/parse/poll.ts#mapPollCard()`（纯函数）：

1. 归一化 `cardData.legacy || cardData`，`binding_values` 同时兼容 GraphQL 数组与 syndication 对象；
2. 判定以 `choice1_label` 为锚点，不依赖 `card.name`；
3. 选项上限：`choice_count`（2–4）优先，否则遍历 1–4；空槽位跳过；
4. 票数去千分位后 `parseInt`，缺失按 0；`totalVotes` 为各项之和；
5. 百分比 `Math.round(count / total * 100)`，0 票时为 0；取整后合计可能为 101%，与官方一致；
6. 图片优先级 `_original` > `_x_large` > `_large` > 默认；记录宽高与主色；
7. `counts_are_final` 兼容 BOOLEAN 与字符串 `'true'`；
8. 结束时间兼容 ISO 与 `MM/DD/YYYY HH:mm:ss`（按 UTC 解析）；
9. 有效选项少于 2 个返回 `undefined`，普通卡片不受影响。

`enrichTweet()` 同时设置 `card` 与 `poll`；poll 卡会被 `mapTwitterCard()` 的三无校验丢弃，这是预期行为。

## 组件

`apps/web-react/app/components/tweet/PollCard.tsx#PollCardView`：

- 纯文字：`<ul>` + 相对定位行，底层进度填充（`bg-primary/10`），标签 + 百分比；唯一最高票加粗；
- 带图：2 列 grid，方形图片（`MediaImage` + 主色占位）→ 标签 + 百分比 + 细进度条；
- 页脚：总票数（`toLocaleString('en-US')`）+ 状态；
- 状态：`countsAreFinal → 最终结果`；否则有结束时间 → `MM月dd日 HH:mm 截止`（固定 Asia/Shanghai）；否则 `投票中`。

渲染位置：`TweetNode` 正文之后、媒体 / 链接卡之前。

## 限制

- 票数是抓取时快照，不实时刷新；`countsAreFinal` 为 false 时可能滞后到下次抓取。
- 不提供投票动作（归档只读）。
- 旧归档数据如果没有 poll 字段，重新抓取后自然出现。

## 测试

`@chilfish/tweet` 的 `tests/parse/poll.test.ts`：

- 文字选项：票数、百分比、最终状态；
- 带图选项：原图优先、主色、US 日期格式；
- 非投票卡与单选项返回 `undefined`。
