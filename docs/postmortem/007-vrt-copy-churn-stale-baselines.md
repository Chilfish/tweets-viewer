# 007-vrt-copy-churn-stale-baselines

## 摘要

文案重构修改了 `FeedStatus` 的错误态文案与按钮，但没有重生成 VRT 基线 → `visual` job 在 main 上变红。同一个改动在 dark 主题下差 2% 被拦、light 主题下不到 1% 被放过，说明「用像素测文案」的门禁本身就不可靠。

## 影响

- 范围：`main` 的 `visual` job（2026-10-28 上游一次、2026-10-31 rebase 后一次，失败截图与像素数完全相同）
- 代价：两次 CI 红；每次都需要人工排查「是文案漂移还是真回归」；基线更新依赖 CI-only 的 label 流程，容易在改文案时漏掉

## 时间线

1. `a534839 refactor(copy)` 把错误态从「网络开小差了，请稍后重试。／重新加载」改成「请检查网络后重试。／重试」
2. `e5f5f6b` 的 CI（run 40631387559）首次红：`dark full-page-error` 差 2375 px、`dark tail-error` 差 972 px
3. 2026-10-31 rebase 后新一轮 CI（run 41222979013）以**完全相同的像素数**再次红，确认不是环境漂移
4. 本地复现：只有 dark 两张失败，light 同名用例通过
5. 对照基线图确认根因是文案停更；随后用 mask 改造 `FeedStatus` VRT

## 根因

- 直接原因：UI 文案改动后没有重生成 linux 基线
- 系统条件：
  1. 像素基线把「UI 文案」也纳入比对——文案是内容，改动频繁且不是视觉回归
  2. 基线只能在 CI 生成，更新走 PR label 手动流程；改文案的人没有理由知道要触发它
  3. `allowedMismatchedPixelRatio: 0.01` 与文本像素量级接近，导致同一个改动有时红、有时绿，门禁信号不稳定
  4. `runs-on: ubuntu-latest` 未固定，未来 runner 升级会静默改变字形渲染
- 根因归类：`流程缺失` + `设计建模`（把内容当视觉来测）

## 行动项

- [x] 防止复发：`FeedStatus` VRT 用 `screenshotOptions.mask` 遮掉 `p` / `button` / `[data-vrt-mask]`，文案改由 `feed-status.test.tsx`（RTL）断言
- [x] 防止复发：宽度随文案变化的按钮行用 `[data-vrt-mask]` 包成整宽行，避免遮罩框随文案长短漂移
- [x] 防止复发：`ci.yml` visual job 与 `update-screenshots.yml` 固定 `ubuntu-24.04` + `bun-version-file: package.json`，两个 workflow 必须同步改
- [x] 防止复发：`docs/planning/visual-regression-testing.md` 记录 mask 策略与环境固定规则
- [ ] 用 `update-screenshots` workflow 重生成 linux 基线（本次修复的收尾步骤）
- [ ] 已列入 AGENTS.md 强制规范？否（属于测试编写细则，postmortem + 方案文档覆盖）

## 复盘

- 新规则：**像素门禁不测文案**。视觉回归只守布局、间距、配色、图标；文案/可访问性交给 RTL/DOM 断言。改文案时无需动基线，减少一类必然发生的误报。
- 新规则：**mask 的目标元素必须尺寸稳定**。直接遮自适应宽度的按钮仍会因文案长短产生差异，要用整宽容器包住再遮。
- 新规则：**门禁与基线生成环境必须固定版本**。`ubuntu-latest` / `bun-version: latest` 这类浮动标签会在某次升级后让整套基线静默失配。
