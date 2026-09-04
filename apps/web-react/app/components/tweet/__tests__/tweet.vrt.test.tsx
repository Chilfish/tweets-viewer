import type { MediaDetails } from '@tweets-viewer/rettiwt-api'
import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { fixtureAvatarUrl, fixturePhotos, makeTweet } from '~/test/vrt-fixtures'
import { MyTweet } from '../Tweet'

// getMediaUrl 按 twimg 规则重写 URL（剥扩展名 + 加 ?format=&name=），会把 data URL 改坏；
// 视觉基线用内联 SVG，媒体地址必须原样透传 —— 仅在本文件内 mock 这一个函数
vi.mock('~/components/react-tweet/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/components/react-tweet/utils')>()
  return {
    ...actual,
    getMediaUrl: (media: MediaDetails) => media.media_url_https,
  }
})

// 推文卡片三形态：纯文本 / 双图媒体网格 / 引用推 —— 覆盖 5A-2 token 化与 5E-1 沉浸流式的核心视觉
describe.each([false, true])('myTweet visual (dark: %s)', (dark) => {
  it(`text-only [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(<MyTweet tweet={makeTweet()} tweetAuthorName="ttisrn_0710" />, { width: 560 })
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `tweet-${dark ? 'dark' : 'light'}-text`,
    )
  })

  it(`media-grid [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <MyTweet
        tweet={makeTweet({ media_details: fixturePhotos(2) })}
        tweetAuthorName="ttisrn_0710"
      />,
      { width: 560 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `tweet-${dark ? 'dark' : 'light'}-media-grid`,
    )
  })

  it(`quoted [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(
      <MyTweet
        tweet={makeTweet({
          quoted_tweet_id: '2016458857263091800',
          quoted_tweet: makeTweet({
            id: '2016458857263091800',
            user: {
              id_str: '3009772568',
              name: 'バンドリ！公式',
              screen_name: 'bang_dream_info',
              is_blue_verified: false,
              verified: false,
              profile_image_shape: 'Square',
              profile_image_url_https: fixtureAvatarUrl,
            },
            text: '新情報📢 LIVE FILM',
            entities: [{ type: 'text', text: '新情報📢 LIVE FILM', index: 0 }],
          }),
        })}
        tweetAuthorName="ttisrn_0710"
      />,
      { width: 560 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `tweet-${dark ? 'dark' : 'light'}-quoted`,
    )
  })
})
