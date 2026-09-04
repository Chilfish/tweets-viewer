import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// vrt project 全局 setup：
// - 引入 app.css：Tailwind v4 + 设计 token 全量样式，截图才是真实视觉
//   （vitest.config.ts 的 vrt project 挂了 @tailwindcss/vite，`@import 'tailwindcss'` 才会被处理）
// - 显式注册 RTL cleanup：vitest 关 globals 时不会自动注册，DOM 跨用例泄漏
//   会导致截图目标错位（同 postmortem 002 的教训）
// - 回滚用例可能切换的 .dark 主题类，避免跨用例串扰
import '~/app.css'

afterEach(() => {
  cleanup()
  document.documentElement.classList.remove('dark')
})
