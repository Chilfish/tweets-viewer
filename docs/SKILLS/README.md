---
name: tweets-viewer-sdd
description: 基于规格驱动开发 (SDD) 原则的 React 代码生成约束。当需要为 tweets-viewer 项目生成或修改代码时使用此技能,确保代码质量、架构一致性和可维护性。
license: MIT
metadata:
  author: tweets-viewer
  version: "1.0.0"
  tech-stack: React, TypeScript, Zustand, Jotai, Tailwind CSS, shadcn/ui
  package-manager: bun
---

# Tweets Viewer - 规格驱动开发技能

## 核心理念

本技能基于规格驱动开发 (Spec-Driven Development, SDD) 的核心原则：**规格是事实来源,代码服务于规格**。在为 tweets-viewer 项目生成代码时,必须严格遵守架构约束,确保代码质量和一致性。

## 何时使用此技能

当你需要执行以下任务时,激活此技能：

- 为 tweets-viewer 项目生成新的 React 组件
- 修改现有代码以符合 SDD 原则
- 重构代码以提高可维护性
- 评审代码是否符合架构约束
- 创建或更新状态管理逻辑

## 技术栈约束

### 必须使用的技术

- **包管理器**: `bun`
- **UI 框架**: React 18+
- **类型系统**: TypeScript (严格模式)
- **样式方案**: Tailwind CSS + shadcn/ui 组件
- **全局状态**: Zustand
- **原子状态**: Jotai
- **本地状态**: React.useState (仅限单组件内部)

### 禁止使用的模式

- ❌ Prop Drilling (超过 2 层的 props 传递)
- ❌ 动态导入 (Dynamic Imports / lazy loading)
- ❌ Class 组件 (必须使用函数组件)
- ❌ 过度抽象 (不必要的 HOC, 复杂的泛型)
- ❌ Redux 或其他状态管理库

## 架构九条宪法

在生成任何代码前,必须通过以下九条架构关卡：

### 第一条：单一职责原则 (Mandatory SRP)

**每个组件、Hook、工具函数必须只做一件事**

- [ ] 组件是否只负责一个明确的 UI 职责？
- [ ] Hook 是否只封装一个特定的逻辑？
- [ ] 工具函数是否只执行一个明确的转换？

**反例**：

```tsx
// ❌ 违反 SRP - 组件同时处理数据获取、渲染、状态管理
function TweetCard({ id }) {
  const [data, setData] = useState(null)
  useEffect(() => { fetchTweet(id).then(setData) }, [id])
  const handleLike = () => { /* ... */ }
  return <div>{/* 复杂渲染逻辑 */}</div>
}
```

**正例**：

```tsx
// ✅ 符合 SRP - 职责分离
function useTweet(id: string) {
  return useQuery(['tweet', id], () => fetchTweet(id))
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  return <div>{/* 纯渲染逻辑 */}</div>
}
```

### 第二条：重构优先工作流 (Refactor-First Workflow)

**在新增功能前,必须先重构臃肿的代码**

- [ ] 目标文件是否超过 150 行？
- [ ] 是否存在逻辑混杂 (数据处理 + UI + 副作用)？
- [ ] 是否可以提取独立的 Hook 或工具函数？

**流程**：

1. 评估现有文件复杂度
2. 识别可拆分的逻辑单元
3. 提取为独立模块
4. 重新组合实现功能

### 第三条：精细化状态管理 (Granular State Management)

**状态管理必须遵循最小作用域原则**

| 状态类型     | 使用方案 | 示例                             |
| ------------ | -------- | -------------------------------- |
| 全局共享状态 | Zustand  | 用户认证、主题配置、全局 UI 状态 |
| 原子化状态   | Jotai    | 表单状态、临时筛选条件           |
| 本地状态     | useState | 单组件内的展开/折叠状态          |

- [ ] 是否避免了 Prop Drilling (超过 2 层)?
- [ ] 是否使用了最小作用域的状态方案?
- [ ] 全局状态是否真的需要全局访问?

**反例**：

```tsx
// ❌ 通过 props 层层传递
<Parent>
  <Middle user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Middle>
</Parent>
```

**正例**：

```tsx
// ✅ 使用 Zustand 全局状态
const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: user => set({ user }),
}))

function GrandChild() {
  const user = useUserStore(s => s.user)
  // 直接访问,无需 props 传递
}
```

### 第四条：禁止过度设计 (No Over-Engineering)

**拒绝不必要的抽象和提前优化**

- [ ] 是否有不必要的泛型？
- [ ] 是否有未使用的抽象层？
- [ ] 是否为"可能的未来需求"添加了代码？

**禁止的模式**：

```tsx
// ❌ 过度泛型化
interface BaseProps<T extends Record<string, any>> {
  data: T
  render: (item: T) => ReactNode
}

// ❌ 不必要的 HOC
function withLoading<P extends object>(Component: React.FC<P>) {
  return (props: P & { loading: boolean }) => {
    // ...
  }
}
```

**推荐的模式**：

