# 003-view-transition-persistent-chrome-morph

## 摘要

Phase 5 用 View Transitions API 时，把 `view-transition-name` 打在**持久布局元素**（sidebar / topnav / bottomnav / ProfileHeader）上，导致路由切换时这些元素被浏览器对两个快照做 morph 插值——内容一变化（active 高亮、切换用户）就漂移变形；随后媒体灯箱的 body 滚动锁 + `transition-all` 又引发滚动条消失导致的布局位移，共返工 3 轮。

## 影响

- 范围：`apps/web-react` 路由过渡（5B-1/5B-4）+ 媒体灯箱（hero transition）的视觉表现
- 代价：3 轮返工（`0f6b46b` 打 name → `b8ac911` 撤 name、`dd99612` 修滚动锁/transition）；期间用户实测出现「侧边栏/header 切换很怪、上下位移、`<body style="overflow: hidden">` 不给滚动」

## 时间线

1. **5B-1（44845d7）**：给 `.top-nav-chrome`/`.sidebar-chrome`/`.bottom-nav-chrome` 加静态 `view-transition-name`，意图「共享元素稳定不跳」
2. **5B-4 后（0f6b46b）**：给 `.profile-container` 也加 `view-transition-name: profile`，并移除了 ProfileHeader 的 key+fade 过渡（误以为 VT 接管）
3. **用户实测**：路由切换时侧边栏/header「特别怪」——active 高亮、切换用户时内容被 morph 插值（漂移/变形）；且 root 过渡带 `translateY` 位移，整页含 chrome 上下动
4. **d3aba44**：媒体灯箱加 hero transition（缩略图↔灯箱图，这个用法本身正确）+ hash 状态化；同时在 `MediaWall` 手动加 body `overflow: hidden` 滚动锁
5. **用户实测**：点开大图后 `<body style="overflow: hidden">` 突兀出现、不给滚动；sidebar 又出现上下位移——滚动条消失 → 视口宽度变化 → `main`/`sidebar` 的 `transition-all` 把布局位移动画化
6. **b8ac911**：对照 [MDN view-transition-name](https://developer.typescripts.org/en-US/docs/Web/CSS/view-transition-name) 与 [Chrome 同文档过渡指南](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)，撤掉全部持久 chrome 的 name、移除 root 位移、恢复 ProfileHeader key+fade
7. **dd99612**：删手动滚动锁（Base UI Dialog modal 自带）、`transition-all` → `transition-[max-width]`/`transition-[width]`

## 根因

- 直接原因：
  1. 把 `view-transition-name` 用在**持久元素**上——该属性语义是「共享元素过渡」：同一视觉对象在两个快照中的**不同 DOM 元素**之间 morph（如缩略图↔灯箱大图）。持久 chrome 在新旧快照是同一节点，打 name 后浏览器对**变化的内容**做 transform 插值 → 漂移变形
  2. root 过渡 keyframes 加了 `translateY`，整页（含 chrome）被位移
  3. 媒体灯箱手动加 body 滚动锁，与 Base UI Dialog 自带 modal 滚动锁重复；且 `transition-all` 让滚动条消失引发的布局变化被动画化
- 系统条件（什么让它可以发生）：View Transitions API 是相对新的平台能力，其「同名元素跨快照 morph」的精确行为（只对**不同元素**做插值、对持久元素反而有害）没有文档先行核实；写码前只凭直觉「给共享元素打 name 就会稳定」，未查 MDN/Chrome 指南
- 根因归类：`API 契约未核实`（主）+ `设计建模`（把持久元素误当共享元素）

## 行动项

- [x] 持久布局元素（sidebar/nav/header）**不得**打 `view-transition-name`——留在 root 快照跟随整体 crossfade；name 只用于真正跨快照的共享元素（媒体缩略图↔灯箱大图）
- [x] root 过渡动画保持纯 crossfade（Apple 式），不做 translateY 位移
- [x] modal 滚动锁交给组件库（Base UI Dialog modal 自带）；`transition-all` 收窄为具体属性（`transition-[max-width]` 等），防布局跳动被动画化
- [ ] 已列入 CLAUDE.md 强制规范？否（规则已写入开发日志与 postmortem 高频雷区；如再遇 VT 相关返工再提升）
- [x] 用平台 API 前先查 MDN/Chrome 官方文档核对语义，尤其是动画/过渡类 API 的边界行为

## 复盘

- 新规则：**View Transitions 的 `view-transition-name` 是「共享元素过渡」，只用于同一视觉对象在两个快照中的不同 DOM 元素；持久布局元素打 name 会 morph 内容导致漂移变形**——已归入下方「高频雷区」2. 前端
- 副规则：**modal 滚动锁不手动加**（组件库已处理）；**`transition-all` 慎用**（滚动条/布局变化会被动画化，产生怪异位移）
