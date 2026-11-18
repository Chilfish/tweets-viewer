# 交互：键盘、导航、状态与渲染边界

> 本页定义本项目的交互约定。组件行为交给 coss / Base UI 原语；这里只写页面层需要统一的部分。

## 1. 键盘

- `Tab` 顺序与视觉顺序一致；不从 `display: none` 的元素进入焦点。
- `Enter` / `Space` 激活当前按钮或链接；菜单、选择器、Tabs、Dialog 的方向键与 `Esc` 由 Base UI 原语处理，不重复实现。
- `Esc` 关闭最上层浮层，焦点回到触发元素。
- 图标按钮必须有可访问名称；快捷键提示使用 `Kbd` + `Tooltip`。
- 全局快捷键集中在 `useGlobalShortcuts()`：
  - `/` 聚焦搜索框；不在搜索页时跳转到当前用户的搜索页
  - `⌘K` / `Ctrl+K` 同 `/`
  - 在 `input` / `textarea` / `select` / `contentEditable` 内不拦截
- 自定义快捷键不得覆盖浏览器与输入法的常用组合；输入框聚焦时忽略单字母快捷键。
- 列表需要键盘移动时，优先使用原语的 roving tabindex 或 `aria-activedescendant`，不要手写焦点循环。

## 2. 导航

```tsx
// 内部跳转
<Link to="/tweets/alice">alice</Link>

// 编程式跳转（需要保留 View Transition 时）
const navigate = useNavigate()
navigate(`/search/${name}?focus=search`, { viewTransition: true })

// 读 / 写 URL 参数
const [searchParams, setSearchParams] = useSearchParams()
```

- 内部导航使用 `<Link>`、`navigate()`；不使用 `<a href="/...">`、`form.submit()`、`window.location.href`。
- 外部链接与需要浏览器原生行为时才使用 `<a href>`（如图片原始地址、分享链接）。
- 路由切换的全局进度由 `root.tsx` 的 `ProgressBar` 提供。
- 路由级错误由路由模块导出的 `ErrorBoundary` 处理；不要在每个组件里重复捕获同一错误。
- 滚动位置由 `ScrollRestoration` 恢复；整页刷新时由 `useScrollPositionMemory()` 兜底恢复无限滚动偏移。
- 路由进入动画与文档级 View Transitions 二选一，由 `layout.tsx` 的 `pageTransition` handle 与 `useViewTransitionState` 协调，不要在页面里再写一套。

## 3. URL 与状态

| 状态 | 位置 | 示例 |
| --- | --- | --- |
| 分页、排序、日期范围、排除回复、搜索词 | URL search params | `?page=2&reverse=true&start=2024-01-01&q=design` |
| 当前用户 / IG 用户 | URL path | `/tweets/alice`、`/ins/alice` |
| 当前年份导航 | URL search param | `?start=2024-01-01&end=2024-12-31` |
| 主题 | `useAppStore` + localStorage | `light` / `dark` / `system` |
| 最近浏览用户 | Zustand persist | 首页「继续浏览」 |
| 媒体灯箱当前项 | 组件状态 / 全局 viewer 状态 | 不写 URL |
| 搜索框聚焦 | URL `focus=search` | 跨页跳转后自动聚焦 |

- 会改变结果集的筛选写入 URL，后退能回到上一次查询。
- 纯展示偏好不写 URL，避免链接分享时带入他人的视图习惯。
- 切换筛选时清空与旧结果绑定的选择，并回到第 1 页。
- 读写 search params 使用 `useSearchParams`；更新时保留无关参数。
- 持久化 store 改动 schema 时升 `version` 并写迁移；首屏渲染前用 `useHydrated()` 判断客户端是否就绪。

## 4. 浮层与焦点

- 同一任务只开一层浮层；需要二段确认时用 `AlertDialog`。
- 浮层关闭后焦点回到触发元素；Base UI 已处理，不要手动抢焦点。
- 嵌套浮层保持一层视觉层级；不在 Dialog 里再开 Dialog。
- 浮层打开时背景保留可辨认的上下文；不要用不透明遮罩完全盖住页面。
- 破坏性操作需要确认；普通保存不需要二次确认。
- 媒体灯箱是全局单例（`GlobalMediaViewer`），页面不要另开媒体浮层。

## 5. 渲染边界（SPA-first）

本项目是 **SPA-first + 静态壳**（ADR-010）：路由使用 `clientLoader`，不承诺首屏 SSR 内容。

- 渲染期间不读取 `window`、`document`、`localStorage`、`matchMedia`；放到 `useEffect` 或客户端钩子。
- 需要判断是否已 hydration 时使用 `useHydrated()`；需要移动端判断时使用 `useIsMobile()`。
- 主题在绘制前由 `root.tsx` 的内联脚本恢复；`useTheme()` 负责后续同步，`<html>` 上的 `suppressHydrationWarning` 只用于这一处。
- 首屏不渲染 `Date.now()`、随机数、浏览器时区相关文本；需要时改为客户端渲染或固定时区。
- 图标、字体等资源在 `root.tsx` 的 `links` 中声明；页面级资源放路由的 `links` 导出。
- 路由需要骨架时导出 `HydrateFallback` 或使用 `handle.skeleton`，不要在页面组件里手写首屏占位。

## 6. 响应式与触摸

- 移动端优先：先写基础布局，再用 `sm:` / `md:` / `lg:` 增强。
- 断点以 Tailwind 为准；JS 判断统一用 `useIsMobile()`（`<768px`）。项目没有 `use-media-query`，不要新增第二份实现。
- 交互元素在触屏上提供 `active` 反馈；hover 只作为指针设备的增强，不承载唯一信息。
- 触控目标不小于 44×44px；按钮组件已通过 `pointer-coarse` 样式保证。
- 使用 `dvh` 处理移动端浏览器地址栏变化；不要用固定 `100vh` 撑满全屏。
- 固定底栏与安全区留白使用 `env(safe-area-inset-bottom)`。
- 横向溢出用 `overflow-x-hidden` 兜底，但先修布局，不用 `overflow` 掩盖问题。

## 7. 动效与偏好

- 过渡 150–350ms；进入淡入 + 轻微位移，退出反向。
- `prefers-reduced-motion: reduce` 时保留淡入，去掉位移、缩放与循环装饰动画（`app.css` 已全局降级）。
- 加载中的骨架与 Spinner 不受减少动态影响，但避免闪烁。
- 浮层动画不做弹跳；弹性只用于抽屉与分段指示器。
- 路由级 View Transitions 在减少动态时直接关闭（`app.css` 已处理）。

## 8. 状态恢复

- 主题：`useAppStore` 持久化 + `useTheme()` 应用，`root.tsx` 内联脚本防闪烁。
- 路由滚动：`ScrollRestoration` 按 pathname 恢复。
- 无限滚动刷新：`useScrollPositionMemory()` 仅在整页刷新时恢复。
- 筛选与分页：URL。
- 媒体查看器、搜索聚焦：组件状态 / URL `focus` 参数。
- 不把同一状态同时写进 URL、store 和组件状态；选一个来源，其余派生。
