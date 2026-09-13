# 代码审查记录（Reviews）

**项目**: Tweets Viewer

> 代码审查（含 Apple 视角产品/工程锐评、AI 辅助审查）的记录区。每次**里程碑 / 阶段 / 工作流完成**后做一次 review，把问题沉淀到带日期的审查记录，避免同一类问题反复出现。

## 约定

- 文件名：`review-YYYY-MM-DD-<主题>.md`（如 `review-2026-08-09-apple-r2.md`）
- 每条问题带编号前缀（如 `P0/P1/P2`），标注文件与建议修法
- 审查视角可含：产品定位、UI/UX、架构一致性、性能、SSR 安全、数据边界
- 已修问题在原记录中勾选并注明 commit；同类问题升级为 postmortem 或同步到「高频雷区」

## 审查清单（写码/审查时逐项过）

- [ ] 遵循 `../engineering/code-style.md`（catch unknown、无 any、纯函数下沉、四态覆盖）
- [ ] 行为符合 `../Specification.md`（URL 驱动状态、分页协议、渲染模型）
- [ ] 纯函数 / 新逻辑有 Vitest 测试（test-first）
- [ ] 无硬编码（颜色/URL/API 基址/凭据）
- [ ] 移动端（<768px）+ `.dark` 模式行为已考虑
- [ ] 相关文档已更新（Specification / API / INDEX 导航 / 本日开发日志）
- [ ] 新 Bug 模式已写 postmortem

## 索引

| 日期 | 主题 | 主要问题 | 去向 |
| --- | --- | --- | --- |
| 2026-08-09 | [Apple 视角锐评与处置](../planning/review-r2-action.md) | P0 架构一致性 ×4 / P1 产品表达 ×3 / P2 技术债 ×3 | 处置完成，续篇 `planning/roadmap.md`（Phase 4） |
