# Feed Controls Design Pattern

此文档定义了信息流 (Feed) 场景下的控制栏设计模式。该模式结合了 Apple iOS 风格的材质感与 Web 端的高效操作性，旨在解决长列表浏览中的导航与筛选难题。

## 1. 核心布局 (Layout Structure)

采用 **Sticky Glass Header** 模式。

```tsx
<div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
  <div className="flex items-center justify-between h-11 px-4">
    {/* Left: Navigation */}
    <TweetNavigation />

    {/* Right: Actions */}
    <TweetsToolbarActions />
  </div>
</div>
```

- **高度**: 固定为 `h-11` (44px)，符合移动端触控标准。
- **材质**: 必须使用高斯模糊 (`backdrop-blur-xl`) 配合 80% 透明度的背景色，以确保内容滑过下方时产生细腻的视觉深度，同时保证可读性。
- **层级**: `z-40`，位于内容之上，但在 Modal/Dropdown (`z-50`) 之下。

---

## 2. 导航器 (Navigation Component)

位于工具栏左侧，负责指示当前位置并提供跳转能力。

### 结构

`[Prev Button] [Current Page / Total] [Next Button]`

- **页码指示器**:
  - **外观**: 看起来像纯文本，但实际上是一个 `Button (variant="ghost")`。
  - **交互**: 点击触发 `DropdownMenu`，提供全量页码列表，允许用户“瞬移”。
  - **状态**: 即使只有 1 页，也应显示 `1 / 1` 以维持布局稳定性（此时禁用前后箭头）。

### 交互细节

- **点击翻页**: 触发 URL 更新 (`page=n`) 并自动滚动至顶部 (`window.scrollTo(0, 0)`).
- **无限滚动**: 当用户向下滚动触发自动加载时，导航器上的数字应自动更新（如变为 `2 / 50`），但**不**回滚顶部。

---

## 3. 动作工具栏 (Toolbar Actions)

位于工具栏右侧，包含排序、筛选、搜索等操作。

### 设计原则

- **Collapsed by Default**: 默认只显示图标或简短 Label，避免喧宾夺主。
- **Active State Highlighting**: 当有筛选条件生效时，按钮应变色（如 `text-primary bg-primary/10`）并显示具体值（如日期范围），而非仅是一个高亮的小点。

### 日期筛选器模式

采用 **Popover + Draft State** 模式：

1.  **触发**: 点击日历图标打开 Popover。
2.  **草稿 (Draft)**: 用户在 Popover 内的操作（选择日期、切换 Tab）仅更新本地 React State，**不**触发生效。
3.  **应用 (Commit)**: 只有点击底部的“确认”按钮，才将 State 同步到 URL，触发数据刷新。
4.  **取消/重置**: 提供明确的清理入口。

---

## 4. 骨架屏规范 (Skeleton Specs)

在数据加载（Fetching）或重置（Hard Reload）期间，必须使用骨架屏占位，禁止使用全屏 Spinner。

### 4.1 Tweet Skeleton

精确复刻真实推文的 DOM 结构：

- **Avatar**: `size-10 rounded-full`
- **Header**: `h-4 w-24` (Name) + `h-4 w-16` (Handle)
- **Content**: 3 行不等宽的条形 (`w-[90%]`, `w-[80%]`, `w-[60%]`)
- **Actions**: 底部 4 个圆形占位符 (`size-8`)

### 4.2 Profile Header Skeleton

针对大块区域的特殊处理：

- **Banner**: 保持与真实 Banner 一致的纵横比 (`aspect-3/1`)。
- **Overlap**: 确保头像骨架的位置与真实布局一致（通常是通过负 margin `mt-[-x]` 实现的重叠效果）。

---

## 5. 实现检查清单

- [ ] 是否使用了 URL 作为状态的唯一真值？
- [ ] 只有 User Action（点击确认）才写入 URL，避免中间状态污染历史记录？
- [ ] 分页器是否始终吸顶且不遮挡内容？
- [ ] 数据为空时，是否展示了友好的 Empty State 而非空白？
- [ ] 加载过程中是否使用了 Skeleton 防止布局抖动？
