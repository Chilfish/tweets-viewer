# 通用组件设计规范（General Components）

> **原则：** 所有基础 UI 元素优先使用 `~/components/ui/` 下的 coss-ui 组件。不要手写裸 `<div>` 或 `<button>` 来模拟已有组件。
>
> **coss-ui 基础：** 基于 Base UI（无头无障碍原语） + Tailwind CSS + CVA（变体管理）。组件已内置可访问性、Focus 管理和默认样式。
>
> **参考文档：** https://coss.com/ui/llms.txt

---

## 0. 全局规则

### 0.1 导入路径

所有 UI 组件从 `~/components/ui/<name>` 导入。不要从 node_modules 直接导入。

```tsx
// ✅ 正确
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { InputGroup, InputGroupAddon } from '~/components/ui/input-group'

// ❌ 错误
import { Button } from '@/components/ui/button' // 不要用 @/
import { Input } from '../components/ui/input' // 不要用相对路径
```

### 0.2 类名工具

使用 `cn()` 合并类名（封装了 `clsx` + `tailwind-merge`）：

```tsx
import { cn } from '~/lib/utils'

<div className={cn('base-class', condition && 'conditional-class', className)} />
```

### 0.3 不要在 coss-ui 组件外层擅自添加 padding

Base UI 组件已处理好整体结构。额外的 padding 会破坏组件内部的对齐。

---

## 1. 按钮（Button）

导入路径：`~/components/ui/button`

### 1.1 Variant 使用指南

| Variant | 类名绑定 | 使用场景 |
| --- | --- | --- |
| `default` | `bg-primary text-primary-foreground` + 阴影 | 页面唯一的首要操作（确认、跳转、重试） |
| `secondary` | `bg-secondary text-secondary-foreground` | 次要操作（取消、返回、重置） |
| `outline` | `border-input bg-popover text-foreground` | 带边框的中性操作（导出、预览） |
| `ghost` | `border-transparent hover:bg-accent` | 工具栏图标按钮、行内操作 |
| `destructive` | `bg-destructive text-white` | 不可逆的危险操作（删除、清空） |
| `link` | `underline-offset-4 hover:underline` | 文字链接式按钮 |
| `destructive-outline` | 边框 + 红色文字 | 次要危险操作 |

### 1.2 Size 使用指南

| Size | 高度 | 使用场景 |
| --- | --- | --- |
| `xs` | `h-7`（`sm` 以上 `h-6`） | 紧凑表格内、批量操作栏 |
| `sm` | `h-8`（`sm` 以上 `h-7`） | 工具栏、卡片 footer |
| `default` | `h-9`（`sm` 以上 `h-8`） | **最常用**，表单提交、对话框确认 |
| `lg` | `h-10`（`sm` 以上 `h-9`） | 大卡片 CTA |
| `xl` | `h-11`（`sm` 以上 `h-10`） | 登录页、落地页主按钮 |
| `icon` / `icon-sm` / `icon-lg` / `icon-xl` / `icon-xs` | `size-9` ~ `size-6` | 纯图标按钮 |

触屏设备的点击区域由组件的 `pointer-coarse` 样式补到 44×44px，不需要在页面里重复加 padding。

### 1.3 交互增强

```tsx
// ✅ 标准按钮
<Button variant="default">查看推文</Button>
<Button variant="ghost" size="icon-sm" aria-label="设置"><SettingsIcon /></Button>

// ✅ 加载态（保留按钮宽度）
<Button loading>加载中</Button>

// ✅ 链接式导航：用 render 交给 <a> / <Link>
<Button render={<Link to="/tweets/alice" />}>alice</Button>

// ✅ 移动端按压反馈（组件已内置，无需手写）
// ❌ 禁止：手动拼凑按钮样式
<button className="bg-blue-500 text-white rounded px-4 py-2">确认</button>
```

---

## 2. 输入框（Input）

导入路径：`~/components/ui/input`

### 2.1 标准用法

```tsx
import { Input } from '~/components/ui/input'

<Input
  placeholder="搜索关键词"
  size="default" // 可选: "sm" | "default" | "lg"
/>

// 禁用态
<Input disabled placeholder="不可编辑" />
```

