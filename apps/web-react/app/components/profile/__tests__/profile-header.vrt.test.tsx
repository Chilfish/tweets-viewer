import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { makeUser } from '~/test/vrt-fixtures'
import { ProfileHeader } from '../ProfileHeader'

// ProfileHeader 是 5A-3 的独立容器（profile-container + banner/头像/bio/meta/计数/认证标），
// 一张完整资料截图锁住 token 化配色与暗色适配的全链路
describe.each([false, true])('profileHeader visual (dark: %s)', (dark) => {
  it(`full profile [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(<ProfileHeader user={makeUser()} />, { width: 560 })
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `profile-header-${dark ? 'dark' : 'light'}-full`,
    )
  })
})
