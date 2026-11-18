# UI 设计系统：总览与强制规范

> **目标：** 桌面端像 macOS 应用，移动端像 iOS PWA，切换时不要有明显割裂。
>
> **适用范围：** `apps/web-react/app/` 下所有 UI 组件、页面、交互。写 UI 代码时逐条遵守。
>
> 具体数值见 [visual.md](./visual.md)，组件用法见 [components/GENERAL.md](./components/GENERAL.md)，页面结构见 [patterns.md](./patterns.md)。

---

## 0. 写 UI 代码前的检查清单

- [ ] 优先检查 `~/components/ui/` 下是否已有现成组件，不要重复造轮子
- [ ] 所有颜色来自 CSS 变量（`bg-background`、`text-muted-foreground` 等），禁止硬编码颜色
- [ ] 所有组件同时考虑浅色/深色模式（项目使用 `.dark` 类切换）
- [ ] 交互元素同时处理桌面（hover）和移动端（active/press）状态
- [ ] 使用 `cn()` 工具函数合并类名，不要直接拼接字符串
- [ ] 列表页覆盖加载 / 空 / 失败三态（优先复用 `FeedStatus`）

---

## 1. 设计原则

### 1.1 原生感

> **目标不是"看起来像个好看的网页"，而是"感觉像个原生应用"。**

- **桌面端** → 遵循 macOS Human Interface Guidelines（HIG）：精确鼠标交互、紧凑布局、内容优先
- **移动端** → 遵循 iOS HIG：大触控区（≥44px）、手势操作、底部抽屉（Bottom Sheets）
- **不可见设计**：设计服务于内容。通过克制的阴影、模糊和动效引导用户，不喧宾夺主
- **页面切换**：路由级淡入淡出交给 View Transitions / layout 的进入动画，不在页面里再叠一层

### 1.2 必须遵守的规则

| 规则 | 说明 |
| --- | --- |
| **禁止自定义颜色** | 使用项目 CSS 变量定义的 Token，禁止 `bg-[#xxx]` 或 `text-[#xxx]` |
| **深色模式必须支持** | 所有组件必须兼容 `.dark` 类，禁止只写浅色不写深色 |
| **组件优先** | 优先复用 `~/components/ui/` 下的组件，不要手写 div 模拟 |
| **移动端覆盖** | 每个交互组件必须检查移动端（`<768px`）的表现，触控目标 ≥44px |
| **状态如实** | 加载、空、失败各自成态，不用 `0` 或假数据冒充结果 |
| **URL 驱动** | 会改变结果集的筛选、搜索、排序、分页写入 URL，不放进组件状态 |

### 1.3 设计立场

1. **先回答，再陈列**：首屏先给当前状态与下一步，明细进二级区域。
2. **层级来自取舍**：一个视图一个主操作、一组主数字，其余动作降级。
3. **表面从简**：留白与分隔线优先；卡片只承载独立对象，卡片内不再套卡片。
4. **颜色有上限**：一个主色、一组中性色、三个语义色；语义色只表达状态。
5. **字体建立节奏**：字号档位之间至少差 2px，用字重和颜色区分层级。
6. **动效解释变化**：进入淡入 + 轻微位移，退出反向；循环动画只用于加载。

---

## 2. 颜色系统（Color System）

### 2.1 Token 速查表

所有颜色通过 Tailwind CSS v4 的 `@theme inline` 映射为 `color-*` Token，定义在 `app/app.css`。浅色在 `:root`，深色在 `.dark`。

| Token | 用途 | 说明 |
| --- | --- | --- |
| `background` | 页面最底层背景 | 浅色 `#f5f9fb`，深色 `oklch(0.145 0 0)` |
| `foreground` | 页面正文文字 | 最高对比度，用于标题和正文 |
| `card` / `card-foreground` | 卡片/容器背景与文字 | 与页面背景明确区分 |
| `popover` / `popover-foreground` | 浮层、菜单、弹出框 | |
| `primary` / `primary-foreground` | 主操作、激活态、焦点环 | 浅色 `oklch(0.59 0.14 242)`，深色 `oklch(0.68 0.15 237)` |
| `secondary` / `secondary-foreground` | 次要按钮/区域 | |
| `muted` / `muted-foreground` | 低强调背景 / 辅助文字 | 骨架屏、描述、占位符、图标色 |
| `accent` / `accent-foreground` | hover、选中高亮 | |
| `destructive` / `destructive-foreground` | 危险操作、错误 | |
| `border` | 边框线 | 卡片边框、分割线 |
| `input` | 输入框边框 | 表单控件边框 |
| `ring` | Focus 环 | 聚焦态外发光 |
| `info` / `success` / `warning` | 状态色 | 均带 `-foreground` 变体 |
| `sidebar-*` | 左侧栏专用 | 见 `app.css` |
| `chart-1` … `chart-5` | 图表分类色 | 新增图表时使用 |

