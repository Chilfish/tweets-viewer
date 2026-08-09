import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MyTweet } from '../Tweet'

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
    entities: [
      {
        type: 'text',
        text: 'MyGO!!!!!×Ave Mujica 合同ライブ\n「わかれ道の、その先へ」 LIVE FILM',
        index: 0,
      },
    ],
    is_inline_media: false,
    reply_count: 9,
    like_count: 802,
    retweet_count: 3,
    view_count: 23421,
    ...overrides,
  }
}

describe('myTweet', () => {
  it('renders the tweet body text', () => {
    render(<MyTweet tweet={makeTweet()} tweetAuthorName="ttisrn_0710" />)
    expect(screen.getByText(/MyGO!!!!!×Ave Mujica 合同ライブ/)).toBeInTheDocument()
  })

  it('renders author name and screen name in the header', () => {
    render(<MyTweet tweet={makeTweet()} tweetAuthorName="ttisrn_0710" />)
    // 名字同时出现在头像 alt 与 header 链接；链接可访问名含 VerifiedBadge 的
    // aria-label（如「立石凛 Verified account」），故用正则锚定 header 链接
    expect(screen.getByRole('link', { name: /^立石凛/ })).toHaveAttribute('href', 'https://x.com/ttisrn_0710')
    expect(screen.getByRole('link', { name: '@ttisrn_0710' })).toBeInTheDocument()
  })

  it('renders a retweet indicator linking to the original tweet', () => {
    render(
      <MyTweet
        tweet={makeTweet({ retweeted_original_id: '2016474714647240908' })}
        tweetAuthorName="转发用户"
      />,
    )
    // 转推块：@转发用户 转推于 <日期>
    expect(screen.getByText(/@转发用户/)).toBeInTheDocument()
    expect(screen.getByText(/转推于/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /转推于/ }),
    ).toHaveAttribute('href', 'https://x.com/ttisrn_0710/status/2016474714647240908')
  })

  it('renders media images with alt text', () => {
    render(
      <MyTweet
        tweet={makeTweet({
          media_details: [
            {
              index: 0,
              media_url_https: 'https://pbs.twimg.com/media/G_uxxHBX0AAEIi1.jpg',
              original_info: { height: 1080, width: 1920 },
              type: 'photo',
              ext_alt_text: '现场照片',
            },
          ],
        })}
        tweetAuthorName="ttisrn_0710"
      />,
    )
    const img = screen.getByAltText('现场照片')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('pbs.twimg.com'))
  })

  it('renders a link card with domain and title', () => {
    render(
      <MyTweet
        tweet={makeTweet({
          card: {
            type: 'unified_card',
            url: 'https://www.youtube.com/watch?v=ZUg94j8bOoQ',
            title: 'ミニアニメ第17話',
            description: 'バンドリちゃんのミニアニメ',
            domain: 'youtube.com',
            imageUrl: 'https://pbs.twimg.com/media/G_zaUWHbcAAZolP.png',
          },
        })}
        tweetAuthorName="ttisrn_0710"
      />,
    )
    const card = screen.getByRole('link', { name: /ミニアニメ第17話/ })
    expect(card).toHaveAttribute('href', 'https://www.youtube.com/watch?v=ZUg94j8bOoQ')
    expect(screen.getByText('youtube.com')).toBeInTheDocument()
  })

  it('renders the quoted tweet nested inside', () => {
    render(
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
              profile_image_url_https: 'https://pbs.twimg.com/profile_images/1973738194454872064/MRvlZY2A.jpg',
            },
            text: '新情報📢 LIVE FILM',
            entities: [{ type: 'text', text: '新情報📢 LIVE FILM', index: 0 }],
          }),
        })}
        tweetAuthorName="ttisrn_0710"
      />,
    )
    expect(screen.getByText('新情報📢 LIVE FILM')).toBeInTheDocument()
  })
})
