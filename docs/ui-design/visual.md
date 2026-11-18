# 视觉：颜色、字体、间距与动效

> 本页定义可复用的视觉规则，值来自 [`app/app.css`](../../apps/web-react/app/app.css)。组件用法见 [components/GENERAL.md](./components/GENERAL.md)，页面结构见 [patterns.md](./patterns.md)，规则依据见 [research.md](./research.md)。

## 设计语言

**先回答，再陈列。** 打开一屏先得到当前状态与下一步，明细放在二级区域。首屏按 5 秒扫读设计。

**层级来自取舍。** 每个视图保留一个主操作与一组主数字。其余动作降为 `ghost` / `outline`，低频动作收进菜单。

**表面从简。** 页面用留白与分组标题组织；需要边界时用一条分隔线。卡片只承载独立对象，一屏保持一层 elevation，卡片内不再套卡片。明显阴影只出现在浮层。

**颜色有上限。** 一个主色、一组中性色、三个语义色。语义色只表达状态，装饰交给内容本身。界面表面使用纯色，渐变只用于推文图片遮罩等确有需要的场景。

**字体建立节奏。** 字号档位之间至少差 2px，用字重和颜色区分层级，不靠微调字号制造层次。

**动效解释变化。** 进入用淡入与轻微位移，退出反向；循环动画只用于加载。

## 1. 颜色

### 1.1 Token

所有颜色通过 Tailwind v4 的 `@theme inline` 映射为 `color-*` Token。浅色在 `:root`，深色在 `.dark`。

| Token | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `background` | `#f5f9fb` | `oklch(0.145 0 0)` | 页面最底层背景 |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | 正文与标题 |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | 卡片、面板 |
| `popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | 浮层、菜单、弹出框 |
| `primary` | `oklch(0.59 0.14 242)` | `oklch(0.68 0.15 237)` | 主操作、选中态、焦点环 |
| `primary-foreground` | `oklch(0.98 0.01 237)` | `oklch(0.29 0.06 243)` | 主色上的文字 |
| `secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | 次要按钮、次要区域 |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | 骨架屏、低强调背景 |
| `muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | 说明、占位符、辅助图标 |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.371 0 0)` | hover、选中高亮 |
| `destructive` | `oklch(0.58 0.22 27)` | `oklch(0.704 0.191 22.216)` | 删除、错误 |
| `destructive-foreground` | `red-700` | `red-400` | 危险操作文字与图标 |
| `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | 卡片边框、分隔线 |
| `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | 输入框与控件边框 |
| `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | `focus-visible` 环 |
| `info` / `success` / `warning` | `blue-500` / `emerald-500` / `amber-500` | 同左 | 状态色 |
| `sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` | 侧栏背景 |
| `chart-1` … `chart-5` | 蓝色梯度 | 蓝色梯度 | 图表分类色 |

完整值见 [`app.css`](../../apps/web-react/app/app.css)。新增颜色先加 Token，再在组件里引用；不要在组件中写一次性色值。

### 1.2 使用规则

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
- `primary` 在浅色下的正文对比有限；小字号正文优先使用 `foreground`，主色用于按钮、选中态与焦点环。
- 图表使用 `chart-*`，不要从品牌色临时派生。

## 2. 字体

| 项 | 值 |
| --- | --- |
| 正文字体 | 系统字体栈（`--font-sans`） |
| 标题字体 | 同正文（`--font-heading` 映射到 `--font-sans`） |
| 日文正文 | 在系统栈后追加 `Noto Sans JP`（`p.tweet-body[lang='ja']`） |
| 数字 | `tabular-nums`，用于统计、时间、编号 |
| 技术字段 | 暂无独立等宽字体；id / 路径优先使用 `font-mono` 回退栈 |

字体栈单一事实来源是 `app.css` 的 `:root`；组件与页面不要再手写整套字体栈。

### 2.1 字号档位

| 层级 | Tailwind | 用途 |
| --- | --- | --- |
| 页面标题 | `text-2xl font-bold` / `text-3xl` | 路由级标题 |
| 区块标题 | `text-xl font-semibold` | Section、Empty 标题 |
| 卡片标题 | `text-lg font-semibold` | CardTitle、对话框标题 |
| 强调正文 | `text-base font-medium` | 关键说明、按钮（移动端） |
| 正文 | `text-sm` | 默认正文 |
| 辅助文字 | `text-xs text-muted-foreground` | 描述、时间戳、字段说明 |
| 微文字 | `text-[0.6875rem]` | 极小的元数据 |

- 正文行高保持 1.5；长文本容器允许换行与滚动，不固定高度。
- 按钮在移动端使用 `text-base`，`sm` 以上收为 `text-sm`，这是组件内置行为。
- 数字与时间使用等宽数字。

## 3. 间距与圆角

### 3.1 间距

基准单位 4px（Tailwind `1` = 0.25rem）。

| 值 | 像素 | 使用场景 |
| --- | --- | --- |
| `1` | 4px | 图标与文字间隙 |
| `2` | 8px | 列表项内边距、标签间距 |
| `3` | 12px | 控件内边距、紧凑区块 |
| `4` | 16px | 卡片内边距、内容区 |
| `6` | 24px | 区块间距 |
| `8` | 32px | 页面大区块 |
| `12` | 48px | 页面顶部留白、空状态垂直间距 |

### 3.2 圆角

基于 `--radius: 0.625rem`（10px）。

| Token | 值 | 使用场景 |
| --- | --- | --- |
| `rounded-sm` | 6px | 小徽章、骨架屏 |
| `rounded-md` | 8px | 紧凑按钮、菜单项 |
| `rounded-lg` | 10px | 默认按钮、输入框、Toast |
| `rounded-xl` | 14px | 提示条、推文卡片、FramePanel |
| `rounded-2xl` | 18px | Card、Dialog、Sheet、Drawer |
| `rounded-3xl` | 22px | 大型容器 |
| `rounded-full` | 全圆 | 头像、进度条、开关 |

- 圆角保持同心：外层圆角约等于内层圆角加内边距。
- 媒体图块使用 `rounded-lg`；头像使用全圆。
- 不为单个页面发明一次性圆角。

## 4. 阴影与层级

| 层级 | 表达 | 使用场景 |
| --- | --- | --- |
| 页面背景 | 无阴影 | `background` |
| 区块 | 留白 + 可选 `border-b` | 页面内容分组 |
| 卡片 | `border` + 极轻阴影（组件内置） | 独立对象、推文卡片 |
| 浮层 | `shadow-lg/5` + 背景模糊 | Dialog、Sheet、菜单 |
| 拖拽层 | 浮层阴影 + 位移 | Drawer |

一屏只保留一层 elevation。卡片内不再放带阴影的卡片；需要分区时用 `Frame` / `FramePanel` 或分隔线。

## 5. 动效

| 场景 | 时长 | 缓动 |
| --- | --- | --- |
| hover / focus | 150ms | `ease-out` |
| 淡入淡出 | 200–250ms | `--ease-apple` |
| Dialog / Sheet | 200ms | `ease-in-out` |
| Drawer | 450ms | `cubic-bezier(0.32,0.72,0,1)` |
| 分段控件指示器 | 200ms | `ease-in-out` |
| 骨架屏 | 2s 循环 | `linear` |
| 路由切换 | 160–220ms | `--ease-apple` |

```tsx
// 常规过渡
<div className="transition-colors duration-200 ease-out hover:bg-accent/50" />

