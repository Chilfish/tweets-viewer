import type { EnrichedTweet, EnrichedUser, MediaDetails } from '@tweets-viewer/rettiwt-api'

/**
 * 视觉回归 fixture 的确定性图片源：内联 SVG data URL。
 * 不用 pbs.twimg.com 真图 —— 离线可跑、CI 无网络抖动、内容永不漂移；
 * 实际布局尺寸由 original_info / 容器比例驱动，图片本身只需可渲染。
 */
function svgDataUrl(width: number, height: number, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<rect width="100%" height="100%" fill="${fill}"/>`
    + `<circle cx="${Math.round(width * 0.72)}" cy="${Math.round(height * 0.34)}" r="${Math.round(Math.min(width, height) * 0.16)}" fill="rgba(255,255,255,0.35)"/>`
    + `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const fixtureAvatarUrl = svgDataUrl(96, 96, '#8ea7d8')
export const fixtureBannerUrl = svgDataUrl(600, 200, '#d8c39a')

/** 两张不同底色的横版图，供媒体网格用例区分格子 */
export const fixturePhotoA = svgDataUrl(1920, 1080, '#a8b8d0')
export const fixturePhotoB = svgDataUrl(1920, 1080, '#d0a8b8')

export function fixturePhotos(count: number): MediaDetails[] {
  const urls = [fixturePhotoA, fixturePhotoB]
  return Array.from({ length: count }, (_, index) => ({
    index,
    media_url_https: urls[index % urls.length]!,
    original_info: { width: 1920, height: 1080 },
    type: 'photo',
    ext_alt_text: `fixture photo ${index + 1}`,
  })) as MediaDetails[]
}

/**
 * 最小可渲染推文 fixture（字段裁剪自 Tweet.test.tsx / Tweet.stories.tsx 的真实数据）。
 * 图片字段替换为 data URL。
 */
export function makeTweet(overrides: Partial<EnrichedTweet> = {}): EnrichedTweet {
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
      profile_image_url_https: fixtureAvatarUrl,
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

/** ProfileHeader 完整用户 fixture：覆盖 banner/头像/bio/位置/生日/链接/计数/认证标全部分支 */
export function makeUser(overrides: Partial<EnrichedUser> = {}): EnrichedUser {
  return {
    userName: 'ttisrn_0710',
    fullName: '立石凛',
    profileImage: fixtureAvatarUrl,
    profileBanner: fixtureBannerUrl,
    description: 'MyGO!!!!! の立石凛です。ラーメンと猫が好き。Twitter アーカイブへようこそ 🐱',
    location: { location: '東京都' },
    createdAt: '2021-02-19T00:00:00.000Z',
    birthdayString: '2/19',
    url: 'https://example.com',
    followingsCount: 321,
    followersCount: 45678,
    statusesCount: 12345,
    isVerified: true,
    ...overrides,
  } as EnrichedUser
}
