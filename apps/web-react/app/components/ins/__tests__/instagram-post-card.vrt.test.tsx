import { describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { fixtureAvatarUrl, makeIGMedia, makeIGPost } from '~/test/vrt-fixtures'
import { InstagramPostCard } from '../InstagramPostCard'

// IG 帖卡三形态：三图网格 + 音乐（Reel 语境）/ 单图全宽 / 多图折叠相片堆（+N 角标）
// 音乐封面用静态 data URL——旋转唱片 fallback 是 infinite 动画，截图不可复现
describe.each([false, true])('instagramPostCard visual (dark: %s)', (dark) => {
  it(`grid-with-music [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <InstagramPostCard
        post={makeIGPost({
          type: 'reel',
          audio: {
            title: '輪舞 Revolution',
            artist: 'Sota Fujimori',
            cover_artwork_thumbnail_uri: fixtureAvatarUrl,
          },
        })}
      />,
      { width: 560 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `ig-post-${dark ? 'dark' : 'light'}-grid-music`,
    )
  })

  it(`single [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <InstagramPostCard post={makeIGPost({ media: makeIGMedia(1) })} />,
      { width: 560 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `ig-post-${dark ? 'dark' : 'light'}-single`,
    )
  })

  it(`folded-pile [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <InstagramPostCard post={makeIGPost({ media: makeIGMedia(8) })} />,
      { width: 560 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `ig-post-${dark ? 'dark' : 'light'}-folded-pile`,
    )
  })
})
