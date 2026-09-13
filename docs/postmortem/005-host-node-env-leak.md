# 005-宿主 NODE_ENV 泄漏

## 摘要

宿主 shell 全局设了 `NODE_ENV=production` 时，Vitest 会把 production 环境带进测试：React 因此加载 production 构建（不导出 `React.act`），web-react 全部 22 个组件测试瞬间变红；dev server 同理会以生产模式启动。更深一层，脚本里写 `NODE_ENV=test vitest` 在这套环境（Bun shell / Windows）**根本不生效**，看似修了实际没修。

## 影响

- 范围：`apps/web-react` 组件测试（home/Tweet/TweetAction/year-navigator）全部失败；本地门禁不可信
- 代价：排查 React 版本、`@testing-library/react` 适配等多条错误方向；若不修，pre-push 门禁会长期假红（或迫使 `--no-verify`）

## 时间线

- 首次运行 `bun --cwd apps/web-react test` → 22 个组件用例 `TypeError: React.act is not a function`
- 一度误以为 `@vitest/browser-playwright` 缺失（确实也没装，`bun install` 补齐），补齐后组件用例仍全红
- 探针确认：worker 内 `NODE_ENV=production`、`typeof React.act=undefined`
- 用 `NODE_ENV=test node -e ...` 验证 Bun 脚本内联赋值不传播 → 改用 `cross-env`
- 探针复查 `NODE_ENV=test`、`React.act=function` → 66/66 通过

## 根因

- 直接原因：脚本未固定 `NODE_ENV`，继承了宿主环境变量
- 系统条件：Bun 的脚本执行不把 `VAR=value cmd` 的赋值传给子进程（与本机 Windows/ Bun 版本组合有关），
  因此「看起来像修法」的内联赋值是**无声无效**的——没有报错，只是没生效
- 根因归类：`工具反馈滞后` + `环境耦合`

## 行动项

- [x] 引入 `cross-env`，各包 `test` / `dev` / `build` 脚本固定 `NODE_ENV`（web-react / server / database / shared）
- [x] `CLAUDE.md` 强制规范与 `docs/engineering/code-style.md` 记录该约束
- [x] 探针法验证：修完后确认 worker 内 `NODE_ENV=test`、`React.act` 存在
- [x] 已列入 CLAUDE.md 强制规范？是

## 复盘

- 沉淀规则（高频雷区）：「构建/测试脚本的 `NODE_ENV` 一律 `cross-env`，禁止依赖宿主环境；改完必须用探针确认真实值，不能只看退出码」
- 与参考项目 postmortem 011（dev server 在 `NODE_ENV=production` 下崩溃）同源，本仓库这次同时命中测试侧
