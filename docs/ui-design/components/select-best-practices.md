# Select 组件最佳实践

> **基础：** `~/components/ui/select`（基于 Base UI Select 封装）。
>
> **核心原则：`getLabel` 是必传 prop。** Trigger 里显示的必须是 label，不能是原始 value。

---

## 快速自检

AI 在每次使用 `<Select>` 时，必须确认：

- [ ] 每个 `<Select>` 都有 `getLabel` prop
- [ ] `getLabel` 正确处理了 `null` / `undefined` / 空字符串
- [ ] `SelectItem` 的 `value` 类型与 `Select` 的 `value` 类型一致
- [ ] `<SelectValue>` 只用了 `placeholder`，没有多余的 children（v2 API）

---

## 标准用法

`<SelectValue />` 会自动从 `Select` 的 `getLabel` 函数获取显示文本，无需手动传 children。

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const labels: Record<string, string> = {
  format: '仅格式化',
  'key-asc': '按 Key 排序 ↑',
}

<Select value={mode} onValueChange={setMode} getLabel={v => labels[String(v || '')] || String(v)}>
  <SelectTrigger>
    <SelectValue placeholder="排序方式" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="format">仅格式化</SelectItem>
    <SelectItem value="key-asc">按 Key 排序 ↑</SelectItem>
  </SelectContent>
</Select>
```

---

## 常见模式

### 1. 静态映射（最常用）

```tsx
const labels: Record<string, string> = {
  light: '浅色',
  dark: '深色',
  system: '跟随系统',
}

<Select value={theme} onValueChange={setTheme} getLabel={v => labels[String(v)] || String(v)}>
  <SelectTrigger>
    <SelectValue placeholder="选择主题" />
  </SelectTrigger>
  <SelectContent>
    {Object.entries(labels).map(([k, v]) => (
      <SelectItem key={k} value={k}>{v}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2. 数据源查找

```tsx
const languages = [
  { label: 'JavaScript', value: 'js' },
  { label: 'TypeScript', value: 'ts' },
]

<Select
  value={lang}
  onValueChange={setLang}
  getLabel={v => languages.find(l => l.value === v)?.label ?? '选择语言'}
>
  <SelectTrigger>
    <SelectValue placeholder="语言" />
  </SelectTrigger>
  <SelectContent>
    {languages.map(l => (
      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Object Values

```tsx
const items = [
  { label: 'Google Gemini', value: 'google' },
  { label: 'DeepSeek', value: 'deepseek' },
]
const [selected, setSelected] = useState(items[0])

<Select
  value={selected}
  onValueChange={setSelected}
  getLabel={v => v?.label ?? ''}
>
  <SelectTrigger>
    <SelectValue placeholder="模型" />
  </SelectTrigger>
  <SelectContent>
    {items.map(item => (
      <SelectItem key={item.value} value={item}>{item.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 4. 动态映射（依赖外部状态）

```tsx
<Select
  value={activeLang === 'json' ? jsonMode : xmlMode}
  onValueChange={setMode}
  getLabel={(v) => {
    const val = String(v || '')
    const labels = activeLang === 'json' ? JSON_LABELS : XML_LABELS
    return labels[val] || val
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="模式" />
  </SelectTrigger>
  {/* options */}
</Select>
```

---

## 边缘情况处理

### 空值保护

```tsx
// ✅ 安全：处理 null/undefined/空字符串
getLabel={v => {
  if (v === null || v === undefined || v === '') return '未选择'
  return labels[String(v)] || String(v)
}}

// ❌ 不安全：v 为 null 时会崩溃
getLabel={v => labels[v]}
```

### 无边框触发器（设置页面场景）

在 SettingsItem 中使用时：

```tsx
<SelectTrigger className="w-[140px] h-8 border-none shadow-none bg-transparent focus:ring-0 justify-end px-0 gap-1">
  <SelectValue placeholder="选择" />
</SelectTrigger>
```

---

## API 迁移（v1 → v2）

### 旧写法 ❌

```tsx
<Select value={mode} onValueChange={setMode}>
  <SelectTrigger>
    <SelectValue placeholder="排序">
      {(v) => labelMap[String(v || '')] || '排序'}
    </SelectValue>
  </SelectTrigger>
</Select>
```

### 新写法 ✅

```tsx
<Select value={mode} onValueChange={setMode} getLabel={v => labelMap[String(v || '')] || '排序'}>
  <SelectTrigger>
    <SelectValue placeholder="排序" />
  </SelectTrigger>
</Select>
```

**变更点：** `getLabel` 从 `<SelectValue>` 的 children render prop 移到了 `<Select>` 的 prop，这是 v2 API 的强制性变更。