### 2.2 InputGroup（带图标/标签）

**必须使用 InputGroup**，禁止手动 absolute 定位图标：

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/components/ui/input-group'
import { SearchIcon } from 'lucide-react'

// ✅ 带前缀图标
<InputGroup>
  <InputGroupAddon align="inline-start">
    <SearchIcon className="size-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="搜索..." />
</InputGroup>

// ❌ 禁止
<div className="relative">
  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2" />
  <Input className="pl-8" />
</div>
```

**规则：**

- 图标使用 `size-4`（16px）
- 图标颜色：`text-muted-foreground`
- `InputGroupAddon` 的 `align` 可选 `"inline-start"`、`"inline-end"`、`"block-start"`、`"block-end"`；头部图标用 `inline-start`，尾部按钮用 `inline-end`
- 图标按钮放进 `inline-end` 时，`InputGroupAddon` 会自动处理点击穿透

### 2.3 行内无边框 Input

需要行内编辑（如工具栏内联输入）时，再覆盖 Input 样式：

```tsx
<Input
  className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
  defaultValue="alice"
/>
```

---

## 3. 卡片（Card）

导入路径：`~/components/ui/card`

### 3.1 使用规则

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文字</CardDescription>
  </CardHeader>
  <CardContent>{/* 主要内容 */}</CardContent>
  <CardFooter>
    <Button variant="outline">取消</Button>
    <Button>确认</Button>
  </CardFooter>
</Card>
```

### 3.2 禁止事项

- **禁止在 `Frame` / `FramePanel` 内再嵌套 Card** — 分组直接使用 `FramePanel`
- **禁止在 `CardPanel`（别名 `CardContent`）内再嵌套独立 Card** — 如需分区，使用 `Frame`、分隔线或多 Card 并列
- **同质记录不使用 Card** — 列表或表格更容易扫读与比较
- **推文 / IG 帖子已经是卡片形态** — 不要再给每条内容外包一层 Card

---

## 4. 浮层（Overlays）

### 4.1 Dialog（模态框）

导入路径：`~/components/ui/dialog`

```tsx
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from '~/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogPopup>
    <DialogHeader>
      <DialogTitle>查看原图</DialogTitle>
      <DialogDescription>图片会以原始分辨率打开。</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
  </DialogPopup>
</Dialog>
```

**特性：**

- `DialogPopup` 也以 `DialogContent` 导出，两种名字等价
- 默认已含 `backdrop-blur-sm` 背景模糊与进出动画
- `bottomStickOnMobile` 默认为 `true`，移动端贴底；需要居中时显式传 `false`
- 删除、取消等不可逆操作使用 `AlertDialog`，不要用普通 Dialog

### 4.2 Drawer / Sheet（侧边或底部面板）

导入路径：`~/components/ui/drawer` 或 `~/components/ui/sheet`

- **`Drawer`** 支持 `position="bottom" | "top" | "left" | "right"`，默认 `bottom`，支持手势关闭；`showBar` 显示顶部拖拽条。
- **`Sheet`** 支持 `side="right" | "left" | "top" | "bottom"`，默认从右侧进入；需要底部面板时显式传 `side="bottom"`。
- 两者都不会按视口宽度自动切换形态。窄屏用底部、宽屏用侧边时，由页面根据 `useIsMobile()` 选择，或统一使用 `Dialog` 的 `bottomStickOnMobile`。
- 媒体查看器使用 `Sheet` / 全局 `GlobalMediaViewer`，不要在页面里另开媒体浮层。

### 4.3 Toast（通知）

导入路径：`~/components/ui/toast`

应用已在 `root.tsx` 中全局挂载 `<ToastProvider>` 和 `<AnchoredToastProvider>`。组件内使用 `toastManager.add()`，锚定元素使用 `anchoredToastManager`。

```tsx
import { toastManager } from '~/components/ui/toast'

toastManager.add({ title: '已复制链接', type: 'success' })
```

