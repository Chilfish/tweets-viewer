# UI 设计系统

> 本目录是界面规范的入口：设计 Token、页面结构、三态反馈、交互规则与取舍依据。
> 适用范围：`apps/web-react/app/` 下的页面、组件与样式。新增页面或组件前先读本页，再按下表进入对应文档。

## 1. 文档地图

| 文档 | 内容 | 何时读 |
| --- | --- | --- |
| [OVERVIEW.md](./OVERVIEW.md) | 设计目标、强制规则、颜色/排版/间距/反馈速查 | 第一次写 UI，或需要整体约束 |
| [visual.md](./visual.md) | 颜色、字体、间距、圆角、阴影、动效、组件映射 | 写样式、定 Token、评审视觉 |
| [components/GENERAL.md](./components/GENERAL.md) | Button、Input、Card、Dialog 等原子组件的用法与反例 | 使用 `~/components/ui/` 组件 |
| [patterns.md](./patterns.md) | 信息预算、页面骨架、页面类型、工具栏、列表、响应式、检查清单 | 新增页面、拆组件 |
| [information-density.md](./information-density.md) | 一屏一个焦点、冗余信号、生成后的删除清单与验收方法 | 页面写完、审查 UI、发现信息重复 |
| [feedback.md](./feedback.md) | 空、加载、错误、浮层、Toast 与提示文案 | 接数据、写状态与提示 |
| [interaction.md](./interaction.md) | 键盘、导航、URL 状态、持久化、SPA 边界与触摸 | 写交互与状态 |
| [research.md](./research.md) | 规范与研究来源、正反例、采纳取舍 | 评审规则或引入新做法 |

本目录只放可复用的规范，不记录具体页面的实现进度、截图或按日期的改造日志。页面进度写进
[docs/planning/backlog.md](../planning/backlog.md)，实现记录写进
[docs/development-log/](../development-log/)。

## 2. 设计立场

1. **先给答案**：首屏先说明当前状态与下一步，明细放进二级区域。
2. **层级来自取舍**：每个视图保留一个主操作和一组主数字，其余动作降级。
3. **表面从简**：页面用留白与分隔线分组；卡片只承载独立对象，卡片内不再套卡片。
4. **Token 是颜色来源**：颜色与圆角来自 `app/app.css`；组件里不写一次性 hex 或 `rgb()`。遮罩与阴影使用 `black` / `white` 透明度是有限例外。
5. **移动端优先**：先写基础布局，再用 `sm:` / `md:` / `lg:` 增强；触控目标不小于 44px。
6. **原语优先**：交互使用 `~/components/ui/` 的 coss / Base UI 组件，Tailwind 负责布局。
7. **状态如实**：加载、空、失败各自成态；`0` 只在真实为零时出现。
8. **文档即事实**：路径、组件名、Token 以当前代码为准；改代码时同步改文档。

## 3. AI 生成 UI 前自检

- [ ] 先查 `~/components/ui/` 是否已有组件，再写新结构。
- [ ] 颜色只用 Token：`bg-background`、`text-muted-foreground`、`border-input`；没有 `#fff` 或 `bg-[#...]`。
- [ ] 浅色与深色同时成立；不在组件里用 `dark:` 覆盖颜色。
- [ ] 交互元素有 hover（指针设备）、active（触屏）与 `focus-visible` 状态。
- [ ] 数据路径覆盖 loading / empty / error。
- [ ] 内部导航用 `<Link>`，状态写 URL，读 URL 用 `useSearchParams`。
- [ ] 类名用 `cn()` 合并，不手工拼接条件字符串。
- [ ] 图标按钮有 `aria-label`，装饰图标标 `aria-hidden`。
- [ ] 同一数字、名称、状态只出现一次；没有口径脚注（见 [information-density.md](./information-density.md)）。
- [ ] 新路由写进 `app/routes.ts`，并跑 `bun run typecheck`。

## 4. 当前约定

| 项 | 结论 |
| --- | --- |
| 技术栈 | React 19 + React Router v8（SPA-first + 静态壳）+ Tailwind CSS v4 + coss / Base UI |
| 渲染 | 路由使用 `clientLoader`；动态内容客户端渲染，不承诺首屏 SSR 内容（ADR-010） |
| 主题 | `.dark` 类 + CSS 变量；浅色 / 深色 / 跟随系统由 `useTheme` + Zustand persist 持久化 |
| 字体 | 系统字体栈（SF Pro / Segoe / PingFang / Noto Sans SC）；日文文本追加 `Noto Sans JP` |
| 主色 | `oklch(0.59 0.14 242)`（Twitter/X 蓝系） |
| 圆角基准 | `--radius: 0.625rem`（10px） |
| 断点 | Tailwind 默认断点；`useIsMobile()` 按 `<768px` 计算 |
| 布局 | 移动端单列 + 底栏；`md` 以上左侧栏 + 主列，列表页主列上限 600px / 宽视图 6xl |
| 反馈 | `FeedStatus`（列表四态）/ `Empty` / `Skeleton` / `Spinner` / `Alert` / `toastManager` |
| 浮层 | `Dialog` / `AlertDialog` / `Sheet` / `Drawer` / `Popover` / `DropdownMenu` |

## 5. 维护

- 新增、移动或删除文档时同步更新本页与 [docs/INDEX.md](../INDEX.md)。
- 规则变化先改文档，再改代码；本目录不保留一次性的页面方案与改造记录。
- 评审按 [research.md §5](./research.md#5-评审方法) 的检查顺序执行。
