# Modals, Sheets & Drawers Specifications

基于 Base UI Dialog Primitive，我们定义三种不同的视图容器。

## 1. 底部抽屉 (The Sheet) - Mobile First

_这是移动端最重要的容器，替代传统的居中模态框。_

- **Trigger:** 所有的“更多菜单 (... icon)”、“评论输入框”、“转发选项”在移动端必须触发 Sheet。
- **Visuals:**
  - **Corner Radius:** `rounded-t-[20px]`.
  - **Gap:** 距离屏幕顶部至少留出 `44px` (Safe Area) 或 `10vh` 的间距。
  - **Material:**
    - 浅色模式: `bg-white` 或 `bg-zinc-50`.
    - 深色模式: `bg-zinc-900` (不是纯黑，要比背景略浅).
  - **Handle:** 顶部必须有一个 4px x 32px 的 `bg-muted` 胶囊条 (`rounded-full`)，用于指示拖拽。

- **Interactive Physics (Apple Style):**
  - **Damping:** 拖拽应该有“阻尼感”。
  - **Snap Points:** 建议设置 Snap Points（例如：只显示一半内容 / 全屏展开）。
  - **Background Scaling (Advanced):** 模仿 iOS Mail/Safari。当 Sheet 弹出时，背后的主页面 (`main` 容器) 应该轻微 `scale-[0.94]` 并增加 `border-radius`，产生层级后退的效果。(这需要 Context Provider 配合)。

## 2. 居中模态框 (The Modal) - Desktop Default

_在桌面端，Sheet 体验不佳，应回退到居中模态框。_

- **Visuals:**
  - `max-w-lg` (常规) 或 `max-w-2xl` (发推/复杂表单).
  - `rounded-2xl`.
  - `shadow-2xl` (弥散阴影).
  - `border border-border/50`.
- **Backdrop:** `bg-background/40 backdrop-blur-sm` (桌面端不需要纯黑遮罩，只需模糊即可)。

## 3. 下拉菜单与浮层 (Popover & Dropdowns)

_用于“更多”按钮。_

- **Base UI Component:** `Popover` or `DropdownMenu`.
- **Animation:** 必须有 `scale` 和 `fade` 的组合动画。
  - Enter: `opacity-0 scale-95` -> `opacity-100 scale-100`.
  - Exit: `opacity-100 scale-100` -> `opacity-0 scale-95`.
- **Origin:** 动画原点 (`transform-origin`) 必须根据 Trigger 的位置动态调整（例如按钮在左下，菜单往右上弹，原点就是 bottom-left）。

---

## 4. 关键实现代码片段 (The "Base UI way")

为了避免你提到的“代码啰嗦”，我们将通用样式封装。

**Bad (Inline Everything):**

```tsx
<Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out...">
```

**Good (Component Abstraction):**

我们创建一个 SheetContent 组件，专门处理移动端的逻辑。

```tsx
// components/ui/sheet.tsx (Concept)
// 使用 class-variance-authority (cva) 或 cn() 管理

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom rounded-t-xl',
        // ... other sides
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
)
```
