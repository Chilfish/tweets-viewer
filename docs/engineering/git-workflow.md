# Git 开发流程

**项目**: Tweets Viewer | **最后更新**: 2026-09-13

## 分支模型

采用 **Trunk-Based Development** (简化版):

```
main ─────●─────●─────●─────●──→ (始终可发布)
           \     /
feat/xxx ──●───●
```

| 分支类型 | 命名格式 | 用途 | 生命周期 |
| --- | --- | --- | --- |
| `main` | — | 稳定分支，始终可发布 | 永久 |
| `feat/*` | `feat/date-range-filter` | 功能开发 | 合并后删除 |
| `fix/*` | `fix/date-only-values` | Bug 修复 | 合并后删除 |
| `refactor/*` | `refactor/remove-unused` | 重构 | 合并后删除 |
| `docs/*` | `docs/sync-architecture` | 文档更新 | 合并后删除 |
| `chore/*` | `chore/bump-daypicker` | 构建/依赖 | 合并后删除 |

## Commit 规范

遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)。

### 格式

```
<type>(<scope>): <description>
```

### Type

| Type | 说明 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat(web): add DateRangeFilter` |
| `fix` | Bug 修复 | `fix(server): accept date-only values for date range` |
| `refactor` | 重构（不改变行为） | `refactor(web): migrate Calendar to @daypicker/react v10` |
| `test` | 测试 | `test(database): add date range query test` |
| `docs` | 文档 | `docs: sync architecture and API docs` |
| `style` | 格式化 | `style: apply eslint fixes` |
| `chore` | 构建/工具 | `chore: bump deps` |
| `perf` | 性能优化 | `perf(web): memoize feed rows` |

### Scope

Scope 使用模块名或功能名：
- `web`（apps/web-react）, `server`（apps/server）, `scripts`（apps/scripts）, `db`（packages/database）, `shared`, `docs`, `build`, `deps`

### 规则

- **Description 用英文祈使句**：`add`, `fix`, `remove`（不用 `added`, `fixed`）
- 首字母小写，不加句号，不超过 72 字符
- **Breaking change**: footer 中标记 `BREAKING CHANGE: description`

### Commit 纪律

> **先想 commit message，再动工写代码。** 避免"上帝 commit"（一个超大 commit 包含所有变更）。

工作流程：
1. **写代码前**，先用 Conventional Commit 格式确定 commit message（如 `feat(web): add date range filter`）
2. **围绕这个 message 的范围编写代码**，超出范围的工作留给下一个 commit
3. **当 diff 变大时（>10 文件或 >200 行），主动拆分**为多个独立 commit
4. 每个 commit 应能独立通过检查（lint + typecheck + test + build）
5. 模块创建、功能实现、配置修改、文档更新应分开 commit

典型拆分示例：
```bash
# Commit 1: 功能实现
git commit -m "feat(web): add DateRangeFilter component"

# Commit 2: 服务端适配
git commit -m "fix(server): accept date-only values for the date range"

# Commit 3: 文档
git commit -m "docs: sync architecture and API docs with date range"
```

## 验证门禁

> **「看起来绿」不算绿**——改坏被测行为时门禁必须变红，否则等于没测。

### 提交前本地门禁（= pre-push 同款）

```bash
bun run lint:check   # ESLint --max-warnings=0
bun run typecheck    # react-router typegen + tsc（web-react）
bun run test         # 全包 Vitest（rettiwt-api + shared + database + server + web-react）
bun run build:client # 前端生产构建
```

- **禁止 `--no-verify`**：门禁红就修门禁，不要绕过
- 新功能/新纯函数先写测试再实现；断言必须能在「改坏行为」时失败，禁止静态源码字符串扫描冒充行为断言
- `NODE_ENV` 一律经 `cross-env` 固定，不依赖宿主环境（见 [postmortem 005](../postmortem/005-host-node-env-leak.md)）
- 新增测试后核对 `Test Files` 数量，防测试被静默吞掉（见 [postmortem 002](../postmortem/002-vitest-component-test-infra.md)）

### CI

`.github/workflows/ci.yml`：`lint` / `typecheck`（web-react）/ `build` / `test`（四包）/ `visual`（VRT）五个 job。
`visual` 环境必须与 `update-screenshots.yml` 严格同构（runner / playwright / CJK 字体）。

## 代码审查

### PR 流程

1. 创建 PR → 自动运行 CI（Lint + Typecheck + Build + Test + Visual）
2. 至少 1 人 Approve（AI 辅助先进行自动化 Code Review）
3. 所有 CI 检查通过
4. Create a Merge Commit 到 `main`

### 审查清单

- [ ] 代码逻辑正确，覆盖边界情况
- [ ] 测试充分（新功能有测试、改动无回归）
- [ ] 遵循代码规范（`bun run lint:check` 无 error/warning）
- [ ] 无硬编码、无 `any`、无未使用 import、无硬编码颜色/URL/凭据
- [ ] 行为符合 `docs/Specification.md`（URL 驱动状态 / 分页协议 / 渲染模型）
- [ ] UI 变更附带截图/录屏，且考虑移动端与 `.dark`
- [ ] 相关文档已更新（Specification / API / INDEX 导航 / 开发日志）
- [ ] API 变更同步更新 `docs/API_DOCUMENTATION.md`
- [ ] 新 Bug 模式已按 `docs/postmortem/TEMPLATE.md` 沉淀

### Merge 策略

- **Create a Merge Commit** — 保留 PR 内每个原子 commit，PR 在历史中可追溯
- 各 commit message 沿用 Conventional Commits 格式

## AI 协作开发

本项目由 AI 主导开发，使用 `gh` CLI 进行 GitHub 全流程管理。

### gh CLI 常用操作

```bash
gh issue list --state open
gh pr list --state open
gh pr view 1
gh pr create --title "feat: xxx" --body "..."
gh pr checks 1
gh pr merge 1 --merge --delete-branch   # Create a Merge Commit
```

### AI Code Review 流程

1. **PR 创建后**，AI 自动执行 `gh pr diff <N>` / `gh pr view <N> --json title,body,files`
2. **AI 根据审查清单逐项检查**，在 PR 下添加 Review 评论
3. **检测项**：架构一致性（ADR）、命名规范（code-style）、测试覆盖、安全（凭据/环境变量）、边界情况、文档同步
4. **结论**：`--approve` / `--request-changes` / `--comment`

### PR 合并判断标准

- CI 全部通过（Lint + Typecheck + Build + Test + Visual）
- AI Code Review 通过，无未解决的 Review 评论
- Commit message 符合 Conventional Commits

## Issue 管理

- Bugs 用 **Bug Report** 模板
- 新功能用 **Feature Request** 模板
- 技术债/重构用 **tech-debt** 模板
- 所有 PR 关联对应 Issue（`Closes #123`）

## 文档纪律

- 功能行为变更 → 先更新 `docs/Specification.md` 再动代码
- API 变更 → 同步更新 `docs/API_DOCUMENTATION.md`
- 架构决策 → 记录到 `docs/planning/architecture.md` (ADR)
- 开发日志 → 按天记录到 `docs/development-log/`
- 踩坑 → 沉淀到 `docs/postmortem/`；审查 → `docs/reviews/`
- 阶段计划完成 → `git mv` 到 `docs/archive/`
- 文档入口见 `docs/INDEX.md`

## Git Hooks（lefthook）

`lefthook.yml` 由 `bun install` 时自动安装（postinstall）。

- `pre-commit`：ESLint autofix（staged files）
- `pre-push`：真实 gate — `lint:check + typecheck + test + build:client`

手动运行：`bunx lefthook run pre-push`
