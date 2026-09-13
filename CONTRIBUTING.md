# 贡献指南

欢迎贡献到 Tweets Viewer！本项目是个人归档阅读器，但遵循清晰的工程纪律。

## 开发环境

- [Bun 1.3+](https://bun.sh)（packageManager：`bun@1.3.14`）
- `bun install` 安装依赖
- `bun dev` 本地开发（server + client 同时启动）
- 数据库可选：前端只读依赖已有 Neon Postgres 归档；抓取入库才需要 `DATABASE_URL` / `TWEET_KEYS` / `INSTAGRAM_COOKIES`，见 [README 的配置一节](README.md#配置)

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

- Type：`feat` / `fix` / `refactor` / `docs` / `style` / `chore` / `test` / `perf`
- Scope：`web` / `server` / `scripts` / `db` / `shared` / `docs` / `build` / `deps`
- 一个 commit 一个关注点，diff >10 文件或 >200 行时主动拆分

## 开发流程

1. 从 `main` 创建分支（`feat/*` / `fix/*` / `refactor/*` / `docs/*` / `chore/*`）
2. **文档先行**：先更新相关文档（开发日志 / backlog / 方案），再写代码
3. **规格驱动**：功能行为变更先更新 [`docs/Specification.md`](docs/Specification.md)，API 变更同步 [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
4. 写码前先读 [`docs/postmortem/README.md`](docs/postmortem/README.md) 对照高频雷区
5. 新增纯函数 / 查询模块先写测试，再实现
6. 本地跑门禁，确认全绿：

   ```bash
   bun run lint:check
   bun run typecheck
   bun run test
   bun run build:client
   ```

7. 开 PR → CI 通过 → Create a Merge Commit 合并

> 门禁由 lefthook pre-push 兜底；**禁止 `--no-verify`** 绕过，红了就修。

## PR 检查项

- [ ] `bun run lint:check`、`bun run typecheck`、`bun run test`、`bun run build:client` 通过
- [ ] 新行为有对应测试（纯函数必须单测）
- [ ] 提交信息符合 Conventional Commits
- [ ] 无硬编码（颜色 / URL / 凭据）、无 `any`
- [ ] UI 变更已考虑移动端（<768px）与 `.dark` 模式，并附截图/录屏
- [ ] 文档已同步（Specification / API / 开发日志 / 相关 docs）
- [ ] 没有遗留冲突

## 代码规范

详见 [`docs/engineering/code-style.md`](docs/engineering/code-style.md)。

## 文档

完整文档入口见 [`docs/INDEX.md`](docs/INDEX.md)。

## 分支模型

Trunk-Based Development（简化版）：`main` 始终可发布，短命分支合并后删除。
