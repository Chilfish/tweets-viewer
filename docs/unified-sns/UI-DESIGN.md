# 统一 SNS 前端 UI 设计文档（Unified SNS UI Design）

> **文档性质**：新项目前端 UI 的完整设计规格 —— 设计系统、组件库、页面拓扑、交互状态机。
> 全部设计**继承自 tweets-viewer 前端**（`apps/web-react`），可直接复制其代码骨架并替换数据模型。
>
> 核心思路：**一套外壳，多平台内容**。平台差异通过「平台徽章 + 平台特化小组件」表达，共用底层的卡片、流、媒体、
> 状态组件。所有颜色来自 CSS 变量 Token，全部组件兼容 `.dark`，全部交互满足桌面 hover + 移动端按压。

---

## 1. 设计系统（原样继承本项目 tokens）

### 1.1 直接复制的文件

| 本项目文件 | 新项目路径 | 说明 |
|---|---|---|
| `app/app.css`（`:root` / `.dark` / `@theme inline`） | `app/app.css` | Token 定义**原样拷贝**：background/foreground/card/primary/muted/border/ring + chart 系列 |
| `app/fonts.css` | `app/fonts.css` | 字体加载 |
| `app/components/ui/*`（button/input/avatar/badge/skeleton/media/separator/tabs/sheet/dropdown-menu/popover/scroll-area/calendar/input-group/textarea） | `app/components/ui/*` | 全部 Base UI/COSS 原子组件原样拷贝 |
| `app/lib/utils.ts`（`cn()` + `apiClient` axios 实例） | `app/lib/utils.ts` | 类名合并 + 缓存请求客户端 |
| `app/hooks/use-mobile.ts` `use-theme.ts` `use-hydrated.ts` | `app/hooks/*` | 响应式/主题 hooks |
| `tailwind v4` 依赖 + `@tailwindcss/vite` | 根配置 | 构建链 |

### 1.2 Token 纪律（强制）

- 颜色**只用** `bg-background` / `bg-card` / `text-foreground` / `text-muted-foreground` / `border-border` / `bg-primary` 等 Token；
  禁止 `bg-[#...]` 与 `dark:` 手动覆盖（Token 已自动切换）。
- 品牌色**不允许**进通用组件：X 蓝、IG 渐变、YouTube 红只出现在「平台徽章」组件里（图标/文字上色），
  任何卡片背景/边框必须保持中性 Token，保证多平台并排时不花。

### 1.3 物理与动效（继承）

- 快速反馈 150ms `ease-out`；标准过渡 `--ease-apple` 200-250ms；弹层 `--ease-spring` 300-350ms。
- 移动端按压反馈 `active:scale-95`；触控目标 ≥44px；`prefers-reduced-motion` 全局降级（app.css 已有实现）。
- View Transitions：文档级路由淡入淡出 + 媒体墙缩略图 ↔ 灯箱 `HERO_NAME` morph（MediaWall.tsx 模式，可直接复制）。

---

## 2. 组件树（新项目 component 结构）

