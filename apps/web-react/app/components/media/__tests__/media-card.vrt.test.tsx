import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { makeFlatMediaItem } from '~/test/vrt-fixtures'
import { MediaCard } from '../MediaCard'

// 媒体墙卡片两形态：横版照片 / 视频封面（VIDEO 角标）—— 覆盖 5E-3 blur-up 占位与角标视觉
describe.each([false, true])('mediaCard visual (dark: %s)', (dark) => {
  it(`photo [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <MediaCard item={makeFlatMediaItem()} onClick={() => {}} />,
      { width: 320 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `media-card-${dark ? 'dark' : 'light'}-photo`,
    )
  })

  it(`video [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <MediaCard
        item={makeFlatMediaItem({ type: 'video' })}
        onClick={() => {}}
      />,
      { width: 320 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `media-card-${dark ? 'dark' : 'light'}-video`,
    )
  })
})
