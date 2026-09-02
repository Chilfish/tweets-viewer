# 新项目脚手架建议（Scaffold Guide）

> **文档性质**：基于 tweets-viewer 项目搭建「Unified SNS Viewer」新项目的操作手册 —— 复制清单、目录结构、
> 初始化步骤、关键踩坑、Git 工作流。读者拿到本文档 + DATA-MODEL.md + UI-DESIGN.md + API.md 即可开工。

---

## 1. 复制范围（从本项目拷贝什么）

### 1.1 必拷（工作骨架）

```
tweets-viewer/
├── apps/web-react/               →  新项目 apps/web/（前端骨架，删业务组件）
│   ├── app/
│   │   ├── app.css               ← Token/动效/暗色（原样）
│   │   ├── fonts.css             ← 原样
│   │   ├── routes.ts             ← 改路由表（见 §3.3）
│   │   ├── root.tsx              ← 原样（主题/全局样式）
│   │   ├── components/layout/    ← layout/sidebar/top-nav/bottom-nav/user-selector（改文案）
│   │   ├── components/ui/        ← 全部 Base UI/COSS 原子组件（原样）
│   │   ├── components/feed-status.tsx        ← 原样
│   │   ├── components/spinner.tsx/progress-bar.tsx/search-input.tsx  ← 原样
│   │   ├── components/skeletons/ ← ProfileHeader 骨架等（改字段）
│   │   ├── hooks/                ← use-mobile/use-theme/use-hydrated/use-intersection-observer/use-media-columns/use-global-shortcuts
│   │   ├── lib/utils.ts          ← cn() + apiClient（原样）
│   │   ├── lib/paginated-stream.ts           ← 原样（applyLoaderPage/applyFetchedPage/appendUnique）
│   │   ├── hooks/use-url-paginated-stream.ts ← 原样（泛型）
│   │   ├── store/use-app-store.ts            ← 原样
│   │   └── store/use-media-viewer.ts         ← 原样
│   ├── vite.config.ts            ← 原样（proxy /api + VITE_API_URL 注入）
│   ├── react-router.config.ts / tsconfig.json / package.json（依赖清单）← 原样
│   └── components.json           ← coss 配置
├── packages/shared/              →  新项目 packages/shared/（加 unified-sns 类型）
│   ├── types.ts                  ← PaginatedResponse 保留 + 新增 UnifiedPost 族
│   ├── constant.ts               ← 改 URL/平台常量
│   └── utils/                    ← date.ts（formatDate 时区）原样
├── docs/                         →  新项目 docs/（沿用规格驱动文档体系）
└── 根配置                        ← package.json(workspaces)/bunfig.toml/tsconfig/eslint(@antfu)/lefthook
```

### 1.2 按需拷贝（业务组件改造模板）

| 本项目组件 | 新项目用法 |
|---|---|
| `components/tweet/TweetNode.tsx` + `react-tweet/*` | → `PostCard` 主模板（Header/Body/Media/Actions/Quote） |
| `components/ins/InstagramPostCard.tsx` + `IGMediaGrid.tsx` + `IGCaption.tsx` + `IGActionBar.tsx` | → IG/图文布局变体 + 统一媒体网格逻辑 |
| `components/ins/IGMusicInfo.tsx` + `IGCardHeader.tsx`（proxyImage） | → platform 特化组件 + 媒体代理先例 |
| `components/media/*`（MediaWall/MediaCard/MediaPreviewModal/GlobalMediaViewer） | → 媒体墙 + 灯箱（原样，FlatMediaItem 改名） |
| `components/tweet/InfiniteScrollTrigger.tsx` / `date-divider.tsx` / `TweetNavigation.tsx` / `tweets-toolbar-actions.tsx` | → 流/分隔线/分页器/工具栏 |
| `components/profile/ProfileHeader.tsx` | → 作者档案头（多平台账号行） |
| `components/home/*`、`lib/group-tweets-by-*.ts`、`lib/media.ts` | → 首页/分组/媒体展平（改名 posts） |
| `packages/rettiwt-api/types/enriched/*` | → 只抄类型范式（Entity/MediaDetails/VideoInfo），不抄抓取实现 |

### 1.3 不拷（业务无关）

- `apps/server` 里的 tweets/ins 具体路由（按新 API.md 重写，Hono 骨架可抄 `common.ts` / `lru-cache.ts`）
- `packages/rettiwt-api`（X 私有 API 客户端 —— 新项目用第三方工具导出，不需要）
- `apps/scripts` 抓取脚本（第一阶段用「工具导出 JSON → import 脚本入库」）

---

## 2. 目录结构（新项目目标态）

```
unified-sns/
├── apps/
│   ├── web/                  # 前端（React Router v7 SPA-first + Tailwind v4 + Base UI）
│   ├── server/               # API（Hono + Neon/SQLite，见 DATA-MODEL §8）
│   └── scripts/              # 抓取导入（第一阶段：import-<platform>.ts）
├── packages/
│   ├── shared/               # UnifiedPost/UnifiedMedia/UnifiedAuthor/UnifiedEntity + PaginatedResponse + 平台能力矩阵
│   └── adapters/             # 各平台清洗适配器（PostAdapter 实现）+ 测试样本 JSON
├── docs/                     # README/DATA-MODEL/UI-DESIGN/API/RESEARCH/SCAFFOLD（本目录同样式）
├── env.server.ts             # 环境变量校验（Zod，抄本项目）
└── bunfig.toml / package.json / lefthook.yml / eslint.config.ts
```

