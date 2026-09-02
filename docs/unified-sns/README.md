# Unified SNS Viewer — 新项目规格文档

> **项目定位**：一个「多平台 SNS 帖子统一归档阅读器」——用第三方开源工具把 X / Instagram / YouTube /
> Bilibili / 微博 / Reddit / Bluesky / Mastodon / Threads / TikTok / 小红书等平台的帖子**抓取并清洗为统一基础格式**，
> 在 Web 页面上以统一的沉浸式阅读体验展示（时间线 / 媒体墙 / 搜索 / 那年今日）。
>
> **UI 设计**完全参考本项目（tweets-viewer）前端：Apple 原生感设计系统、URL 驱动状态、服务端分页、
> 骨架屏优先、媒体灯箱 hero 过渡。**数据架构**继承「结构化列 + JSON 列」双轨与 `PaginatedResponse` 分页协议。

---

## 1. 核心决策摘要（ADR 预告）

| # | 决策 | 理由 |
|---|---|---|
| 1 | 统一 `UnifiedPost` 模型，平台差异进 `extra` | 一个模型全平台覆盖，前端组件零平台分支（详见 DATA-MODEL） |
| 2 | 抓取侧第一阶段用**第三方工具导出 JSON → 导入脚本入库**，不做浏览器自动化 | 反爬/维护成本高（本项目 YouTube 抓取已证实滚动自动化易卡死）；工具导出稳定可控 |
| 3 | 前端仅消费 `UnifiedPost`（SPA-first + 静态壳，clientLoader） | 继承本项目 ADR-010：首屏静态壳 + 骨架，SEO 由 meta() 覆盖 |
| 4 | keyset 游标分页（`createdAt` 游标）+ offset 分页器并存 | 深翻页不退化 + 可分享定位（项目 4B 已转正的协议） |
| 5 | 结构化列 + jsonData JSON 列双轨存储 | 查询效率与渲染灵活性兼得，避免 EAV |
| 6 | URL 是唯一真值来源：前端只改 URL 不调 API | 书签/分享/刷新还原状态 |
| 7 | 媒体图统一走前端代理组件 | 多平台 CDN 的 CORS/CORP 拦截（本项目已踩坑） |

---

## 2. 文档导航

| 文档 | 内容 | 依赖 |
|---|---|---|
| [DATA-MODEL.md](./DATA-MODEL.md) | **统一数据模型**：UnifiedPost 全部 TypeScript 类型、JSON Schema 规划、清洗规范、Adapter 接口、DB Schema 草案 | 无 |
| [UI-DESIGN.md](./UI-DESIGN.md) | **前端 UI 设计**：设计系统（继承本项目 tokens）、组件树、PostCard/媒体墙/页面拓扑、交互状态机 | DATA-MODEL |
| [API.md](./API.md) | **REST API 契约**：端点、PaginatedResponse、游标协议、缓存/代理 | DATA-MODEL |
| [RESEARCH.md](./RESEARCH.md) | **平台×工具调研**：各平台第三方抓取工具、能力矩阵、适配难度评估、统一模型字段映射 | 外部调研 |
| [SCAFFOLD.md](./SCAFFOLD.md) | **新项目脚手架**：从本项目复制清单、初始化步骤、踩坑表、Milestone | 全部 |

> 阅读顺序建议：`README` → `DATA-MODEL` → `UI-DESIGN` → `API` → `SCAFFOLD`；需要选型依据时再看 `RESEARCH`。

---

## 3. 与本项目（tweets-viewer）的关系

- **不是 fork**：新项目独立仓库、独立命名，代码从本项目**选择性复制**（复制清单见 SCAFFOLD §1）。
- **继承的遗产**：设计 Token 体系、分页流状态机（paginated-stream）、FeedStatus 四态、媒体墙+灯箱、
  RichText 实体渲染、Zustand store 模式、文档纪律（SDD / 文档先行 / 测试先行）。
- **不继承的负担**：rettiwt-api 私有 API 客户端、Neon/Cloudflare 强绑定（新项目可 SQLite 起步）、
  IG→Twitter 映射表（新项目以「自然人」为作者维度，多平台账号挂在同一作者下）。

---

## 4. 术语表（Glossary）

| 术语 | 定义 |
|---|---|
| **帖子 (Post)** | 任何平台上一条可独立展示的内容单元（推文/IG 帖/动态/视频/微博…） |
| **统一帖子 (UnifiedPost)** | 清洗后落入统一 schema 的帖子（DATA-MODEL §3） |
| **作者 (Author)** | 一个自然人的跨平台身份聚合（多个平台账号） |
| **适配器 (Adapter)** | 把第三方工具输出转换为 UnifiedPost 的清洗器（DATA-MODEL §7） |
| **能力矩阵 (Capabilities)** | 各平台能提供哪些可选字段的声明表（DATA-MODEL §2） |
| **keyset 游标** | 基于排序列值（createdAt）的翻页游标，深翻页不退化 |
| **媒体墙 (MediaWall)** | 帖子媒体展平的瀑布流视图 + 灯箱（UI-DESIGN §4.3） |
| **那年今日 (On This Day)** | 历史年份同月同日的帖子聚合视图 |