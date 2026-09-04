import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { DateDivider } from '../date-divider'

// 跨天日期分隔线两形态：固定历史日期 / 空值兜底文案。
// 固定 2024 日期避开「今天/昨天」分支——该分支随运行日漂移，基线不可复现
describe.each([false, true])('dateDivider visual (dark: %s)', (dark) => {
  it(`date [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(<DateDivider dateKey="2024-03-05" />, { width: 560 })
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `date-divider-${dark ? 'dark' : 'light'}-date`,
    )
  })

  it(`unknown [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(<DateDivider dateKey="" />, { width: 560 })
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `date-divider-${dark ? 'dark' : 'light'}-unknown`,
    )
  })
})
