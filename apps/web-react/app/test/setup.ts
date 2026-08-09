import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Vitest 全局 setup：注入 jest-dom 匹配器 + 组件测试自动清理。
// @testing-library/react 的自动 cleanup 依赖全局 afterEach，
// 而 vitest 关闭 globals 时不会注册，需显式在 afterEach 中 cleanup，
// 避免多个用例的 DOM 泄漏导致「匹配到多个元素」。
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