- **位置：** `ToastProvider` 默认 `bottom-right`；需要其它位置时在 `root.tsx` 传 `position`，不要在每个页面单独配置。
- **类型：** `success` / `error` / `info` / `warning` / `loading`，图标与颜色由组件处理。
- **样式：** 组件内置 `bg-popover`、边框、阴影与圆角，不要覆盖成一次性颜色。
- 持续可见的状态用 `Alert` 或 `Badge`，不要用 Toast 代替状态展示。

---

## 5. 图标（Icons）

### 5.1 规则

- **库：** `lucide-react`
- **默认大小：** `size-4`（16px）
- **按钮内图标：** 由 `Button` 按 `size` 适配；默认移动端 `size-4.5`、`sm` 以上 `size-4`
- **极小图标：** `size-3.5`（14px）元数据/辅助文字
- **颜色：**
  - 默认跟随文字（`currentColor`，无需额外设置）
  - 辅助图标：`text-muted-foreground`
  - **禁止** 使用纯黑 `#000` 或纯白 `#fff`

```tsx
// ✅ 正确
<SearchIcon className="size-4 text-muted-foreground" />
<SettingsIcon className="size-5" /> // 继承父级文字颜色

// ❌ 错误
<SearchIcon className="size-4 text-black dark:text-white" />
```

装饰图标标 `aria-hidden="true"`；独立图标按钮提供 `aria-label`。

---

## 6. 工具函数与 Hook

### 6.1 cn() — 类名合并

```tsx
import { cn } from '~/lib/utils'

<div className={cn(
  'base-style',
  variant === 'primary' && 'text-primary',
  className,
)} />
```

### 6.2 响应式检测

项目**没有** `useMediaQuery` 通用 hook（勿引用 `~/hooks/use-media-query`，不存在）。移动端判断使用：

```tsx
import { useIsMobile } from '~/hooks/use-mobile'

const isMobile = useIsMobile() // < 768px
```

- `useIsMobile` 基于 `window.innerWidth < 768`，客户端首帧为 `false`，水合后校准
- 桌面端布局（`md:` 及以上）不需要额外检测，Tailwind 断点类即可
- 触摸设备判断（`pointer: coarse`）：用 Tailwind 变体 `pointer-coarse:`（如按钮触控目标），无需 JS

### 6.3 客户端就绪与主题

```tsx
import { useHydrated } from '~/hooks/use-hydrated'
import { useTheme } from '~/hooks/use-theme'

const hydrated = useHydrated() // 首帧 false，水合后 true
```

- 渲染期间不读 `window` / `localStorage` / `matchMedia`
- 主题由 `useTheme()` 在客户端同步 `.dark` 类；`root.tsx` 的内联脚本负责首屏防闪烁

---

## 7. 常见错误速查（Anti-Patterns）

| 错误 | 正确做法 |
| --- | --- |
| `<button className="bg-blue-500 text-white rounded px-4 py-2">` | `<Button>` |
| `<div className="absolute left-2 top-1/2"><Icon /></div>` | `<InputGroup><InputGroupAddon><Icon /></InputGroupAddon></InputGroup>` |
| `<div className="bg-white rounded-xl shadow p-6">` | `<Card><CardContent>...</CardContent></Card>` |
| `className="border-b border-gray-200"` 在设置列表 | `Frame` + `FramePanel` 分组，行间用 `Separator` 或 `border-border` |
| `text-black dark:text-white` | `text-foreground` |
| `bg-white dark:bg-gray-900` | `bg-background` 或 `bg-card` |
| `<hr />` 分割两个区域 | `<Separator />` 来自 `~/components/ui/separator` |
| 导入 `@/components/ui/button` | 导入 `~/components/ui/button` |
| 引用 `~/hooks/use-media-query` | 使用 `~/hooks/use-mobile` 的 `useIsMobile()` |
| 手写列表加载 / 空 / 失败三态 | 使用 `~/components/feed-status.tsx` 的 `FeedStatus` |
| 窄屏把媒体网格压到一字一列 | 保持图块比例，必要时减少列数，见 [patterns.md §4](../patterns.md#4-行与卡片) |
| 同一数字在标题、读数与脚注里各写一遍 | 只保留层级最高的一处，见 [information-density.md](../information-density.md) |
