# 贡献指南

欢迎贡献到 Tweets Viewer！本项目是个人归档阅读器，但遵循清晰的工程纪律。

## 开发环境

- [Bun 1.3+](https://bun.sh)（packageManager：`bun@1.3.14`）
- `bun install` 安装依赖
- `bun dev` 本地开发（server + client 同时启动）

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

- Type：`feat` / `fix` / `refactor` / `docs` / `style` / `chore` / `test`
- Scope：`web` / `server` / `scripts` / `db` / `shared` / `docs` / `build`
- 一个 commit 一个关注点，diff >10 文件或 >200 行时主动拆分

## 开发流程

1. 从 `main` 创建分支（`feat/*` / `fix/*` / `refactor/*`）
2. **文档先行**：先更新相关文档（开发日志 / action-plan / 方案），再写代码
3. **规格驱动**：功能行为变更先更新 `docs/Specification.md`
4. 写码前先读 [docs/postmortem/README.md](docs/postmortem/README.md) 对照高频雷区
5. 提交前跑 `bun lint` + 各包测试，确认绿
6. 开 PR → CI 通过 → Merge Commit 合并

## 代码规范

详见 [docs/engineering/code-style.md](docs/engineering/code-style.md)。

## 文档

完整文档索引见 [docs/README.md](docs/README.md)。

## 分支模型

Trunk-Based Development（简化版）：`main` 始终可发布，短命分支合并后删除。