```
app/
├── components/
│   ├── ui/                      # ← 从本项目原样拷贝（§1.1）
│   ├── post/                    # 统一帖子组件（核心新组件）
│   │   ├── PostCard.tsx         # 统一帖子卡片（总装）
│   │   ├── PostHeader.tsx       # 作者行：avatar + name + verified + @username + 平台徽章
│   │   ├── PostBody.tsx         # 正文（RichText + entities）
│   │   ├── PostMedia.tsx        # 统一媒体网格（IGMediaGrid 改造）
│   │   ├── PostActions.tsx      # 指标行 + 原文链接
│   │   ├── PostMeta.tsx         # 时间戳/标签/位置
│   │   ├── RepostBanner.tsx     # 转帖横幅（TweetNode 的 Repeat2 模式）
│   │   ├── QuoteCard.tsx        # 引用嵌套（quoted 变体）
│   │   ├── PostSkeleton.tsx     # 骨架（tweet-skeleton 模式）
│   │   └── PlatformBadge.tsx    # 平台徽章 + 平台图标映射表
│   ├── platform/                # 平台特化小组件（extra 消费）
│   │   ├── MusicInfo.tsx        # IG 音乐条 ← IGMusicInfo.tsx
│   │   ├── VideoMeta.tsx        # YouTube/B 站 时长/频道
│   │   └── WeiboSource.tsx      # 微博来自 xxx
│   ├── feed/
│   │   ├── FeedStatus.tsx       # ← feed-status.tsx 原样拷贝（四态：fetching/error/exhausted/empty）
│   │   ├── InfiniteScrollTrigger.tsx  # ← 原样拷贝
│   │   └── DateDivider.tsx      # 跨天分隔线 ← date-divider.tsx
│   ├── layout/
│   │   ├── Layout.tsx           # ← layout.tsx（侧边栏/顶栏/底栏三端）
│   │   ├── Sidebar.tsx / TopNav.tsx / BottomNav.tsx  # ← 原样拷贝改文案
│   │   ├── PlatformTabs.tsx     # 平台筛选 Tabs（user-tabs.tsx 改造）
│   │   └── AuthorSelector.tsx   # 作者选择器（user-selector.tsx 改造）
│   ├── media/
│   │   ├── MediaWall.tsx        # ← 原样拷贝（瀑布流 + hash 灯箱 + hero transition）
│   │   ├── MediaCard.tsx        # ← 原样拷贝（blur-up 缩略图）
│   │   └── MediaLightbox.tsx    # ← MediaPreviewModal/Overlay 改造（支持视频 + 手势）
│   ├── home/                    # 首页（hero/features 文案改为统一 SNS 归档）
│   └── skeletons/               # ← 原样拷贝
├── lib/
│   ├── post-stream.ts           # ← paginated-stream.ts（applyLoaderPage/applyFetchedPage 原样）
│   ├── media.ts                 # FlatMediaItem 派生逻辑（extractMediaFromPosts）
│   └── utils.ts                 # ← 原样拷贝
├── hooks/
│   └── use-post-stream.ts       # ← use-url-paginated-stream.ts（T 泛型直接复用）
├── store/
│   ├── use-app-store.ts         # ← 原样拷贝（主题/密度/侧栏）
│   ├── use-author-store.ts      # ← use-user-store.ts 改造（作者列表）
│   └── use-media-viewer.ts      # ← 原样拷贝
└── routes.ts                    # 路由表（§6）
```

---

## 3. 统一帖子卡片：PostCard 设计

### 3.1 布局模板（按平台自动分流）

```
┌─────────────────────────────────────────────┐
│ PostHeader                               ← 平台徽章在右端（X=蓝/IG=渐变/YT=红…）
│  [avatar] 显示名 ✓   @username   [Badge]     │
├─────────────────────────────────────────────┤
│ RepostBanner（type=repost 时）               │
│    ↻ @name 转帖于 2026年08月31日             │
├─────────────────────────────────────────────┤
│ PostBody（text 渲染；entities 存在时才走富文本）            │
├─────────────────────────────────────────────┤
│ PostMedia                               ← 见 §4 │
├─────────────────────────────────────────────┤
│ QuoteCard（quotedPost 嵌套框）              │
├─────────────────────────────────────────────┤
│ platform/ 特化组件（extra 消费，如 IG 音乐）  │
├─────────────────────────────────────────────┤
│ PostActions：◈ like ◈ repost ◈ reply ◈ view  │
│ 时间戳（紧凑，点开源平台） · #tags           │
└─────────────────────────────────────────────┘
```

### 3.2 PostHeader

- 结构直接抄 `tweet-header.tsx`：头像（`Avatar` 组件，fallback=首字母）+ 显示名（bold truncate，**`displayName` 缺失时直接展示 `username`**）+ `VerifiedBadge`（lucide `BadgeCheck`，颜色平台化，**`verified` 缺失/为 false 时隐藏**）+ `@username`（muted，无 @ 语义的平台省略前缀）。
- **平台徽章**：右侧 `PlatformBadge` —— 圆形图标（lucide）：`X` 用 X logo（本项目 react-tweet/icons 有 X 系 SVG 先例，IG 有 `InsLogo.tsx` 先例），颜色取平台品牌但**只用图标填充色**，尺寸 `size-4`，`text-muted-foreground/70` hover 提亮；点击跳转源平台帖子 URL。
- 引用变体（quote 卡片内）：缩小字号（`tweet-header-in-quote` 模式）。

