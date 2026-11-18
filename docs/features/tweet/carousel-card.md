# 媒体链接卡（image_card / image_carousel / video_card）

> 更新时间：2026-11-18
> 关联：[trending-card.md](./trending-card.md)（同为 `unified_card` 的布局变体）

## 目标

让 `unified_card` 的三种媒体布局完整解析并按原图比例渲染：

- `image_carousel_*`：多图轮播，保留顺序、每张图的独立链接与 CTA；
- `image_website`：单图，按原图比例展示（不裁成 1.91:1）；
- `video_website`：视频封面 + 播放按钮 + 时长，不内嵌播放器。

## 上游数据

`card.binding_values.unified_card.string_value` 是一段 JSON：

```jsonc
{
  "type": "image_carousel_website",
  "components": ["swipeable_media_1", "details_1"],
  "component_objects": {
    "swipeable_media_1": {
      "data": {
        "media_list": [
          { "id": "3_2118597116012765184", "destination": "browser_1" },
          { "id": "3_2118597164788232192", "destination": "browser_1" }
        ]
      }
    },
    "details_1": {
      "data": {
        "title": { "content": "\u200b" },
        "subtitle": { "content": "ws-tcg.com" }
      }
    }
  },
  "destination_objects": {
    "browser_1": {
      "data": { "url_data": { "url": "https://example.com", "vanity": "example.com" } }
    }
  },
  "media_entities": {
    "3_2118597116012765184": {
      "type": "photo",
      "media_url_https": "https://pbs.twimg.com/media/xxx.jpg",
      "original_info": { "width": 1440, "height": 1800 },
      "ext": { "mediaColor": { "r": { "ok": { "palette": [{ "rgb": { "r": 255, "g": 235, "b": 157 } }] } } } }
    }
  },
  "experiment_signals": { "website_cta_card_label": "learn_more" }
}
```

可获取的信息：

| 字段 | 用途 |
| --- | --- |
| `type` | 布局判别：`image_carousel_*` / `image_*` / `video_*` |
| `components` 顺序 | 媒体区与详情区的上下顺序 |
| `media_list[]` | 轮播顺序 + 每张图独立的 `destination` |
| `media_entities[id]` | 原图 URL、宽高、`ext.mediaColor` 主色 |
| `destination_objects[].data.url_data` | 跳转 URL + 展示域名 `vanity` |
| `details_1.data.title/subtitle` | 标题 / 域名；零宽空格需视为空 |
| `experiment_signals.website_cta_card_label` | CTA 枚举（`learn_more` → 了解更多） |

## 数据模型

`packages/rettiwt-api/types/enriched/card.ts`：

```ts
export interface CardCarouselImage {
  url: string
  width: number
  height: number
  href?: string
  color?: string
  type?: 'photo' | 'video'
  video?: { mp4?: string, hls?: string, durationMs?: number }
}

export interface LinkPreviewCard {
  // ...现有字段
  layout?: 'default' | 'image_card' | 'image_carousel' | 'video_card' | 'trending'
  images?: CardCarouselImage[]
  mediaFirst?: boolean
  ctaLabel?: string
}
```

`layout` 始终由解析器写入（非媒体/trending 时为 `default`）。

## 解析规则

`helper/parseTweet.ts#parseUnifiedCard()`：

1. `type.startsWith('image_carousel')` → `image_carousel`；
   `video_` → `video_card`；`image_` 或多图 → `image_card`；否则 `default`。
2. 按 `components` 顺序遍历媒体组件：
   - 多图：`swipeable_media.data.media_list` 按顺序取 id；
   - 单图：`media_1.data.{id|media_id|media}`；
   - 去 `media_entities[id]` 取图；id 缺失时跳过，不抛错。
3. `title` / `subtitle` 去掉 `\u200b` / `\ufeff` / 空白，空串视为无值。
4. `href`：每张图的 `destination` → `destination_objects` → `url_data.url`，缺省回退卡片主链接。
5. `imageUrl` 固定取 `images[0].url`，与首图一致。
6. `ctaLabel`：常见枚举映射为中文，未知值保留原文。
7. 视频实体：`type = 'video'`，保留最高码率 mp4、HLS 和时长；UI 只展示封面 + 时长。

## 组件

`apps/web-react/app/components/tweet/CarouselCard.tsx`，由 `TweetLinkCard` 在
`layout ∈ {image_card, image_carousel, video_card}` 且 `images` 非空时渲染。

两种形态：

| 形态 | 触发 | 表现 |
| --- | --- | --- |
| 轮播（默认，多图） | 常态 | 单页按首图比例、横向 scroll-snap、箭头 + 圆点 |
| 平铺 | 点击信息条右侧切换按钮 | 2 列 / ≥4 张 3 列，一次展示全部图片 |
| 单图 / 视频 | `layout = image_card / video_card` | 单页原比例，无箭头 / 圆点 / 切换按钮 |

- 图片走 `MediaImage`（加载 / 错误 / 成功三态，自带 `referrerPolicy="no-referrer"`）。
- 视频只渲染封面 + 播放按钮 + 时长 badge（`6006ms → 0:06`），不渲染 `<video>`。
- 箭头是独立 `<button>`，与图片 `<a>` 平级，避免 `<a>` 内嵌交互元素。
- 首图比例夹在 `0.6–1.0`，防止极端长图撑爆卡片。

## 边界

- `images` 为空或媒体实体全部缺失 → 不渲染媒体卡，回退普通卡片。
- 多图比例不一致：轮播按首图比例 + `object-cover`，平铺按各自比例。
- 标题 / 描述为空时信息条只留域名 + CTA，不产生空白行。
- 暗色模式使用语义 token，不出现硬编码白色底。

## 测试

`packages/rettiwt-api/__tests__/card-media.test.ts`：

- 多图：顺序与 `media_list` 一致、`imageUrl === images[0].url`、`ctaLabel`、`layout`；
- 单图：`layout = image_card`、原图宽高；
- 视频：`layout = video_card`、最高码率 mp4、HLS、时长。