### 2.2 使用规则

```tsx
// ✅ 正确：语义 Token
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">辅助说明</p>
  <Button>确认</Button>
</div>

// ❌ 错误：硬编码颜色
<div className="bg-white text-black">
  <p className="text-gray-500">辅助说明</p>
  <button className="bg-blue-500 text-white">确认</button>
</div>

// ❌ 错误：只写浅色
<div className="bg-white">...</div>
```

- 浅色与深色由 `.dark` 下的变量切换，组件里不写 `dark:` 覆盖颜色。
- 状态同时用文字或图标表达，颜色只作辅助。
- 图表使用 `chart-*`，不要从品牌色临时派生。

### 2.3 深色模式

- 切换通过 `<html>` 上的 `.dark` 类控制；首屏主题由 `root.tsx` 的内联脚本在绘制前恢复，避免闪烁
- 主题状态由 `useTheme()` + Zustand persist 管理，存储键为 `tweets-viewer-app-storage`
- 不在组件中写 `dark:` 前缀覆盖颜色 — CSS 变量已自动完成切换

---

## 3. 排版系统（Typography）

### 3.1 字体栈

```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
'Noto Sans SC', sans-serif
```

通过 `font-sans` 使用。`--font-sans` 只在 `app.css` 的 `:root` 定义一份，`@theme inline` 里以 `var(--font-sans)` 映射；`--font-heading` 直接复用同一栈。日文推文通过 `p.tweet-body[lang='ja']` 追加 `Noto Sans JP`。

**只在这里定义**：组件 CSS 引用同一变量，禁止再手写字体栈。

### 3.2 层级体系

| 层级 | Tailwind 类名 | 用途 |
| --- | --- | --- |
| 页面标题 | `text-2xl font-bold` | 页面主标题 |
| 区块标题 | `text-lg font-semibold` | Section 标题 |
| 卡片标题 | `text-base font-medium` | Card/Frame 标题 |
| 正文 | `text-sm` | 默认正文 |
| 辅助文字 | `text-xs text-muted-foreground` | 描述、时间戳 |
| 微文字 | `text-[0.6875rem] text-muted-foreground` | 极小的元数据 |

**重要：** 通过字重（`font-medium`、`font-semibold`）和颜色（`text-muted-foreground`）区分层级，而非仅靠字号变化。数字、时间使用 `tabular-nums`。

---

## 4. 间距与圆角系统（Spacing & Radius）

### 4.1 间距

基准单位 **4px**（Tailwind 的 `1` = 0.25rem = 4px）。

| Tailwind 值 | 实际像素 | 使用场景 |
| --- | --- | --- |
| `1` | 4px | 图标与文字间隙 |
| `2` | 8px | 列表项内边距、标签间 |
| `3` | 12px | 控件内边距、紧凑区块 |
| `4` | 16px | 卡片内边距、内容区 |
| `6` | 24px | Section 间距 |
| `8` | 32px | 页面大区块 |
| `12` | 48px | 空状态、页面顶部留白 |

### 4.2 圆角

基于 `--radius` CSS 变量（默认 `0.625rem` = 10px）。

| Token | Tailwind 类名 | 使用场景 |
| --- | --- | --- |
| `--radius-sm` | `rounded-sm` | 小徽章、骨架屏 |
| `--radius-md` | `rounded-md` | 紧凑按钮、菜单项 |
| `--radius-lg` | `rounded-lg` | 默认按钮、输入框、Toast |
| `--radius-xl` | `rounded-xl` | 卡片、模态框 |
| `--radius-2xl` | `rounded-2xl` | 大面板、Dialog、Card |
| `rounded-full` | 全圆 | 头像、进度条、开关 |

- 圆角保持同心：外层圆角约等于内层圆角加内边距。
- 不为单个页面发明一次性圆角。

---

## 5. 交互反馈

### 5.1 反馈类型

| 状态 | 桌面端 | 移动端 |
| --- | --- | --- |
| **Hover** | `hover:bg-accent/50` 或 `hover:bg-muted/50` | 不适用（移动端无 hover） |
| **Press/Active** | `active:scale-[0.98]`（可选） | `active:scale-95`（按钮组件已内置） |
| **Focus** | `focus-visible:ring-2 focus-visible:ring-ring` | 同桌面 |
| **Disabled** | `opacity-50 pointer-events-none` | 同桌面 |

### 5.2 动画预设