### 3.3 PostBody —— 富文本渲染（默认通路 = 纯文本）

> ⚠️ **契约**：`post.text` 是唯一必渲染字段。`entities` 只是增强，**渲染路径必须以「无 entities」为默认**：
> 任何平台、任何帖子（哪怕只有一行纯文本）都必须能正确渲染正文。

- **默认路径（所有平台）**：`post.text` → `RichText` 正则解析（`RichText.tsx` 原样拷贝，parseLinks/parseMentions/parseHashtags 与平台无关）→ 纯文本 + 自动链接。此路径不读 `entities`，零平台假设。
- **增强路径（平台提供 `entities` 时）**：`post.entities` 按 index 遍历（抄 `tweet-body.tsx` 的 switch）：
  - `url` → ellipsis 短链接；`mention`/`hashtag` → 平台站内链接；`text` → 原文片段；
  - `media`/`separator` → `null`。
  - **前置条件**：`entities` 数组完整覆盖 text（DATA-MODEL §3.5 渲染契约）；不完整时逐段回落 RichText 兜底，禁止渲染截断正文。
- 字体：`tweet-body` 的 CSS 规则（`--font-sans` + emoji 回退 + `[lang='ja'/'zh']` 追加字体）。多平台内容语言混杂，
  `lang` 有值就标 `<p lang={post.lang} dir="auto">`；缺省不标（走默认字体）。

### 3.4 PostActions 与指标

- 只读展示（本项目「纯只读、无社交交互」原则）：
  `❤ like（fill-primary）` `↻ repost` `💬 reply` `👁 view` —— 数字 `tabular-nums`，`text-muted-foreground`。
- **指标是 Rich 层**：`metrics` 缺失 → 整行不渲染（只保留时间戳行）；单指标缺失 → 只渲染存在的项。
- 右端固定「在源平台查看」外链图标（`ExternalLink`），`target=_blank` —— 这是 Core 层就保证的存在（`url` 必有）。

### 3.4b 最坏情况渲染清单（新项目强制测试项）

| # | 输入（Core 层最小样本） | 期望渲染 |
|---|---|---|
| 1 | `{text, createdAt, author:{username}, media:[]}` | 纯文本卡片 + 头像fallback + 时间戳，无任何报错/空白块 |
| 2 | `media:[{id,type:'photo',url}]`（无尺寸/无缩略图） | 单图按 `aspect-square` 兜底渲染，blur-up 可用 |
| 3 | 无 `type` | 按普通 post 渲染，无转帖/引用分支 |
| 4 | 无 `entities` | RichText 正则渲染链接/@/# |
| 5 | 无 `metrics` | 无指标行，仅时间戳 |
| 6 | 长文本 + 多图 + 无尺寸 | 布局不塌（图格占位高度由数量推导） |

### 3.5 转帖横幅（RepostBanner）

- 抄 `TweetNode.tsx` 的 retweeted 分支：`Repeat2Icon + @author 转帖于 + 格式化时间`，点击跳转源平台。
- 统一语义：`type === 'repost'` 且存在 `repostOf` 时显示；横幅里展示 `repostOf.author`。

### 3.6 QuoteCard（引用嵌套）

- 抄 `TweetNode` 的 `variant="quoted"`：`bg-muted/40 border rounded-2xl p-3` 内嵌卡片，递归渲染 `quotedPost`；
  引用内部不再嵌套引用（深度 1）。
- 卡片点击 → 深链到源平台（本项目引用卡片无点击跳转，这里做增强：整卡可点）。

---

## 4. 统一媒体组件：PostMedia

### 4.1 设计来源