> **包管理器**：Bun Workspaces（`packageManager: bun@1.x`）。前端依赖清单原样抄 `apps/web-react/package.json`
> （react 19 / react-router 8 / tailwind 4 / @base-ui/react / zustand / axios-cache-interceptor / lucide-react / date-fns）。

---

## 3. 初始化步骤（零 → 跑通）

1. **脚手架**：`bun create` 或手抄 apps/web-react 骨架 → `bun install` → `bun dev` 确认空路由可跑。
2. **类型落地**：`packages/shared` 写入 DATA-MODEL §3 全部类型；`types.ts` 导出；跑 `bun --cwd packages/shared test`。
3. **测试样本**：每个平台放 10-30 条第三方工具导出的真实 JSON 到 `packages/adapters/fixtures/<platform>/`，
   写 `normalize` 测试（Vitest）——**先测试后实现**（项目强制规范 §5）。
4. **导入脚本**：`apps/scripts/import-<platform>.ts` 读 fixtures/导出目录 → adapter.normalize → 入库（SQLite 起步）。
5. **前端卡片**：按 UI-DESIGN §8 顺序开发；先用「导入的本地 JSON + clientLoader 读静态」跑通 UI（不依赖后端）。
6. **API**：Hono 路由按 API.md 实现，前端切换为 axios 请求。
7. **部署**：前端 Vercel + API Cloudflare Workers（本项目双端部署模式，`engineering/deploy-checklist.md` 对照）。

---

## 4. 关键踩坑（从本项目 postmortem 与代码中提炼）

| 坑 | 本项目出处 | 新项目对策 |
|---|---|---|
| IG/YT CDN 图 CORS 拦截（`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`） | `IGCardHeader.tsx` proxyImage | 前端 `MediaImage` 统一代理路由（API.md §6.1） |
| YouTube 社区帖无绝对时间（相对时间"2 years ago"） | RESEARCH.md / 抓取经验 | 抓取时刻近似 + `meta.archived` 标记（DATA-MODEL §6.1） |
| 滚动式自动化卡死（后台标签节流） | YouTube posts 调研（innerTube 续传） | 第一阶段不做浏览器抓取，用工具导出 + 导入脚本 |
| 深翻页性能退化 | 本项目 keyset 转正（4B） | 游标协议从第一天就用 keyset（API.md §4） |
| `dark:` 手动覆盖与硬编码色 | app.css Token 纪律 | 无 Token 的 PR 不合并（lint 阶段检查） |
| 缩略图模糊/竖图裁头 | `IGMediaGrid.getImageFitClass` | 存原图尺寸 + 内容感知 object-position |
| 列表流状态串扰（切换用户残留旧数据） | `use-url-paginated-stream` filterKey | 所有流的 `filterKey` 必须含作者+平台+筛选全键 |
| 引用/转帖 JSON 爆炸 | `EnrichedTweet` 嵌套规范 | 嵌套深度 = 1，清洗期扁平化（DATA-MODEL §6.5） |
| Windows 开发环境 symlink 问题 | postmortem/001 | 全程用 Bun（自动处理），不手动建软链 |
| 组件测试 infra 不稳 | postmortem/002 | 核心逻辑全放纯函数（paginated-stream 范式），components 测试少而精 |

---

## 5. Git 工作流与文档纪律（沿用强制规范）

1. **文档先行**：改动规格 → 先改 docs/；新功能 → 开发日志（`docs/development-log/YYYY-MM-DD.md`）。
2. **先写 commit message 再写代码**，原子提交，diff >10 文件或 >200 行必须拆分。
3. **测试先行**：清洗适配器 / 分页纯函数 / store 必带 Vitest。
4. **读尸检报告**：新项目开写前把本项目 `docs/postmortem/README.md` 通读一遍，坑已迁移到 §4 表。
5. **SDD**：功能行为变更先改 `docs/Specification.md`（新项目建立自己的规格文档，DATA-MODEL/UI-DESIGN/API 即规格）。

---

## 6. 第一阶段交付物清单（建议 Milestone）

| Milestone | 内容 | 验收 |
|---|---|---|
| M0 骨架 | 前端骨架跑通 + tokens + 空路由 | `bun dev` 打开首页 |
| M1 类型+样本 | UnifiedPost 类型 + 2 平台 fixtures + adapter 测试绿 | `bun --cwd packages/adapters test` |
| M2 时间线 | `/posts/:name` 无限滚动 + 平台筛选 + PostCard(X/IG) | 本地 JSON 数据流浏览 |
| M3 媒体墙 | `/media/:name` 瀑布流 + 灯箱 | 图片滑动/hero 过渡 |
| M4 页面补全 | 首页/搜索/那年今日/作者页 | 全路由可用 |
| M5 API | Hono API（posts/media/authors）+ 前端切换 | CDN 缓存头生效 |
| M6 打磨 | a11y/按压反馈/PWA/reduced-motion | 移动端 iOS 手感 |

> 规模估算：M0-M2 前端 + 类型 ≈ 2-3 天；后续每个平台适配器 ≈ 0.5-1 天（含 fixtures 与测试）。