```tsx
// ✅ 直接实现,无不必要抽象
function TweetList({ tweets }: { tweets: Tweet[] }) {
  if (!tweets.length)
    return <Empty />
  return tweets.map(tweet => <TweetCard key={tweet.id} tweet={tweet} />)
}
```

### 第五条：显式优于隐式 (Explicit Over Implicit)

**代码意图必须清晰可读**

- [ ] 变量名是否语义明确？
- [ ] 是否避免了魔法数字和魔法字符串？
- [ ] 类型是否显式声明？

```tsx
// ❌ 隐式、难以理解
const x = data.filter(d => d.s === 1).map(d => d.v)

// ✅ 显式、清晰
const activeTweets = tweets.filter(tweet => tweet.status === TweetStatus.Active)
const tweetContents = activeTweets.map(tweet => tweet.content)
```

### 第六条：组件组合原则 (Composition Over Inheritance)

**通过组合构建复杂 UI,禁止继承**

```tsx
// ✅ 组合模式
function TweetCard({ tweet, actions }: TweetCardProps) {
  return (
    <Card>
      <TweetHeader author={tweet.author} />
      <TweetContent text={tweet.content} />
      <TweetFooter actions={actions} />
    </Card>
  )
}

// 使用时灵活组合
<TweetCard
  tweet={tweet}
  actions={<LikeButton />}
/>
```

### 第七条：测试优先思维 (Test-First Mindset)

**代码必须可测试**

- [ ] 是否将副作用隔离到 Hook 中？
- [ ] 纯函数是否易于单元测试？
- [ ] 组件是否可以通过 props 控制行为？

```tsx
// ✅ 可测试的纯函数
export function formatTweetTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

// ✅ 可测试的组件
export function TweetTime({ timestamp }: { timestamp: number }) {
  return <time>{formatTweetTime(timestamp)}</time>
}
```

### 第八条：性能默认原则 (Performance by Default)

**避免不必要的重渲染**

- [ ] 是否使用了 React.memo (对于昂贵的组件)?
- [ ] 是否使用了 useCallback/useMemo (对于回调和计算)?
- [ ] Zustand selector 是否精确选择最小状态？

```tsx
// ✅ 精确的 Zustand selector
const username = useUserStore(s => s.user?.name) // 只订阅 name

// ❌ 过度订阅
const { user } = useUserStore() // user 任何字段变化都会重渲染
```

### 第九条：错误处理强制 (Mandatory Error Handling)

**所有异步操作必须处理错误**

```tsx
// ✅ 完整的错误处理
function useTweets() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['tweets'],
    queryFn: fetchTweets,
  })

  if (error)
    return { tweets: [], error }
  if (isLoading)
    return { tweets: [], isLoading: true }
  return { tweets: data, error: null }
}
```

## 代码生成检查清单

在生成任何代码前,必须确认：

### 架构合规性

- [ ] 通过所有九条宪法关卡
- [ ] 符合技术栈约束
- [ ] 无禁止的模式

### 代码质量

- [ ] 每个文件 ≤ 150 行
- [ ] 每个函数 ≤ 30 行
- [ ] TypeScript 无 `any` 类型
- [ ] 所有导出函数有 JSDoc 注释

### 可维护性

- [ ] 文件命名遵循 kebab-case
- [ ] 组件名遵循 PascalCase
- [ ] Hook 名以 `use` 开头
- [ ] 目录结构清晰 (components/, hooks/, stores/, utils/)

## 优先参考文档

在生成代码前,必须优先查阅项目 `/docs` 目录下的文档

## 代码生成流程

1. **理解需求** - 明确功能需求和验收标准
2. **检查文档** - 查阅 `/docs` 目录相关规范
3. **评估现有代码** - 识别需要重构的部分
4. **通过关卡** - 确认符合九条宪法
5. **生成代码** - 输出符合规范的代码
6. **自我审查** - 使用检查清单验证

## 错误处理指南

所有生成的代码必须包含适当的错误处理：

```typescript
// ✅ API 调用错误处理
async function fetchTweets(): Promise<Tweet[]> {
  try {
    const response = await fetch('/api/tweets')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  }
  catch (error) {
    console.error('Failed to fetch tweets:', error)
    throw error // 重新抛出供上层处理
  }
}

// ✅ React Query 错误处理
function useTweets() {
  return useQuery({
    queryKey: ['tweets'],
    queryFn: fetchTweets,
    retry: 3,
    onError: (error) => {
      toast.error('Failed to load tweets')
    },
  })
}
```

## 总结

本技能确保所有为 tweets-viewer 生成的代码都符合规格驱动开发的核心原则：

- **规格优先**：代码服务于明确的规格
- **架构一致性**：严格遵守九条宪法
- **可维护性**：单一职责、清晰结构
- **性能优化**：精细化状态管理、避免重渲染
- **质量保证**：类型安全、错误处理、可测试

在激活此技能时,AI 必须将这些原则内化为代码生成的核心约束,确保输出的代码始终保持专业、严谨且富有工程直觉。
