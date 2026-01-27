# Media Interaction & Lightbox Specifications

此文档定义了全屏媒体浏览器的交互逻辑。目标是复刻 iOS 相册的物理手感，并整合 Twitter 的信息展示需求。

## 1. 基础架构 (The Primitive)

使用 Base UI 的 `Dialog` 作为底层，但我们需要剥离默认样式，构建一个全屏的 Overlay。

- **Z-Index:** `z-[100]` (必须最高，覆盖所有 Sticky Header)。
- **Backdrop:**
  - **Color:** `bg-black/95` (极致的沉浸感，不要完全纯黑，留 5% 透明度让用户隐约感知背景存在，避免“迷失感”)。
  - **Blur:** `backdrop-blur-sm` (仅在背景非全黑时启用)。

## 2. 交互模式 A: 纯净预览 (Pure Lightbox)

_适用场景：主页时间流 (Timeline) 点击图片。_

### 2.1 进入与退出 (Transitions)

- **Shared Layout Animation:** 必须使用 `framer-motion` 的 `layoutId`。
  - 点击时，图片不应“闪现”，而应从缩略图的尺寸和位置**平滑放大**到全屏位置。
  - 退出时，图片应**缩小**回原来的缩略图位置。
- **Gestures (Mobile):**
  - **Drag to Dismiss:** 下拉手势并非触发滚动，而是线性改变图片的 Scale (0.9, 0.8...) 和 Backdrop 的 Opacity。手指松开时，如果位移超过阈值，则触发关闭动画。

### 2.2 界面元素

- **Close Button:** 左上角 `rounded-full bg-black/50 text-white`。
- **Actions:** 底部悬浮工具栏 (Save, Share)。

## 3. 交互模式 B: 混合预览 (Hybrid Viewer)

_适用场景：媒体页面瀑布流 (Masonry) 点击图片。_

此模式下，用户不仅在看图，还需要看“这张图属于哪条推文”。

### 3.1 桌面端表现 (Desktop - The Split View)

在宽屏下，不要使用 Sheet，而是模仿 Twitter Web/Instagram 的**双栏模态框**。

- **Layout:** Flex Row.
  - **Left (Media):** 占据剩余空间，背景 `bg-black`，图片 `object-contain` 居中。
  - **Right (Context):** 固定宽度 `w-[350px]` 或 `w-[400px]`。
    - 样式：`bg-background border-l border-border`.
    - 内容：完整的推文卡片（复用 Tweet Card 组件，但去掉媒体区域），下方接评论列表。

### 3.2 移动端表现 (Mobile - The Sheet Overlay)

这是你提到的核心需求：**弹窗大图片，同时通过 Sheet 显示推文内容。**

- **Layer 1 (底座):** 全屏黑色背景 + 图片。
  - 图片默认垂直居中。
- **Layer 2 (控制层):**
  - 底部有一个 "Handle" (短横条) 或 "View Context" 按钮。
  - **Interaction:** 用户上滑底部，或者点击按钮，呼出一个 **Base UI Dialog (Sheet Variant)**。
  - **Sheet Style:**
    - `fixed bottom-0 left-0 right-0`.
    - `max-h-[70vh]` (不要遮挡住图片顶部太多)。
    - `rounded-t-3xl` (Apple 风格的大圆角)。
    - `bg-background/80 backdrop-blur-xl` (毛玻璃材质，让背后的图片若隐若现)。

---

## 4. 技术实现建议 (Tech Implementation)

### 4.1 避免 Base UI 冲突

Base UI 的 Dialog 默认会锁定 `body` 滚动。

- **对于模式 B (Sheet):** 确保 Sheet 内部 (`Dialog.Content`) 也是可滚动的 (`overflow-y-auto`)。
- **Focus Management:** Base UI 会自动 Focus 到 Dialog 内的第一个可交互元素。在 Lightbox 模式下，请手动将 Focus 设置到“关闭”按钮或容器本身，防止键盘事件失效。

### 4.2 Tailwind 覆盖策略

不要在 JS 里写复杂的 style 对象。使用 Data Attribute 钩子：

```tsx
// 示例：根据拖拽进度改变透明度，这里可能需要结合 CSS Variables
<div
  className="fixed inset-0 bg-black/95 transition-opacity duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
  style={{ '--drag-percent': dragPercent }}
/>
```
