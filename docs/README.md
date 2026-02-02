# Tweets Viewer Documentation Index

> **🚨 AI 指令 (AI Agent Instructions)**:
> 在进行任何代码生成、架构设计或逻辑重构之前，请务必阅读以下文档。
>
> 1. 首先阅读 [SKILLS/README.md](./SKILLS/README.md) 获取开发规范。
> 2. 其次阅读 [Specification.md](./Specification.md) 了解业务逻辑。

## 核心文档汇总

### 1. [开发规范 (AI Skills)](./SKILLS/README.md)

包含项目的“架构九条宪法”、技术栈约束（Zustand, Jotai, Tailwind等）以及 SDD (规格驱动开发) 的核心原则。**这是 AI 编写代码的首要参考标准。**

### 2. [功能规格说明书 (Functional Specification)](./Specification.md)

定义了系统的逻辑行为、领域模型（Tweet Stream, User Context）、路由协议以及功能规格。这是系统行为的**事实来源 (Source of Truth)**。

### 3. [状态管理规范](./SKILLS/zustand-state-management.md)

详细说明了如何使用 Zustand 进行全局状态管理，以及状态切片的最佳实践。

### 4. [设计系统与交互](./ui-design/OVERVIEW.md)

涵盖了 UI 布局策略 (Sticky Glass Layout)、加载反馈机制以及组件设计指南。

---

## 快速导航

- **架构准则**: 强制单一职责 (SRP)、重构优先、禁止过度设计。
- **技术栈**: Bun, React, Zustand, Jotai, Tailwind CSS, shadcn/ui.
- **逻辑核心**: 服务端驱动分页、混合导航模式（无限滚动 + 离线页码）。
