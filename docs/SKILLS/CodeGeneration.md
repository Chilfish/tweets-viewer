# SKILL: High-Assurance Code Generation

**Version:** 1.0.0
**Type:** Core Engineering Constraint
**Context:** Professional Software Development
**Objective:** Enforce strict adherence to engineering best practices, ensuring all generated code is production-ready, maintainable, and devoid of technical debt.

## 1. 核心哲学 (Core Philosophy)

在执行代码生成任务时，必须始终贯彻以下工程原则：

- **防御性编程 (Defensive Programming):** 假设输入总是不可靠的，外部系统总是会失败的。代码必须显式处理边界情况，而非依赖隐式行为。
- **正交性 (Orthogonality):** 模块之间应保持低耦合。修改系统的某一部分不应导致不相关的部分出现副作用。
- **认知负荷最小化 (Cognitive Load Reduction):** 代码不仅是给机器执行的，更是给人阅读的。优先选择清晰（Clarity）而非其仅仅是简洁（Brevity）。
- **渐进式披露 (Progressive Disclosure):** 遵循 Skills 的设计理念，仅在必要时引入复杂性。从最小可行实现（MVP）开始，逐步增加抽象层级，避免过度设计（YAGNI）。

## 2. 宪法性约束 (The Constitution of Code)

以下条款为不可逾越的硬性约束，任何生成的代码必须满足这些条件：

### 2.1 类型安全与空值处理 (Type Safety & Null Safety)

- **严禁 `Any` 类型:** 在强类型语言（如 TypeScript, Rust, Go, C#）中，禁止使用 `any` 或类似逃逸机制。必须定义明确的接口（Interfaces）或类型别名。
- **显式空值控制:** 所有可能为空的变量必须在类型系统中显式声明（例如 `Optional<T>`, `T | null`）。必须在解引用前进行非空断言或守卫检查。
- **数据契约:** 跨边界（API 调用、数据库读取）的数据交互，必须包含运行时验证（如 Zod, Pydantic），不能仅依赖编译时类型检查。

### 2.2 错误处理模型 (Error Handling Model)

- **结果导向 (Result Pattern):** 对于预期的业务错误（Business Logic Errors），优先使用 Result/Either 模式返回错误对象，而非抛出异常（Exceptions）。异常仅用于不可恢复的系统级崩溃。
- **无声失败禁止 (No Silent Failures):** 所有的 catch 块必须包含日志记录或重新抛出机制，严禁吞掉错误（Swallowing errors）。
- **上下文错误信息:** 错误消息必须包含操作上下文（Context）和导致错误的参数快照，便于调试。

### 2.3 模块化与函数原子性 (Modularity & Atomicity)

- **单一职责原则 (SRP):** 一个函数只做一件事。如果一个函数的逻辑分支（Cyclomatic Complexity）超过 10，必须进行拆分。
- **纯函数优先 (Pure Functions):** 尽可能将核心逻辑与副作用（I/O 操作）分离。核心逻辑应为纯函数，易于单元测试。
- **参数限制:** 单个函数的参数数量不应超过 3 个。如果需要更多，必须重构为配置对象（Configuration Object）或参数对象模式。

### 2.4 状态管理 (State Management)

- **不可变性 (Immutability):** 默认情况下，数据结构应视为不可变。修改状态应通过返回新对象而非修改引用来实现（尤其在 React, Redux, Functional Programming 场景中）。
- **单一事实来源 (Single Source of Truth):** 避免状态冗余。派生数据（Derived Data）应通过计算获取，而非独立存储。

## 3. 最佳实践实施指南 (Implementation Guidelines)

基于 Skills 的动态加载特性，针对不同场景加载特定的最佳实践：

### 3.1 代码风格与结构 (Style & Structure)

- **命名规范:**
  - **变量/属性:** 名词，精准描述内容（如 `userProfile` 而非 `data`）。
  - **函数/方法:** 动词+名词（如 `fetchUserData` 而非 `userData`）。
  - **布尔值:** Is/Has/Can 前缀（如 `isVisible`）。
- **文件组织:** 遵循“高内聚”原则。相关的组件、样式、测试和工具函数应物理临近（Colocation）。

### 3.2 依赖管理 (Dependency Management)

- **依赖倒置 (DIP):** 高层模块不应依赖低层模块，二者都应依赖抽象。在代码生成中，优先定义接口，再编写实现。
- **第三方库审慎引入:** 仅在标准库无法满足需求且实现成本过高时引入第三方依赖。引入时需评估其维护状态与体积。

### 3.3 文档与注释 (Documentation & Comments)

- **自文档化代码:** 代码本身应当足够清晰，注释仅用于解释“为什么”（Why）这样做，而不是“在做什么”（What）。
- **公共 API 文档:** 所有公开导出的接口和函数必须包含 JSDoc/Docstring，说明参数约束、返回值及可能抛出的异常。

### 3.4 安全性 (Security Constraints)

- **零信任输入:** 所有外部输入（用户输入、URL 参数、文件内容）必须经过清洗（Sanitization）和验证（Validation）。
- **凭证隔离:** 严禁在代码中硬编码密钥（Secrets）。必须通过环境变量或密钥管理服务注入。

## 4. 验证与测试策略 (Validation Strategy)

生成的代码必须具备可测试性：

1.  **单元测试就绪:** 生成的函数应易于 Mock 外部依赖。
2.  **边缘情况覆盖:** 在编写逻辑时，必须主动思考并注释出潜在的边缘情况（Edge Cases），如空列表、极大数值、网络超时等。
3.  **静态分析合规:** 代码应能通过标准 Linter（ESLint, Pylint, Clippy）的严格模式检查。

## 5. 工作流指令 (Workflow Instructions for AI)

当作为 AI 执行代码生成任务时，请遵循以下步骤：

1.  **Context Retrieval (上下文获取):** 在编写任何代码前，先分析现有的项目结构和依赖版本，确保新代码与现有架构兼容。
2.  **Design First (设计优先):** 对于复杂功能，先在思维链（Chain of Thought）中构建伪代码或接口定义。
3.  **Implementation (实现):** 根据上述宪法编写代码，严格遵守类型安全和错误处理。
4.  **Review (自查):** 生成代码后，自我审查是否违反了 SRP、DRY (Don't Repeat Yourself) 或安全性原则。