- **多图网格** → `IGMediaGrid.tsx`（`distributeRows` 智能行分布 + 折叠堆叠 `PhotoStack` + 内容感知 `object-position`），这是本项目最成熟的媒体网格，**优先复用其逻辑**。
- **单图/视频** → `tweet-media.tsx` 的比例容器 + `MediaImage/MediaVideo`（blur-up 加载）。
- **视频** → `tweet-media-video.tsx` + `MediaVideo`（可播放闸门：非激活不加载源）。

### 4.2 统一网格规则（PostMedia）

| 媒体数 | 布局 |
|---|---|
| 1 photo | 单图：`aspectRatio` 原生比例，竖图 `<85%` 宽（tweet-media 竖屏限宽规则）；带 `altText` |
| 1 video | 全宽视频播放器 + 右上角 `PlayIcon` 角标 |
| 2-4 | `grid-cols-2`（`length==3` 首图占两行；`length>4` `grid-rows-2` —— 抄 tweet-media） |
| ≥5 | IG 九宫格逻辑：`maxCols=3` 智能分布 + 超出折叠为 `PhotoStack`（`+N` 角标），点开「展开」 |
| 混杂 | 视频格带播放角标；全部格子 `aspect-square` |

- **点击行为**：photo → 灯箱（MediaWall hero transition）；video → 先播放（网格内），全屏按钮进灯箱。
- **占位**：加载前用比例骨架（`getSkeletonStyle` 模式）防布局抖动；加载失败（`onError`）隐藏该格（TweetCard.CardImage 模式）。

### 4.3 媒体墙（MediaWall）

- `lib/media.ts` 的 `extractMediaFromPosts`：遍历帖子 → 展平 `media` → `FlatMediaItem`（`url/type/width/height/aspectRatio/videoInfo/createAt/post` 引用）→ 按 URL 去重。
- `use-media-columns.ts`：桌面多列瀑布流（round-robin 分桶），移动端单列。
- 灯箱：**hash 驱动**（`#media=N`，前进后退天然支持 + 可分享定位），`replaceState` 切换，关闭后 URL 干净。
- `MediaCard` blur-up：加载前 `blur-md scale-[1.03]` → 加载后 `blur-0`，视频/GIF 角标照抄。

---

## 5. 页面与路由

```
/                    首页（Hero + 全部归档作者入口 + 平台覆盖图 + 那年今日入口）
/posts/:name         统一时间线：该作者全平台帖子流（无限滚动 + 分页器）
/media/:name         媒体墙：该作者全部媒体（瀑布流 + 灯箱）
/search/:name?       搜索：q 关键词（可限定作者）
/memo/:name          那年今日：同月同日历史帖子（按年分组 + 年分隔线）
/posts/:name/:platformId?   平台过滤视图（或作为 query：?platform=x）
/authors             作者列表（全部平台档案）
```

### 5.1 统一时间线 `/posts/:name`

- **URL 状态协议**（对齐本项目 Specification §3.2）：
  `?page=1&platform=x&start=&end=&q=&reverse=`。前端只改 URL，loader 监听请求。
- **工具栏**（sticky glass `bg-background/80 + backdrop-blur-xl`）：左侧分页导航 `1 / 42`（TweetNavigation 模式），右侧 `platform` 筛选 Tabs + 排序 + 日期范围。
- **平台筛选**：`PlatformTabs` 并列「全部 / X / IG / YouTube / B站 / 微博…」，激活态 `primary` 下划线；选择写入 URL `platform=`。
- **流**：`use-post-stream`（← use-url-paginated-stream 原样，泛型 `UnifiedPost`）→ `PostCard` 列表 +
  `InfiniteScrollTrigger`（rootMargin 800px）+ 跨天 `DateDivider`。
- **四态**：`FeedStatus` 原样（尾部 loading/error+重试/exhausted 分隔尾、空态图标+文案、全页错误态）。
- **骨架**：ProfileHeader 骨架 + 3-5 个 `PostSkeleton`。

### 5.2 布局与导航（对齐本项目 §5.4 职责分工）

