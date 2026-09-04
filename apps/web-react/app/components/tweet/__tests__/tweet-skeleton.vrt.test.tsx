import { beforeAll, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { renderTarget, setTheme } from '~/test/vrt'
import { TweetSkeleton } from '../tweet-skeleton'

// 推文骨架卡片。animate-skeleton 是 infinite shimmer——截图前冻结为初始帧（静态渐变），
// 否则高光带位置随帧漂移，基线不可复现
beforeAll(() => {
  const style = document.createElement('style')
  style.textContent = '.animate-skeleton { animation: none !important }'
  document.head.appendChild(style)
})

describe.each([false, true])('tweetSkeleton visual (dark: %s)', (dark) => {
  it(`card [${dark ? 'dark' : 'light'}]`, async () => {
    setTheme(dark)
    renderTarget(<TweetSkeleton />, { width: 560 })
    await expect(page.getByTestId('vrt-target')).toMatchScreenshot(
      `tweet-skeleton-${dark ? 'dark' : 'light'}`,
    )
  })
})
