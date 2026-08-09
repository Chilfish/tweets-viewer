# 002-vitest-component-test-infra

## 摘要

给 web 加组件测试时，Storybook addon-vitest 接入与 vitest 多项目配置踩了 5 个非显而易见的坑，测试反复红。

## 影响

- 范围：`apps/web-react` 测试基础设施（P2-3 补 web UI 测试）
- 代价：约 5 轮配置迭代才全绿；期间 6 个 story 测试掩盖了逻辑测试被静默吞掉的问题

## 时间线

1. 单 config 里 `plugins: [storybookTest()]` → 启动即报 `Missing "./plugin" specifier`：v10 插件入口不是 `/plugin` 而是 `/vitest-plugin`
2. 换入口后 story 测试跑起来了，但 `test.include` 被插件**静默忽略** → store/lib 的 19 个逻辑测试根本没跑，只剩 6 个 story 测试
3. 拆 vitest projects：Vitest 4 用 `test.projects`（不是旧文档的 `defineWorkspace`）
4. 拆完 project 后组件测试报 `Failed to resolve import "~/"`：子项目不继承 root `resolve.tsconfigPaths`，需每个 project 显式加
5. 组件测试连报「Found multiple elements」：@testing-library/react 自动 cleanup 依赖全局 `afterEach`，vitest 关 globals 时不生效 → DOM 跨用例泄漏
6. typecheck 报 `coverage` 不在 `ProjectConfig`：coverage 是根级选项，不能放子项目

## 根因

- 直接原因：Storybook addon-vitest 插件会覆盖 `test.include`（启动警告里有，但被忽略）；Vitest 4 多项目 API 与旧文档不同
- 系统条件（什么让它可以发生）：`test.include` 被吞时**没有任何报错**，19 个逻辑测试静默消失，靠 6 个 story 测试"全绿"制造了假安全感
- 根因归类：`工具反馈滞后`（插件吞 include 无报错、启动 warning 不醒目）

## 行动项

- [x] 防止复发：vitest 配置拆 `unit` + `stories` 两个 project；`resolve.tsconfigPaths` 与 setup 按 project 显式配置；组件测试 setup 里显式 `afterEach(cleanup)`（见 `app/test/setup.ts`）
- [x] 已列入 CLAUDE.md 强制规范？否（已写入开发日志与 review-r2-action P2-3 段；如需可提升到 postmortem 高频雷区）
- [x] 后续跑 `bun --cwd apps/web-react test` 后必须核对 **Test Files 数量**，不能只看 Tests 总数（曾 7 文件但逻辑测试被吞）

## 复盘

- 新规则：接入会接管 include 的测试插件（storybookTest）时，**必须用 vitest projects 拆分**，且跑完核对 Test Files 数量防静默吞测试
- 已归入本 postmortem；高频雷区 §3「前端」补充一条：vitest 子项目不继承 tsconfig paths / coverage 仅根级 / RTL cleanup 需显式注册