import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { FeedStatus } from '../feed-status'

// FeedStatus 是 5C-1 的列表四态统一组件 —— Phase 5 状态视觉的收敛点，视觉回归重点保护对象。
// Playwright provider 截图时自动禁动画（animate-spin / animate-in 冻结在自然终态），无需额外处理。
const states = [
  { name: 'empty', status: 'ready', hasItems: false },
  { name: 'full-page-error', status: 'error', hasItems: false },
  { name: 'tail-fetching', status: 'fetching', hasItems: true },
  { name: 'tail-error', status: 'error', hasItems: true },
  { name: 'tail-exhausted', status: 'exhausted', hasItems: true },
] as const

describe.each([false, true])('feedStatus visual (dark: %s)', (dark) => {
  states.forEach(({ name, status, hasItems }) => {
    it(`${name} [${dark ? 'dark' : 'light'}]`, async () => {
      setTheme(dark)
      renderTarget(
        <FeedStatus status={status} hasItems={hasItems} onRetry={() => {}} />,
        { width: 480 },
      )
      await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
        `feed-status-${dark ? 'dark' : 'light'}-${name}`,
      )
    })
  })
})
