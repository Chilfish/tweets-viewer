# 尸检报告索引（Postmortems）

> **开写任何代码前，先读本页。** 本仓库历史踩坑全部沉淀于此，对照「高频雷区」自查后再动工，避免重复返工。
>
> 原则：**blameless** —— 不追究"谁写错了"，只追"什么系统条件允许它发生"，然后修系统和流程。

## 索引表

| 编号 | 主题 | 根因归类 | 一句话教训 | 状态 |
|---|---|---|---|---|
| [001](001-windows-symlink-mode-sticky.md) | Windows 下符号链接改普通文件后 index mode 残留 symlink | 工具反馈滞后 | symlink→file 迁移必须 `git rm --cached` + `git add` 刷新 mode，提交后核对 `git ls-files -s` | 已沉淀 |
| [002](002-vitest-component-test-infra.md) | Storybook addon-vitest 接入吞掉 test.include + Vitest 4 projects 配置踩坑 | 工具反馈滞后 | 会接管 include 的测试插件必须用 vitest projects 拆分，跑完核对 Test Files 数量防静默吞测试 | 已沉淀 |

## 高频雷区（写码前自查）

### 1. 类型与数据

| 规则 | 对策 |
|---|---|
| `any` 泛滥 | 用明确类型或 `unknown` + 收窄；scripts 抓取脚本可放宽（数据来自外部 API） |
| 日期边界 | 服务端接受 date-only 值（`2023-01-01`）与完整 ISO 时间戳；查询时统一归一化 |
| 分页游标 | `searchTweetsRaw` 游标循环注意 429 速率限制（exit 129）与 404 空结果（exit 104） |

### 2. 前端

| 规则 | 对策 |
|---|---|
| 颜色硬编码 | 用 CSS 变量 Token（`bg-background` 等），禁止 `bg-[#xxx]` |
| 只写浅色 | 所有组件必须兼容 `.dark` 模式 |
| 字符串拼类名 | 用 `cn()` |
| `@/` 导入 | 用 `~/` 前缀 |
| 测试插件接管 include | `storybookTest()` 会覆盖 `test.include` → 用 vitest `test.projects` 拆分 story 与常规测试；子项目不继承 tsconfig paths / coverage 仅根级；RTL 自动 cleanup 依赖全局 `afterEach`，关 globals 时在 setup 显式 `afterEach(cleanup)`；跑完核对 Test Files 数量（见 [002](002-vitest-component-test-infra.md)） |

### 3. 流程（非代码，简要记录）

- **文档滞后**：改功能先更新 Specification/API 文档再动代码，避免文档与实现漂移
- **commit 过大**：>10 文件或 >200 行主动拆分，见 `docs/engineering/git-workflow.md`
- **Windows symlink 迁移**：`core.symlinks=false` 时把已跟踪符号链接改为普通文件，仅 `git add` 不会刷新 index mode（仍 `120000`）；必须 `git rm --cached <file> && git add <file>` 强制重算，提交后核对 `git ls-files -s`（见 [001](001-windows-symlink-mode-sticky.md)）

## 如何新增一条 postmortem

1. 遇到返工/事故 → 先跑 `git log` 定位 commit 与影响，查 `docs/development-log/README.md`
2. 复制 [TEMPLATE.md](TEMPLATE.md)，编号顺延（`00X-<短横线主题>.md`），补摘要/影响/时间线/根因/行动项
3. 在本索引表加一行，若属于既有根因归类则在「高频雷区」补规则
4. 在 `docs/development-log/README.md` 记录当天事件
5. 根因是流程级 → 同步更新 `CLAUDE.md` 强制规范或 `docs/engineering/git-workflow.md`
