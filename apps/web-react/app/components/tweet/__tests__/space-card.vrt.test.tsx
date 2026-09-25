import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { fixtureSpaceDetails, makeTweet } from '~/test/vrt-fixtures'
import { TweetSpaceCard } from '../TweetSpaceCard'

// proxyMedia 会把内联 SVG data URL 包成 `https://proxy.chilfish.top/<dataURL>`，基线里会渲染成破图；
// 视觉基线要求图片地址原样透传（与 tweet.vrt.test.tsx mock getMediaUrl 同理）—— 仅 mock 这一个函数
vi.mock('~/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/utils')>()
  return {
    ...actual,
    proxyMedia: (url: string) => url,
  }
})

/**
 * Space 卡片三态 × 双主题：可回放（唯一给播放入口）/ 不可回放（行动区降级）/ 已删除墓碑（中性条）。
 * 护住的是「只有 replayable 才给播放入口」与「墓碑不复用品牌紫」这两条最容易回归的规则。
 */
describe.each([false, true])('space card visual (dark: %s)', (dark) => {
  const theme = dark ? 'dark' : 'light'

  it(`replayable [${theme}]`, async () => {
    setTheme(dark)
    renderTarget(
      <TweetSpaceCard tweet={makeTweet({ space: fixtureSpaceDetails })} />,
      { width: 480 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(`space-${theme}-replayable`)
  })

  it(`replay-disabled [${theme}]`, async () => {
    setTheme(dark)
    renderTarget(
      <TweetSpaceCard tweet={makeTweet({
        space: { ...fixtureSpaceDetails, isReplayAvailable: false, availability: 'no-replay' },
      })}
      />,
      { width: 480 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(`space-${theme}-no-replay`)
  })

  it(`deleted tombstone [${theme}]`, async () => {
    setTheme(dark)
    renderTarget(
      <TweetSpaceCard tweet={makeTweet({
        space: {
          ...fixtureSpaceDetails,
          id: '1DGLdvzVZmLGm',
          url: 'https://x.com/i/spaces/1DGLdvzVZmLGm',
          title: '',
          state: '',
          availability: 'unavailable',
          createdAt: 0,
          startedAt: null,
          endedAt: null,
          durationMs: null,
          listenersCount: 0,
          liveListenersCount: 0,
          replayCount: 0,
          isReplayAvailable: false,
          host: {
            id_str: '',
            name: '',
            screen_name: '',
            profile_image_url_https: '',
            verified: false,
            is_blue_verified: false,
          },
        },
      })}
      />,
      { width: 480 },
    )
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(`space-${theme}-tombstone`)
  })
})
