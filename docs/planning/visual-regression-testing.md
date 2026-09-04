# 视觉回归测试方案（VRT, Visual Regression Testing）

> 状态: 实施中（2026-09-04 登记）
> 关联: `docs/postmortem/002-vitest-component-test-infra.md`（vitest projects 拆分纪律）、`docs/planning/roadmap-phase5.md`（Phase 5 视觉打磨成果即本方案要锁住的对象）

## 一、背景与目标

Phase 5 完成后，UI 的视觉表现（token 化配色、`.dark` 双主题、列表四态、卡片沉浸流式）没有自动化回归防护——现有 61 个 vitest 用例全部是行为/逻辑断言，不感知「看起来对不对」。改一个 token 或类名，只有肉眼能发现回归。

**目标**：为核心组件建立**组件级视觉回归测试**，双主题（light/dark）各留一组基线，进 CI 门禁；零外部服务依赖（不走 Chromatic 云端）。

**非目标（明确不做）**：

- 页面/路由级 E2E 截图（无限滚动、灯箱、View Transitions）——二期，需 Playwright 独立工程 + mock API
- Storybook stories 直接驱动视觉测试——官方不支持（见下）
- 视频媒体、无限动画组件的截图

## 二、选型结论与事实依据

| 事实 | 依据 |
|---|---|
| Vitest 4 browser mode 内置 `toMatchScreenshot()` 断言，官方支持视觉回归 | [Vitest VRT 指南](https://main.vitest.dev/guide/browser/visual-regression-testing) |
| Storybook vitest addon **不支持** `toMatchScreenshot`（`Invalid Chai property`），官方无路线图，视觉测试仍指向 Chromatic | [storybookjs/storybook#32930](https://github.com/storybookjs/storybook/discussions/32930)（2025-12 确认） |
| `@chromatic-com/storybook` + `chromatic` CLI 已在仓库，但需外部账号/token | `.storybook/main.ts`、`bun.lock` |

**结论**：走自托管路线——新增 vitest `vrt` project（Playwright Chromium headless + `toMatchScreenshot`）。Storybook 保持「组件工作台 + fixture 数据源」角色，不进测试链路。若日后需要 PR 内可视化 diff 审阅，可再叠加 Chromatic（两者不冲突）。

## 三、架构设计

### 3.1 vitest project 拆分（遵守 postmortem 002 纪律）

`apps/web-react/vitest.config.ts` 新增第三个 project：

| project | 环境 | include | 说明 |
|---|---|---|---|
| `unit` | jsdom | 既有（**排除 `**/*.vrt.test.tsx`**） | `*.vrt.test.tsx` 会被 `app/components/**/*.test.tsx` 误匹配，必须显式排除 |
| `stories` | jsdom | storybookTest 插件接管 | 不动 |
| `vrt` | browser(chromium, headless) | `app/**/*.vrt.test.tsx` | **不带 storybookTest 插件**；viewport 固定 1280×720 |

**跑完必须核对 Test Files 数量**（002 铁律）：预期 unit 9 + stories 2 + vrt 3。

- 脚本：`test` 收窄为 `--project unit --project stories`（避免 `bun test` 意外拉起浏览器、CI test job 依赖膨胀）；新增 `test:visual` = `vitest run --project vrt`。
- 容差：`browser.expect.toMatchScreenshot.comparatorOptions.allowedMismatchedPixelRatio = 0.01`（1% 像素容差，抗亚像素噪声；文本密集组件可按需单独放宽）。

**实施中确认的两个非显而易见配置项**（均已写入 vitest.config.ts 注释）：

1. `browser.enabled: true` 必须显式设置——v4 里 browser 配置默认 disabled，不打开只会落到 forks pool 并报 `vitest/browser can be imported only inside the Browser Mode`（官方 VRT 指南的项目示例省略了这一项）
2. vrt project 需要 `define: { 'import.meta.env.VITE_API_URL': ... }`——`packages/shared/constant.ts` 的 `?? process.env.API_URL` 兜底在浏览器 iframe 里没有 `process`，会 ReferenceError；与 app 的 vite.config.ts 同源解法（注入后短路）
3. vrt project 必须挂 `@tailwindcss/vite` 插件——否则 `@import 'tailwindcss'` 不会被处理，截图是无样式白板（stories 冒烟测试只验「渲染不炸」所以从未暴露）

### 3.2 确定性策略（零网络、零随机）

视觉截图的敌人是不确定输入，全部在 fixture 层消除：

1. **图片全部用内联 SVG data URL**（头像/banner/媒体），不请求 pbs.twimg.com——离线可跑、CI 不受网络抖动影响、内容永不漂移。
2. **mock `~/components/react-tweet/utils` 的 `getMediaUrl`**（仅媒体用例的测试文件内）：它会按 twimg 规则重写 URL（剥扩展名 + 加 `?format=&name=`），data URL 会被改坏；mock 为原样返回。
3. **动画**：Playwright provider 截图时自动 `animations: 'disabled'`（`animate-spin`/`animate-in fade-in` 冻结在自然终态），无需额外注入 CSS。
4. **双主题**：`@custom-variant dark (&:is(.dark *))` 是后代选择器，测试内对 `document.documentElement` 切换 `.dark` 类（与真实 app 行为一致：token 从 html 继承）。
5. 组件截图定位用 `page.getByTestId('vrt-target')`（渲染时包裹），只截组件本体不截整页。

### 3.3 覆盖对象（第一期：核心组件 × 双主题）

| 组件 | 用例 | 基线数（×2 主题） |
|---|---|---|
| `FeedStatus`（5C-1 四态统一组件） | 空态 / 全页错误态 / 尾部加载中 / 尾部加载失败 / 尾部已全部加载 | 10 |
| `MyTweet`（推文卡片） | 纯文本 / 双图媒体网格 / 引用推 | 6 |
| `ProfileHeader`（5A-3 独立容器） | 完整用户资料（banner+头像+bio+meta+计数+认证标） | 2 |

共 18 条基线，全部落在测试文件旁的 `__screenshots__/` 目录，**提交进仓库**。

## 四、基线管理（CI-only 生成）

**铁律**：基线文件名含平台后缀（`*-chromium-linux.png` / `*-chromium-win32.png`），本地 Windows 生成的基线对 CI 无效（CJK 字体栈是系统字体，平台间渲染必然不同）。因此：

- 基线**只能在 CI（ubuntu）生成/更新**，本地跑 `test:visual` 仅作参考（win32 基线不提交）
- `.gitignore` 加规则忽略 `__screenshots__/**/*-win32.png`，防止误提交
- 本地故意改 UI 后：**不要**本地 `--update` 提交；走 §五 的 update workflow

### 播种流程（首次落地，CI 不红）

1. PR 分支合入 vrt 测试 + workflow（此时仓库还没有任何 linux 基线，`test:visual` 会因「无基线」而失败）
2. 给该 PR 打 **`update-screenshots` label** → 触发 update workflow（`pull_request` + label 触发，规避 workflow_dispatch 需先上 main 的限制）→ 在 ubuntu 上 `vitest --project vrt --update` 生成基线并由 bot commit 回 PR 分支
3. CI 重跑 → `test:visual` 对着新基线比对 → 绿 → 合并

### 日常更新流程（故意改 UI 后）

同一机制：PR 打 `update-screenshots` label → bot 在 CI 环境重生成基线并 commit → 人眼核对 diff 图（PR commit 里可直接看 PNG 变化）→ 确认后合并。workflow 只监听 `labeled` 事件（不监听 push），再次更新需**移除后重打 label**，或用 workflow_dispatch 指定分支。

> 注意：GITHUB_TOKEN 的 push 不会触发新 workflow run（GitHub 防递归机制），所以 bot 提交基线后 PR checks 不会自动重跑——需要手动 re-run 或置信合并。update workflow 内置了「重生成后立即用新基线 verify 一遍」的步骤，同环境自证通过才会 push。

## 五、CI 接入

1. `ci.yml` 新增独立 **`visual` job**（不塞进现有 test job）：checkout → bun install → `bunx playwright install --with-deps --only-shell` → `apt-get install -y fonts-noto-cjk`（否则 CJK 文本在 ubuntu 渲染为豆腐块；基线与比对同环境则一致，但真字形才有意义）→ `working-directory: apps/web-react` + `bun run test:visual`（**不能写 `bun --cwd X run <script>`：该形式无效——打 usage 且 exit 0 假绿**，CI 门禁会静默空转；隐式 `bun --cwd X <script>` 或 working-directory 才有效，详见 postmortem 004）
2. 新建 `.github/workflows/update-screenshots.yml`：双触发（`workflow_dispatch` + `pull_request` labeled `update-screenshots`），ubuntu 上 `--update` 后 commit 回分支，附 PR summary（参照 Vitest 官方模板裁剪）

## 六、维护守则

- 新增可复用组件/视觉改版 → 先加 `*.vrt.test.tsx` 用例再改样式（测试先行的视觉版）
- 回归判断：vrt 红 + unit 绿 = 纯视觉回归；vrt 红 + unit 红 = 行为也坏了，先修行为
- 阈值只在噪声证明过大时放宽（`allowedMismatchedPixelRatio`），默认 0.01
- 删除/重命名测试后手动清理 `__screenshots__` 陈旧基线（vitest 不自动删）
- Storybook story 改动**不需要**动 vrt（两者独立）；story 是人工工作台，vrt 是机器门禁

## 七、已知限制

- **平台字体差异**：`--font-sans` 是系统栈 + Noto CJK 回退，win32/linux 字形不同 → 本地 vrt 结果仅供开发参考，门禁以 CI 为准
- **首期不做**：移动端 viewport（390×844）第二组基线、页面级 E2E、视频/灯箱交互——视首期运行成本再决定
- **基线是二进制**：18 张 PNG 体积可控（每张 tens-of-KB），若未来超百张再考虑 Git LFS（官方建议）

## 八、验收标准

- [x] `bun --cwd apps/web-react run test:visual` 本地跑通（chromium headless，18 用例 4.7s 全绿；像素级程序化核验：light 背景 = `#f5f9fb` 精确命中 token、dark 近黑、fixture 图正确渲染、dark/light 基线哈希不同）
- [x] `bun --cwd apps/web-react test`（unit+stories）数量不变：11 files / 61 用例，vrt 文件未被误吞；13 项失败与既有基线完全一致（zustand persist localStorage 环境问题，pre-existing，见 2026-09-04 日志）
- [x] 本地 `bun lint` + typecheck 绿
- [x] CI `visual` job 绿（基线播种后，V6）
- [x] update-screenshots workflow 可用（label 触发 + 手动触发，V6 验证：run 33851429906 真实重生成 18 基线 → 同环境 verify 18 passed → bot commit cb6acef 回分支）

## 九、commit 规划（原子提交，先于代码备案）

1. `docs(plan): add visual regression testing plan` — 本文档 + action-plan 登记
2. `build(web): set up vitest browser mode vrt project` — devDeps（@vitest/browser、@vitest/browser-playwright、playwright）+ vitest.config vrt project + 脚本 + .gitignore
3. `test(web): add visual regression tests for core components` — vrt helpers/fixtures + 3 个 `*.vrt.test.tsx`
4. `ci: gate visual regressions and add screenshot update workflow` — ci.yml visual job + update-screenshots.yml
5. （实施后）`docs: record VRT implementation` — 开发日志当日段落