| 端 | 组件 | 职责 |
|---|---|---|
| 桌面 | `Sidebar`（左固定）+ `AuthorSelector` 底部 | 全局导航 + 作者切换 |
| 移动 | `TopNav`（AuthorSelector 合并上下文）+ 主题切换 | 上下文 |
| 移动 | `BottomNav`（首页/时间线/媒体/搜索/那年今日）5 Tab，iOS Tab Bar 范式 | 全局导航 |

- 桌面主内容列 `max-w-[600px]`（时间线）/ `max-w-6xl`（媒体墙 `isWide` handle，照抄 layout.tsx）。
- ProfileHeader（`ProfileHeader.tsx` 改造）：作者档案（头像/banner/简介/统计）跨平台合并展示，平台徽章行标注每个平台账号。

### 5.3 首页 / 搜索 / 那年今日

- **首页**：Hero 文案「把一个人的多平台网络人生，统一归档，随时翻阅」+ 归档作者卡片网格（多平台徽章）+ 平台覆盖图 + `⌘K` 全局搜索快捷键（use-global-shortcuts）。
- **搜索**：sticky glass 搜索框（rounded-full，占位符「在 @name 中搜索」）+ 结果总数 + 空态引导；`?q=` URL 驱动。
- **那年今日**：日期大字 + 按年分组（`groupTweetsByYear` 改造为 `groupPostsByYear`）+ 年分隔线；仪式感文案保留。

---

## 6. 关键交互与状态（继承本项目硬性规范）

1. **列表四态**统一 `FeedStatus`；新增平台加载**不**打乱已渲染项（append 去重，`appendUnique` 按 `id`）。
2. **骨架优先**：无 spinner 全局转圈；初次加载/硬重置 → 骨架；滚动加载 → FeedStatus 尾部态。
3. **按压反馈**全覆盖：卡片内可点元素 hover（桌面）+ `active:scale-*`（移动）。
4. **触控目标** ≥44px：媒体灯箱底部操作条、BottomNav Tab、sheet grabber。
5. **图片策略**：所有 `<img>` `loading="lazy" decoding="async"`；`MediaImage` 统一走媒体代理（见 API.md §6）。
6. **a11y**：`aria-hidden` 装饰图标（FeedStatus 模式）；键盘可达（PhotoStack 的 `onKeyDown` 模式）；`prefers-reduced-motion` 降级。

---

## 7. 多平台并排的视觉纪律（新项目特有）

| 场景 | 规则 |
|---|---|
| 时间线混排多平台 | 卡片外壳完全一致；平台差异只在徽章与 extra 组件 |
| IG/图文帖 | 保持 IG 原生节奏（媒体 → ActionBar → 时间戳 → Caption 顺序，抄 InstagramPostCard）—— 通过 `PostCard` 的 `layout` 变体切换 |
| 视频帖 | 封面 + 时长角标（youtube/bilibili extra），点击灯箱内播放 |
| 转帖 | 横幅语义统一：`↻ @name`（X/微博/IG 转帖 icon 不同但语义一致，用同一 lucide `Repeat2Icon`；平台重色只进徽章） |
| 空平台数据 | `PlatformTabs` 灰化无数据平台；`FeedStatus` 空态说明「@name 在 X 上暂无归档」 |

---

## 8. 开发顺序建议（UI 侧）

1. **骨架期**：拷贝 app.css/ui/Layout/store/hooks/paginated-stream → 空路由跑通（1 天）
2. **类型期**：落地 DATA-MODEL 的 `UnifiedPost` 到 `packages/shared`，用 mock JSON 数据写 30+ 条测试样本
3. **卡片期**：PostCard 三大组件（Header/Body/Media）—— 先支持 X + IG 两种封面布局
4. **流期**：`use-post-stream` + FeedStatus + 平台筛选 Tabs + 分页器（对接 API 契约）
5. **媒体期**：MediaWall + 灯箱（hero transition）
6. **页面期**：搜索/那年今日/首页
7. **打磨期**：按压反馈全覆盖、骨架细节、a11y、`⌘K`

> 测试规范沿用本项目：Vitest（zustand store / paginated-stream 纯函数 / 清洗适配器三块必测），
> Storybook 组件驱动。