// 弹性只用于抽屉与分段指示器
<div className="transition-transform duration-300 ease-[var(--ease-spring)]" />
```

- 自定义动效控制在 150–350ms；超过 500ms 会让交互显得迟缓。
- `prefers-reduced-motion: reduce` 时保留淡入，去掉位移与缩放（`app.css` 已全局降级）。
- 路由切换使用文档级 View Transitions；页面内不要再叠一层同向位移。

## 6. 组件映射

| 需求 | 组件 |
| --- | --- |
| 按钮与图标按钮 | `button.tsx`：`default` / `secondary` / `outline` / `ghost` / `destructive` / `destructive-outline` / `link` |
| 输入与搜索 | `input.tsx`；带图标或前后缀用 `input-group.tsx` |
| 表单结构 | `field.tsx` / `fieldset.tsx` / `label.tsx` |
| 选择 | `select.tsx`；单项与多项选择用 `checkbox.tsx` / `checkbox-group.tsx` / `radio-group.tsx` / `switch.tsx` |
| 分段切换 | `segmented-control.tsx` / `toggle-group.tsx` / `toggle.tsx` |
| 标签页 | `tabs.tsx` |
| 卡片与面板 | `card.tsx` / `frame.tsx` / `group.tsx` |
| 数据展示 | `table.tsx` / `badge.tsx` / `avatar.tsx` / `pagination.tsx` / `progress.tsx` / `meter.tsx` |
| 空与加载 | `empty.tsx` / `skeleton.tsx` / `spinner.tsx` / `progress-bar.tsx`（全局路由进度） |
| 提示 | `alert.tsx` / `toast.tsx` / `tooltip.tsx` / `kbd.tsx` |
| 浮层 | `dialog.tsx` / `alert-dialog.tsx` / `sheet.tsx` / `drawer.tsx` |
| 菜单 | `dropdown-menu.tsx` / `context-menu.tsx` / `menu.tsx` |
| 弹出内容 | `popover.tsx` / `preview-card.tsx` |
| 滚动与折叠 | `scroll-area.tsx` / `collapsible.tsx` / `accordion.tsx` |
| 媒体 | `media.tsx`（推文 / IG 媒体加载态） |
| 列表四态 | `~/components/feed-status.tsx` |

组件导入路径统一为 `~/components/ui/<name>`。具体 API 与反例见 [components/GENERAL.md](./components/GENERAL.md)。

## 7. 常见反模式

| 症状 | 做法 |
| --- | --- |
| 紫蓝渐变、装饰性发光 | 主色 + 中性色；渐变只用于媒体遮罩等确有需要处 |
| 每张卡都有边框和阴影 | 默认无容器；用留白或一条分隔线分组 |
| 卡片里再套卡片 | 一层表面；分区用 `Frame` / `FramePanel` 或分隔线 |
| 所有区块同样权重 | 一个主操作、一组主数字，其余降级 |
| 顶部一排等权重统计卡 | 先给结论与待办；数字限制在 4 个，明细进对话框 |
| 字号只差 1–2px | 使用固定字阶，档位之间至少 2px |
| 空数据用 0 冒充 | 显示加载中、失败或空状态，并写清下一步 |
| 每屏都塞满配置 | 配置进对话框或 Sheet，页面保留摘要与入口 |
| 手写 `<div>` 模拟按钮、输入框 | 使用 `Button`、`Input`、`InputGroup` |
| 用颜色单独区分成功与失败 | 颜色 + 文字或图标 |

同一事实在多处重复、区块底部的口径脚注、`详情 →` 这类自证式导航，属于页面层的冗余，规则与删除清单见 [information-density.md](./information-density.md)。

## 8. 参考

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [NN/g: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [NN/g: Cards](https://www.nngroup.com/articles/cards-component/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [coss UI](https://coss.com/ui) / [Base UI](https://base-ui.com/)
