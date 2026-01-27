# UI Design System: Overview & Principles

> **Project Goal:** Build a "Twitter-structured" SNS platform that feels like a native Apple app.
> **Tech Stack:** Base UI (Headless) + Tailwind CSS + Framer Motion.

---

## 1. 核心哲学 (Core Philosophy)

- **Layout Identity (Twitter Skeleton):**
  - 采用经典的 **“圣杯布局” (Holy Grail Layout)**：左侧导航、中间信息流、右侧辅助信息。
  - 信息密度高，但通过留白和分组避免杂乱。
- **Visual Soul (Apple Skin):**
  - **Materials over Colors:** 优先使用半透明材质 (Blur/Glass) 而非纯色背景，以此体现层级（如侧边栏、顶部导航）。
  - **Superellipses:** 所有圆角必须平滑（使用 CSS `border-radius` 的同时，关键容器考虑 mask 或 SVG 拟合）。
- **Technical Purity (Base UI First):**
  - **Don't Fight the Primitive:** 严禁破坏 Base UI 的 DOM 结构。利用 Base UI 提供的 `data-state` 钩子进行样式绑定，减少 JS 逻辑。

---

## 2. 材质与视觉系统 (Material & Visual System)

### 2.1 材质 (Materials)

Apple 设计的核心在于“光”与“材质”。我们不只使用灰色，而是使用带透明度的材质。

- **Glass (Sidebar/Header):** `bg-background/80 backdrop-blur-xl border-r/b border-border/40`.
- **Canvas (Page Background):** 纯色或极微弱的渐变。
- **Platter (Cards/Dropdowns):** `bg-card`，在深色模式下应略微提亮，而非纯黑。

### 2.2 响应式断点与网格 (Responsive & Grid)

为了完美复刻 Twitter 的适配体验：

- **Mobile (<640px):** 单栏流式布局。导航转为底部 TabBar。
- **Tablet (640px - 1024px):** 双栏布局。左侧导航变为图标条 (Icon-only)，右侧内容区拉伸。
- **Desktop (>1024px):** 三栏布局。
  - **Left (Nav):** `275px` (Fixed) 或 `88px` (Icon-only on smaller desktop).
  - **Center (Feed):** `600px` (Fixed/Max). 黄金阅读宽度。
  - **Right (Widgets):** `350px` (Flex). 搜索、推荐关注等。

### 2.3 深度与阴影 (Depth & Shadows)

模仿 iOS 的层级感：

- **Layer 0 (Background):** `z-0`
- **Layer 1 (Feed Content):** `z-10`
- **Layer 2 (Sticky Headers/Nav):** `z-40` + Glass Effect.
- **Layer 3 (Modals/Dropdowns):** `z-50` + `shadow-2xl` + Overlay.

---

## 3. 开发守则：Base UI 优化 (Implementation Guidelines)

为了避免 Tailwind 代码过于啰嗦，遵循以下原则：

**❌ Bad (Verbose & Fragile):**

手动处理所有伪类，代码难以阅读。

```tsx
<button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 aria-expanded:ring-2...">
```

**✅ Good (Data-Attribute Driven):**

Base UI 会自动在根元素上挂载状态属性（如 `data-hover`, `data-active`, `data-focus-visible`）。利用 Tailwind 的 `data-` 修改器。

```tsx
<button className="bg-primary transition-all data-[hover]:bg-primary/90 data-[active]:scale-[0.98] data-[disabled]:opacity-50">
```

**✅ Good (Compound styling):**
利用 `group` 和 `group-data` 处理父子组件交互（例如：鼠标悬停在 Card 上时，点亮 Card 内部的某个图标）。

```tsx
<Card className="group">
  <CardTitle className="group-data-[hover]:text-blue-500">...</CardTitle>
</Card>
```


## 4. 组件分类索引 (Component Index)

具体的组件实现范式请参考以下文档：

- **[SETTINGS.md](./components/SETTINGS.md):** 设置页面布局、分组、开关行、选择器等。
  - _适用于：用户设置、配置面板、表单列表。_
- **[GENERAL.md](./components/GENERAL.md):** 按钮、输入框、卡片、分隔符等通用原子组件。
  - _适用于：全局通用的基础 UI 元素。_
- **[LAYOUT.md](./components/LAYOUT.md):** 布局容器、网格、分栏等。
  - _适用于：页面布局、内容分组、导航栏。_
- **[MEDIA_INTERACTION.md](./components/MEDIA_INTERACTION.md):** 图片、视频、音频等媒体元素的交互组件。
  - _适用于：媒体的预览查看。_
- **[MODAL_SHEETS.md](./components/MODAL_SHEETS.md):** 模态框、抽屉等。
  - _适用于：弹出式内容展示。_

_(更多组件规范将随项目发展陆续添加)_
