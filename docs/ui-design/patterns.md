# 页面与组件结构参考

> 新增页面、拆分页面或添加组件时按本页起步。视觉值见 [visual.md](./visual.md)，三态细节见 [feedback.md](./feedback.md)，工程约定见 [code-style.md](../engineering/code-style.md)。

## 0. 信息预算

写页面前先用一句话回答：**谁打开它、想知道什么、下一步做什么。** 这句话之外的元素先放进对话框、Sheet 或二级页。

- 首屏先给答案：当前用户、归档覆盖、关键数字、下一步入口。
- 每个视图保留一个主操作（填充按钮）；次要动作使用 `ghost` / `outline`，低频动作进菜单。
- 一屏最多 4 个关键数字；完整统计放进对话框或二级页。
- 复杂筛选放进 `Sheet` / `Popover`；页面保留摘要与入口。
- 区块只承担一件事；没有内容的区块不渲染，页面不摆空卡片。
- 同一信息只出现一次；重复说明删掉。
- 检查方法：删掉任意区块后，页面是否仍回答核心问题。答案为是时，删除这个区块。

生成完成后再按 [information-density.md](./information-density.md) 的删除清单过一遍。

## 1. 页面骨架

页面占满可用高度，工具栏固定，内容区自己滚动。项目现有布局由 `layout/layout.tsx` 承担：

- 移动端：`TopNav` + `<main>` + `BottomNav`
- 桌面端：`Sidebar` + `<main>`（列表页上限 `max-w-[600px]`，宽视图 `sm:max-w-6xl`）
- 路由进入动画由 `layout.tsx` 的 `pageTransition` handle 控制；不要再在页面内叠同向动画

页面级组件只做两件事：拼装区块、把 URL / loader 数据传给展示组件。页面容器建议不超过 250 行。

```tsx
<div className="flex w-full flex-col">
  <header className="flex items-center gap-2 px-4 py-2">
    {/* 标题、计数、搜索或筛选 */}
    <div className="ml-auto flex items-center gap-1">{/* 至多三个控件簇 */}</div>
  </header>

  <div className="min-h-0 flex-1">
    {/* 列表或内容 */}
  </div>
</div>
```

- 跨页复用的组件放 `app/components/`；单页私有的区块放组件目录下的子目录（如 `components/tweet/`、`components/ins/`）。
- 纯逻辑放 `app/lib/`，同目录补 `__tests__/*.test.ts`。
- 组件接收 props，不在展示组件里直接取路由数据。
- `ScrollArea` 父级需要有确定高度；需要滚动时优先用它而不是裸 `overflow-auto`。

## 2. 页面类型

| 类型 | 结构 | 本项目对应 |
| --- | --- | --- |
| 列表页 | 标题行（用户 + 计数 + 筛选）+ 列表 + 底部加载 | `/tweets/:name`、`/search/:name?`、`/ins/:name` |
| 分组列表 | 年份分组 + 组内时间平铺 | `/memo/:name?` 那年今日 |
| 网格页 | 标题行 + 分组 + 网格；工具栏保持一行 | `/media/:name` |
| 概览页 | 状态区 + 主操作 + 最多 4 个数字 + 最近条目 | `/` 首页 |

**长列表**

- 分页 / 游标加载由 `useUrlPaginatedStream` + `meta.hasMore` 驱动；不要自己写滚动监听。
- 首屏骨架数量接近可见行数，减少加载后的跳动。
- 底部加载使用 `Spinner` +「正在加载更多…」；到底后显示「已加载全部内容」。
- 分页参数写入 URL（`?page=`），返回时能回到同一页；续载游标由 hook 管，不手写。

**筛选与 URL**

本项目的结果集参数：

| 参数 | 含义 | 出现位置 |
| --- | --- | --- |
| `page` | 页码（分页器） | 所有列表页 |
| `reverse` | 时间正序 / 倒序 | 时间线、媒体、那年今日 |
| `start` / `end` | 日期范围 | 时间线、媒体 |
| `no_replies` | 排除回复 | 时间线 |
| `q` | 搜索关键词 | 搜索 |
| `focus=search` | 搜索框自动聚焦 | 搜索 |

- 会改变结果集的筛选写入 URL；纯展示偏好写入 store 或组件状态。
- 切换筛选时清空与旧结果绑定的选择，并回到第 1 页。
- 使用 `useSearchParams` 读写；更新时保留无关参数。

## 3. 工具栏

- 左侧：页面名 + 总数。计数使用 `tabular-nums`。
- 右侧按优先级分三段，最多三个控件簇：
  1. 一个主控件（搜索、日期筛选或主按钮）；
  2. 常用切换（`ToggleGroup`、`SegmentedControl`）；
  3. `⋯` 溢出菜单（`DropdownMenu`），放低频与维护动作。
- 选项多于 3 个且互斥时，用 `Popover` 承载一组带标签的控件；筛选生效时按钮带一个小圆点。
- 图标按钮使用 `size="icon-sm"`，同时提供 `aria-label` 与 `title`。
- 批量选择时，工具栏整条换成批量条，动作顺序：全选、主操作、次操作、取消。
- 页面头部需要分组控件时使用 `Toolbar`；它是带边框的控件容器，不替代页面 `<header>`。

## 4. 行与卡片

**列表行**

- 行高 56–80，左右内边距 16。
- 行内按「主信息、次要信息、右侧动作」排列。
- hover 使用背景或透明度变化，尺寸保持稳定；选中使用 2px 主色描边或 `bg-accent`。
- 元数据、计数、标签等短文本可以 `truncate`；标题与正文换行，不截断。数字列右对齐。
- 推文卡片使用项目已有的 `.tweet-container`；不要在卡片内部再套一层 Card。

