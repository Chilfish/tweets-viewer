# 004-bun-cwd-run-false-green

## 摘要

CI 里用 `bun --cwd <pkg> run <script>` 调用脚本是不有效语法——bun 打印 usage 帮助且 **exit 0**，步骤显示 ✓ 绿色但什么都没执行；VRT 的 visual 门禁与基线播种 workflow 双双静默空转。

## 影响

- 范围：`ci.yml` 的 `visual` job（门禁空转 = 假绿）与 `update-screenshots.yml` 的 regenerate/verify 两个步骤（基线从未生成、verify 从未执行）；PR #7 上所有 ✓ 均为假象
- 代价：两轮无效 CI（第一轮还叠加了 git pathspec `**` 不匹配问题），基线播种流程返工两轮；最坏后果是被避免掉的——若未发现，合入后 main 的 visual 门禁将永久形同虚设

## 时间线

1. PR #7 打 `update-screenshots` label → 首轮播种：`git add -- 'app/**/__screenshots__'` 报 `did not match any files`（exit 128）失败——但 regenerate/verify 两步已经"绿"了（当时未意识到是假绿）
2. 修复 pathspec（宽路径 `git add -A -- apps/web-react/app`）并重推、重打 label → 第二轮：全步骤 ✓，但 bot 报「No screenshot updates required」提前退出——与"regenerate 成功"矛盾，暴露异常
3. 拉 step 日志：regenerate/verify 的输出是 **bun 的 usage 帮助文本**，本地复现 `bun --cwd apps/web-react run test:visual` 同样打 usage；而 `bun --cwd X <script>`（隐式 run，仓库 CI test job 一直在用）与 `working-directory + bun run <script>` 均正常
4. 全量排查 workflows 中所有 bun 调用形式，三处同款写法全部修正

## 根因

- 直接原因：`bun --cwd <dir> run <script>` 不是有效语法，bun 打印 usage 后以 exit 0 结束（而不是非零），CI 的 `bash -e` 视其为成功
- 系统条件：① bun 对无效 `run` 调用返回 0（工具把"用法错误"当成功）；② CI 步骤没有对"输出包含真实测试结果"做任何断言，✤ 状态完全信任退出码；③ 本地验证时用的是 workdir + `bun run` 的正确形式，写 workflow 时凭语感改成了 `--cwd ... run` 形式，两种形式未做等价性核对
- 根因归类：`工具反馈滞后`（exit 0 的 usage 输出掩盖了未执行）+ `API 契约未核实`（bun CLI 语法凭直觉写，未实测 CI 形态）

## 行动项

- [x] 防止复发：三处调用全部改为 `working-directory: <pkg>` + `bun run <script>`（本地实测过的形式）；workflow 内注释写明禁用形式
- [x] 防止复发：postmortem README「高频雷区 §3 流程」加一条规则（见下）
- [ ] 已列入 CLAUDE.md 强制规范？否（属于 CI 编写细则，雷区 + workflow 注释覆盖足够）

## 复盘

- 新规则：**workflow 里调用 bun 脚本只用两种实证形式**——`bun --cwd <pkg> <script>`（隐式 run，现有 test job 同款）或 `working-directory:` + `bun run <script>`；禁止 `bun --cwd <pkg> run <script>`。任何 CI 步骤的"绿"都必须在日志里看到真实产物（测试的 Test Files 统计、构建产物路径），不能只信退出码——尤其 bun 这类会以 exit 0 打 usage 的工具
- 已归入「高频雷区」§3
