# Layout & Navigation Specifications

此文档定义了应用的核心骨架。目标是实现从 Desktop 的左侧侧边栏无缝切换到 Mobile 的底部导航栏，同时保持 iOS 原生的半透明和物理质感。

---

## 1. 桌面端侧边栏 (Desktop Sidebar)

模仿 Twitter 的左侧导航，但视觉上更接近 macOS 的 Sidebar。

### 1.1 容器结构

- **位置:** Fixed Left (`h-screen sticky top-0`).
- **宽度:**
  - **XL:** 275px (显示图标 + 文字).
  - **LG:** 88px (仅显示图标，居中对齐).
- **样式:**
  - 默认透明背景，但在内容滚动时，如需视觉隔离，可添加 `backdrop-blur-xl`.
  - 右侧边界: `border-r border-border/40` (使用极细的分割线).

### 1.2 导航项 (NavItem)

这是一个极其常用的组件，不同于普通按钮。

- **Base UI Primitive:** 使用 HTML `<a>` 或 React Router `<Link>`，无需复杂的 Base UI 逻辑，仅需 focus ring 管理。
- **Shape:**
  - **Twitter Style:** 胶囊型 (Pill shape) `rounded-full`.
  - **Hover:** `hover:bg-accent/50` (Apple 风格的灰色底，而非 Twitter 的品牌色底).
- **Typography:** Text-xl, heavy boldness (`font-bold` 或 `font-semibold`).
- **Active State:** 图标变为填充态 (Filled)，文字保持高亮。

**Code Pattern:**

```tsx
<nav className="flex flex-col gap-2 px-3 py-4">
  <NavItem href="/home" icon={HomeIcon} activeIcon={HomeFilledIcon}>主页</NavItem>
  <NavItem href="/explore" icon={SearchIcon}>探索</NavItem>
</nav>
```

---

## 2. 移动端导航 (Mobile TabBar)

当视口 < 640px 时，侧边栏隐藏，底部 TabBar 出现。这是标准的 iOS 设计。

### 2.1 容器物理属性

- **位置:** Fixed Bottom (`bottom-0 w-full`).
- **材质 (关键):**
  - 必须使用 **High Quality Blur**.
  - `bg-background/80 backdrop-blur-xl border-t border-border/40`.
  - 这一层必须位于 `z-50`，覆盖在信息流之上。
- **安全区:** 必须包含 `pb-[env(safe-area-inset-bottom)]` 以适配 iPhone 底部横条。

### 2.2 交互细节

- **双击 Tab:**
  - 如果用户当前已在“主页”，再次点击“主页”Tab，应触发**平滑滚动至顶部** (Scroll to Top)。
  - 再次点击，触发**刷新** (Refresh)。
- **触觉反馈:** Mobile 端点击 Tab 必须触发轻微的 Haptic Feedback (如果环境支持)。

---

## 3. 瀑布流布局 (Masonry Layout)

用于媒体页面 (`/media`)。

- **技术实现:** 不建议使用纯 CSS Column (会导致顺序由上至下而非由左至右)。建议使用基于 Grid 的 JS 库或简单的 Flex 划分。
- **间距:** 极小间距 `gap-1` 或 `gap-0.5` (模仿 iOS 相册视图)。
- **圆角:**
  - 瀑布流中的图片默认为 `rounded-none` 或极小圆角。
  - 仅在点击放大进入 "Lightbox" 模式后，通过动画过渡。

---

## 4. 标题栏与吸顶 (Sticky Headers)

Twitter 和 iOS 都重度依赖 Sticky Header。

### 4.1 玻璃化标题栏

- 页面顶部的标题栏（"主页", "设置"）必须 `sticky top-0 z-40`.
- **初始状态:** 背景完全透明 (Transparent).
- **滚动状态:** 当检测到页面滚动 (`window.scrollY > 0`)，激活玻璃态: `bg-background/85 backdrop-blur-md border-b border-border/40`.

### 4.2 动效

- 使用 Framer Motion 的 `useScroll` 钩子来平滑过渡 opacity 和 blur，避免突兀的样式切换。