| 名称 | 缓动函数 | 时长 | 使用场景 |
| --- | --- | --- | --- |
| **快速反馈** | `ease-out` | 150ms | hover 颜色变化、Focus 环 |
| **标准过渡** | `--ease-apple` | 200–250ms | 展开/折叠、淡入淡出 |
| **Spring 弹性** | `--ease-spring` | 300–350ms | 抽屉弹出、模态框出现 |
| **骨架屏** | `animate-skeleton` | 2s 循环 | Skeleton 加载占位 |

```tsx
// ✅ 标准过渡写法
<div className="transition-colors duration-200 ease-out hover:bg-accent/50" />

// ✅ 弹性动画（抽屉/弹窗）
<div className="transition-transform duration-300 ease-[var(--ease-spring)]" />

// ❌ 避免：500ms 的全局过渡会让交互显得迟缓
```

- 自定义动效控制在 150–350ms。
- `prefers-reduced-motion: reduce` 时保留淡入，去掉位移与缩放（全局已在 `app.css` 降级）。

### 5.3 防误触

- 所有可点击元素必须有 `cursor-pointer`（Button 已内置）。
- 输入框、按钮统一去除 WebKit tap 高亮（`app.css` 全局设置）。
- 触控目标不小于 44×44px；Button / Badge 已用 `pointer-coarse` 补足。

---

## 6. 响应式断点（Responsive Breakpoints）

使用 Tailwind 默认断点：

| 断点 | 宽度 | 目标设备 |
| --- | --- | --- |
| 无前缀 | 0px+ | 移动端优先基础样式 |
| `sm` | ≥640px | 大屏手机/小平板 |
| `md` | ≥768px | 平板 |
| `lg` | ≥1024px | 小桌面 |
| `xl` | ≥1280px | 桌面 |
| `2xl` | ≥1536px | 大桌面 |

**原则：** 移动端优先。先写移动端样式，再用 `sm:` / `md:` / `lg:` 逐步增强。需要 JS 判断时只用 `useIsMobile()`（`<768px`），不要引入第二份媒体查询实现。

---

## 7. 组件文件索引

所有 UI 组件位于 `~/components/ui/`（即 `apps/web-react/app/components/ui/`）。完整清单以目录为准；下面是按用途的分类。

### 布局与导航

- `tabs.tsx` — 标签页（default / underline 变体，支持 `size`）
- `segmented-control.tsx` — 分段控件（2–4 项互斥切换）
- `breadcrumb.tsx` — 面包屑
- `toolbar.tsx` — 工具条容器
- `scroll-area.tsx` — 自定义滚动条
- `separator.tsx` — 分割线
- `sidebar.tsx` — 未提供；本项目的左侧栏是 `~/components/layout/sidebar.tsx`

### 表单与输入

- `button.tsx` — 按钮（7 种 variant、10 种 size、`loading`）
- `input.tsx` / `textarea.tsx` — 输入框 / 文本域
- `input-group.tsx` — 带前缀/后缀的输入组
- `field.tsx` / `fieldset.tsx` / `label.tsx` — 表单结构与标签
- `checkbox.tsx` / `checkbox-group.tsx` / `switch.tsx` / `radio-group.tsx` — 选择控件
- `select.tsx` — 下拉选择
- `toggle.tsx` / `toggle-group.tsx` — 开关式切换
- `calendar.tsx` — 日期选择器（基于 `@daypicker/react`）

### 浮层与反馈

- `sheet.tsx` — 侧面板（移动端底部抽屉）
- `dialog.tsx` / `alert-dialog.tsx` — 模态框 / 危险确认
- `drawer.tsx` — 可手势关闭的抽屉
- `dropdown-menu.tsx` / `context-menu.tsx` / `menu.tsx` — 菜单
- `popover.tsx` / `preview-card.tsx` — 弹出内容
- `tooltip.tsx` / `kbd.tsx` — 提示与快捷键
- `alert.tsx` — 行内提示
- `toast.tsx` — 全局 Toast（`ToastProvider` 已在 `root.tsx` 挂载）
- `progress.tsx` / `meter.tsx` — 进度与量度

### 数据展示

- `badge.tsx` — 徽章
- `avatar.tsx` — 头像（含 `AvatarGroup`）
- `card.tsx` — 卡片
- `frame.tsx` / `group.tsx` — 分组面板
- `table.tsx` / `pagination.tsx` — 表格与分页
- `skeleton.tsx` / `spinner.tsx` / `empty.tsx` — 骨架 / 加载 / 空态

### 媒体与折叠

- `media.tsx` — 媒体加载状态（本项目自定义 API，见文件内注释）
- `accordion.tsx` / `collapsible.tsx` — 折叠

> **具体组件的使用规范请参考：[components/GENERAL.md](./components/GENERAL.md)**
