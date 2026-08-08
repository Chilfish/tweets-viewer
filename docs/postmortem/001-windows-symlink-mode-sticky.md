# 001-windows-symlink-mode-sticky

## 摘要

Windows（`core.symlinks=false`）下把符号链接文件改回普通文件后，git index 仍保留 `120000`（symlink）mode，导致 commit 记录的文件类型与工作区不一致。

## 影响

- 范围：CLAUDE.md 从符号链接迁移为普通文件的提交（`docs: replace AGENTS.md symlink with real CLAUDE.md`）
- 代价：首次提交 mode 错误，需 amend 修正；若不修正，检出到其他平台时 CLAUDE.md 会变成指向不存在的 `AGENTS.md` 的软链（内容丢失）

## 时间线

- 删除 `CLAUDE.md`（符号链接）→ 新建普通文件 → `git add -A AGENTS.md CLAUDE.md` → commit
- 提交后 `git ls-files -s CLAUDE.md` 仍显示 `120000`，HEAD 中 mode 也为 symlink
- `git rm --cached CLAUDE.md && git add CLAUDE.md` → mode 变为 `100644` → amend 修正

## 根因

- 直接原因：`core.symlinks=false` 时 git 对已跟踪的 symlink 路径，仅靠 `git add` 不会重算 mode
- 系统条件（什么让它可以发生）：Windows 文件系统无原生 symlink 语义，git 用该开关模拟；mode 是 index 中独立存储的位，`git add` 对内容变化不会覆盖它
- 根因归类：`工具反馈滞后` / `API 契约未核实`

## 行动项

- [x] 修正方式沉淀：符号链接 → 普通文件迁移必须 `git rm --cached <file> && git add <file>`，再 amend（未推送时）
- [ ] 若以后再做 symlink 迁移，提交后先 `git ls-files -s` 核对 mode，再走下一步

## 复盘

- 新规则：**Windows 下把已跟踪符号链接改为普通文件后，必须显式刷新 index mode 并验证**——已列入下方「高频雷区」2. 流程
