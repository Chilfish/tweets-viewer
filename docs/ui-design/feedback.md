# 空、加载、错误与反馈

> 三态与反馈的统一规则。新增页面时按本文选择组件与文案结构；页面骨架见 [patterns.md](./patterns.md)，组件 API 见 [components/GENERAL.md](./components/GENERAL.md)。

## 1. 空状态

空状态回答三件事：

1. 这里是什么；
2. 为什么现在是空的；
3. 下一步做什么。

本项目列表页优先复用 `FeedStatus`；需要更丰富的插画式空态时使用 `Empty`。

```tsx
import { InboxIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <InboxIcon aria-hidden="true" />
    </EmptyMedia>
    <EmptyTitle>这个筛选下没有推文</EmptyTitle>
    <EmptyDescription>清除日期范围可以查看全部推文。</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button variant="secondary">清除筛选</Button>
  </EmptyContent>
</Empty>
```

| 场景 | 标题 | 说明 | 动作 |
| --- | --- | --- | --- |
| 用户没有推文 | 还没有归档推文 | 这个账号的推文还没有同步进来 | 查看其他用户 |
| 筛选无结果 | 这个筛选下没有推文 | 清除筛选可以查看全部推文 | 清除筛选 |
| 搜索无结果 | 没有找到「关键词」 | 减少限定词或换一个关键词更容易命中 | 清除搜索 |
| 日期范围无结果 | 这段时间没有推文 | 扩大日期范围可以查看更多内容 | 重置日期 |
| 媒体为空 | 没有图片或视频 | 这个账号的媒体推文还没有归档 | 返回时间线 |

- 文案写事实，不写道歉与抒情句。
- 空状态与数据状态对应：无数据引导换用户，筛选无结果提供清除。
- 紧凑区域可省略 `EmptyMedia`，保留标题、说明与一个动作。
- 空状态不摆假数据、占位卡片或灰色骨架。

## 2. 加载

| 场景 | 形态 |
| --- | --- |
| 列表首屏 | 多行 `Skeleton`，数量接近可见行数 |
| 网格首屏 | 图块形状的 `Skeleton` |
| 翻页 / 续载 | 尾部 `Spinner` +「正在加载更多…」 |
| 按钮动作 | `<Button loading>`，保留按钮宽度 |
| 路由切换 | `root.tsx` 的 `ProgressBar` |
| 超过 1 秒的任务 | `Progress` 或进度文字 |
| 图标加载 | 行内小 `Spinner`，不改变布局 |

```tsx
// 首屏骨架
<div className="space-y-3">
  {Array.from({ length: 6 }, (_, index) => (
    <Skeleton key={index} className="h-16 w-full" />
  ))}
</div>

// 按钮加载
<Button loading>保存中</Button>
```

- 骨架数量接近首屏可见数量，减少加载后的跳动。
- 长任务显示已处理数量与总量，例如「已处理 1,204 / 3,000」。
- 不要让整个页面只剩一个居中 Spinner；保留页面标题与工具栏，内容区单独显示加载态。
- 加载超过 1 秒时给文字说明；超过 5 秒时提供取消或重试入口。

## 3. 错误

错误分三层：

| 层级 | 位置 | 组件 |
| --- | --- | --- |
| 路由级 | 整个页面 | 路由模块导出 `ErrorBoundary` / `root.tsx` 的 `ErrorBoundary` |
| 区块级 | 内容区顶部或区块内 | `FeedStatus`（列表）/ `Alert variant="error"` |
| 字段级 | 表单字段下方 | `FieldError` |

```tsx
<Alert variant="error">
  <AlertCircleIcon aria-hidden="true" />
  <AlertTitle>加载失败</AlertTitle>
  <AlertDescription>
    网络请求没有完成。检查网络后重试。
    <Button variant="link" onClick={retry}>重试</Button>
  </AlertDescription>
</Alert>
```

