import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TweetAction } from '../tweet-action'

/** 最小可渲染的推文 fixture。字段裁剪自 app/stories/Tweet.stories.tsx 的真实数据。 */
function makeTweet(overrides: Partial<EnrichedTweet> = {}): EnrichedTweet {
  return {
    id: '2016474714647240908',
    lang: 'ja',
    url: 'https://twitter.com/ttisrn_0710/status/2016474714647240908',
    created_at: 'Wed Jan 28 11:33:30 +0000 2026',
    user: {
      id_str: '1353543505432301569',
      name: '立石凛',
      screen_name: 'ttisrn_0710',
      is_blue_verified: true,
      verified: true,
      profile_image_shape: 'Circle',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1952673634377756672/FWjMlNpA.jpg',
    },
    text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM',
    entities: [{ type: 'text', text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM', index: 0 }],
    is_inline_media: false,
    reply_count: 9,
    like_count: 802,
    retweet_count: 3,
    view_count: 23421,
    ...overrides,
  }
}

/** 在既有 navigator 上装一个可配置的 share stub（避免整体替换 navigator 影响其他 API）。 */
function stubShare() {
  // navigator.share 规范上返回 Promise；stub 需 resolve，避免未捕获/解引用
  const share = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(window.navigator, 'share', {
    value: share,
    configurable: true,
    writable: true,
  })
  return share
}

afterEach(() => {
  // 还原 navigator.share：jsdom 本无该属性，删除后回到 undefined
  delete (window.navigator as unknown as { share?: unknown }).share
})

describe('tweetAction share', () => {
  it('renders the share as a link to the original tweet in a new tab', () => {
    render(<TweetAction tweet={makeTweet()} />)
    const share = screen.getByTitle('分享')
    expect(share.tagName).toBe('A')
    expect(share).toHaveAttribute('href', 'https://twitter.com/ttisrn_0710/status/2016474714647240908')
    expect(share).toHaveAttribute('target', '_blank')
    expect(share).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('triggers the Web Share API with the tweet url on a plain click', () => {
    const share = stubShare()
    render(<TweetAction tweet={makeTweet()} />)
    screen.getByTitle('分享').click()
    expect(share).toHaveBeenCalledWith({ url: 'https://twitter.com/ttisrn_0710/status/2016474714647240908' })
  })

  it('does not trigger Web Share on a right-click (native link menu preserved)', () => {
    const share = stubShare()
    render(<TweetAction tweet={makeTweet()} />)
    // 右键不拦截：button=2，留给浏览器/应用的原生菜单
    fireEventMouseButton(screen.getByTitle('分享'), 2)
    expect(share).not.toHaveBeenCalled()
  })

  it('does not trigger Web Share on a modifier-click (open in new tab preserved)', () => {
    const share = stubShare()
    render(<TweetAction tweet={makeTweet()} />)
    fireEventMouseButton(screen.getByTitle('分享'), 0, { ctrlKey: true })
    expect(share).not.toHaveBeenCalled()
  })

  it('falls back to plain link behavior when navigator.share is unavailable', () => {
    render(<TweetAction tweet={makeTweet()} />)
    // 不 stub share → 点击走原生 a 行为（jsdom 不导航，断言未抛错即可）
    expect(() => screen.getByTitle('分享').click()).not.toThrow()
  })
})

function fireEventMouseButton(
  el: Element,
  button: number,
  init: MouseEventInit = {},
) {
  el.dispatchEvent(
    new MouseEvent('click', {
      button,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  )
}