**卡片**

- 使用 `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardPanel`（别名 `CardContent`）/ `CardFooter`。
- 卡片承载独立对象与详情入口；同质内容优先用列表或表格。
- 卡片圆角由组件内置（`rounded-2xl`），不额外覆盖。
- 卡片内不再嵌套卡片；需要分区时用 `Frame` / `FramePanel` 或分隔线。
- 推文流本身已经是卡片形态，不要在每条推文外再包 Card。

**媒体网格（窄屏换形态）**

图片和视频集合在窄屏不要压缩成更小的小方块：

- 移动端使用 2–3 列紧凑网格；桌面使用 3–4 列。
- 图块保持固定宽高比（`aspect-[4/3]` / `aspect-square`），避免加载后跳动。
- 长标题或说明在网格外单独展示，不塞进图块。
- 点击进入灯箱；灯箱手势与键盘由 `GlobalMediaViewer` 统一处理。
- 用设备模拟（宽度 + 触摸）验证 320 / 390px，不只看桌面缩窗口。

## 5. 状态三件套

| 状态 | 组件 | 规则 |
| --- | --- | --- |
| 空 | `Empty` / `FeedStatus` | 说清是什么、为什么空、下一步做什么 |
| 加载 | `Skeleton` / `Spinner` / `Button loading` / `ProgressBar` | 首屏用骨架，翻页用尾部 Spinner，按钮动作用 loading |
| 失败 | `ErrorBoundary` / `FeedStatus` / `Alert` | 说明原因并给重试；堆栈只进日志 |

列表页统一使用 `~/components/feed-status.tsx`：它已经覆盖「尾部加载 / 尾部失败 / 已到底 / 空态 / 全页失败」五种情况，不要在每个路由重复手写。

完整规则与文案示例见 [feedback.md](./feedback.md)。

## 6. 数据与状态

- 服务端数据用 React Router 的 `clientLoader`；客户端交互状态用 `useState`。
- 跨页共享才使用 Zustand（`app/store/`）；单页状态留在组件里。
- 数据获取路径必须覆盖 loading / empty / error。
- 请求参数与结果类型显式声明；不使用 `any`。
- URL 是筛选 / 分页的单一事实来源；不要同时把同一状态写进 URL、store 和组件状态。
- 持久化 store 改动 schema 时升 `version` 并写迁移；渲染前用 `useHydrated()` 判断客户端是否就绪。
- 路由切换的全局进度由 `root.tsx` 的 `ProgressBar` 承担。

## 7. 可访问性

- 每个图标按钮提供 `aria-label`；装饰图标标 `aria-hidden="true"`。
- 标题按层级使用 `h1` → `h2` → `h3`，不跳级。
- `Tab` 顺序与视觉顺序一致；`Esc` 关闭浮层；浮层关闭后焦点回到触发元素。
- 焦点样式使用 `focus-visible:ring-2`；不要移除 outline 后不补替代。
- 颜色状态同时配文字或图标。
- 触控目标不小于 44×44px；按钮与 Badge 组件的 `pointer-coarse` 样式已处理。
- 尊重 `prefers-reduced-motion`；减少动态时保留淡入。

## 8. 新增页面检查清单

- [ ] 路由注册在 `app/routes.ts`，按现有结构挂到 `layout` 下或作为资源路由。
- [ ] 路由模块使用 `import type { Route } from './+types/<name>'`。
- [ ] 页面容器不超过 250 行；取数与纯逻辑已拆分。
- [ ] 三种状态齐全：空、加载、失败（列表优先复用 `FeedStatus`）。
- [ ] 工具栏控件不超过三段，主操作只有一个。
- [ ] 筛选 / 分页进 URL，展示偏好进 store。
- [ ] 内部导航用 `<Link>`；读 URL 用 `useSearchParams`。
- [ ] 图标按钮有 `aria-label`；键盘路径可用。
- [ ] 间距、圆角、字号与 [visual.md](./visual.md) 一致。
- [ ] 按 [information-density.md](./information-density.md) 的删除清单检查：无重复表述、口径脚注、自证式导航。
- [ ] 320 / 390px 无横向溢出；媒体网格不压缩成不可读的小方块。
- [ ] 纯逻辑有同目录 `*.test.ts`，测试能失败。
- [ ] `bun run typecheck`、`bun run lint:check`、`bun run test`、`bun run build:client` 通过。

## 9. 组件速查

| 需求 | 组件 |
| --- | --- |
| 单行选项（2–4 项） | `SegmentedControl` |
| 图标切换 | `ToggleGroup` / `Toggle` |
| 下拉选择 | `Select` |
| 带标签的筛选面板 | `Popover` + `Select` / `SegmentedControl` |
| 低频动作 | `DropdownMenu` / `ContextMenu` |
| 行内提示 | `Alert` |
| 破坏性确认 | `AlertDialog` |
| 自包含任务 | `Sheet` / `Dialog` |
| 移动端底部面板 | `Drawer`（`position="bottom"`） |
| 搜索输入 | `InputGroup` + `InputGroupInput` |
| 日期范围 | `Calendar` + `Popover` / `Sheet` |
| 短标签与状态 | `Badge` |
| 快捷键提示 | `Kbd` / `Tooltip` |
| 加载 | `Skeleton` / `Spinner` / `Progress` |
| 空状态 | `Empty` / `FeedStatus` |
| 长内容滚动 | `ScrollArea` |
| 列表四态 | `FeedStatus` |

完整导入路径与用法见 [components/GENERAL.md](./components/GENERAL.md)。