- 界面展示「发生了什么 + 下一步」；堆栈、错误码、响应体只进日志。
- 错误尽量行内展示，保留页面其它部分可用。
- 已加载的内容在重试期间继续保留，不用空白替换。
- 不把 `0` 当作加载失败或空值；失败显示失败，空显示空。
- 错误文案给可执行动作：重试、检查网络、返回列表、换个用户。

`FeedStatus` 的接口：

```tsx
<FeedStatus
  status={status}
  hasItems={tweets.length > 0}
  onRetry={retry}
  emptyTitle="还没有归档推文"
  emptyDescription="换一个用户或清除筛选后再试。"
/>
```

## 4. 浮层

| 形态 | 用途 | 组件 |
| --- | --- | --- |
| `Dialog` | 需要集中注意的任务、详情、预览 | `Dialog` + `DialogPopup`（别名 `DialogContent`） |
| `AlertDialog` | 不可逆或高风险确认 | `AlertDialog` + `AlertDialogPopup` |
| `Sheet` | 自包含任务、筛选、媒体查看器 | `Sheet` + `SheetContent`（默认右侧） |
| `Drawer` | 移动端底部面板、手势关闭 | `Drawer` + `DrawerPopup`（`position="bottom"`） |
| `Popover` | 轻量筛选、日期、补充信息 | `Popover` |
| `DropdownMenu` | 低频动作、溢出菜单 | `DropdownMenu` |
| `ContextMenu` | 行或卡片的右键动作 | `ContextMenu` |

- `Dialog` / `AlertDialog` 默认在移动端贴底（`bottomStickOnMobile`），需要居中时传 `bottomStickOnMobile={false}`。
- `Sheet` 默认从右侧进入；窄屏可改为 `side="bottom"`。它不会按宽度自动切换。
- 同一任务只开一层浮层；需要二段确认时用 `AlertDialog`。
- 浮层关闭后焦点回到触发按钮。
- 浮层内保留清晰的标题、说明与关闭方式；不要只靠 `Esc`。
- 媒体灯箱由 `GlobalMediaViewer` 统一管理，不要在页面里再开一个媒体 Dialog。

## 5. 成功与提示

- 一次性完成反馈用 Toast：`toastManager.add({ title: '已复制链接', type: 'success' })`。
- 需要持续可见的状态用行内 `Alert`、`Badge` 或状态文字，不用 Toast。
- 一次性说明放在操作位置附近，并随操作消失。
- 提示文案包含数量与单位：「已导出 1,204 条」。
- 同一事件不重复提示；页面已有状态时不再叠一条 Toast。

`ToastProvider` / `AnchoredToastProvider` 已在 `root.tsx` 全局挂载，页面直接使用 manager 即可。

## 6. 文案规则

- 按钮与标签使用动词或名词短语：`清除筛选`、`查看媒体`、`复制链接`。
- 数字带单位：`1,891 条`、`29,010 项`。
- 时间写清时区或格式；相对时间只在 7 天内使用。
- 一个数字只配一条说明。
- 空状态、错误、确认文案按 [writing-style.md](../engineering/writing-style.md) 执行。
- 不写「暂无数据」「出错了」了事；补充原因与下一步。

## 7. 状态矩阵

新增页面前先填这张表，缺一列就说明状态没有设计完。

| 界面 | 加载中 | 空 | 失败 | 成功 |
| --- | --- | --- | --- | --- |
| 时间线 | 推文骨架 | 空状态 + 清除筛选 | `FeedStatus` + 重试 | 列表 + 底部加载 |
| 媒体网格 | 图块骨架 | 空状态 + 返回时间线 | `FeedStatus` + 重试 | 网格 + 灯箱 |
| 搜索 | 结果骨架 | 「没有找到」+ 清除 | `FeedStatus` + 重试 | 结果 + 计数 |
| 那年今日 | 分组骨架 | 「今年没有这天」 | `FeedStatus` + 重试 | 年份分组 |
| 首页 | 数字骨架 | 引导选择用户 | 区块 `Alert` + 重试 | 用户入口 + 最近浏览 |
