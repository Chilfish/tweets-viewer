import type { EnrichedTweet as SdkEnrichedTweet } from '@chilfish/tweet'
import { describe, expect, it } from 'vitest'
import { readTweetKeys, toArchivedTweet } from '../tweet'

function sdkTweet(overrides: Partial<SdkEnrichedTweet> = {}): SdkEnrichedTweet {
  return {
    id: '1900000000000000001',
    url: 'https://twitter.com/tester/status/1900000000000000001',
    lang: 'ja',
    created_at: 'Mon Jan 01 00:00:00 +0000 2024',
    text: 'hello',
    user: {
      id: '42',
      name: 'Test User',
      screen_name: 'tester',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1/avatar.jpg',
      profile_image_shape: 'Circle',
      verified: false,
      is_blue_verified: true,
    },
    entities: [],
    parent_id: '1900000000000000000',
    in_reply_to_status_id_str: '1900000000000000000',
    in_reply_to_screen_name: 'parent',
    quotedTweetId: undefined,
    quotedTweet: undefined,
    card: undefined,
    poll: undefined,
    article: undefined,
    space: undefined,
    retweetedOriginalId: '1900000000000000009',
    isInlineMedia: false,
    replyCount: 1,
    likeCount: 2,
    retweetCount: 3,
    viewCount: 4,
    comments: undefined,
    ...overrides,
  } as SdkEnrichedTweet
}

describe('toArchivedTweet', () => {
  it('maps SDK camelCase fields back to the archive contract', () => {
    const archived = toArchivedTweet(sdkTweet({
      mediaDetails: [
        {
          type: 'photo',
          index: 0,
          media_url_https: 'https://pbs.twimg.com/media/photo.jpg',
          original_info: { width: 100, height: 200 },
          ext_alt_text: 'alt',
        },
      ],
    }))

    expect(archived).toMatchObject({
      id: '1900000000000000001',
      parent_id: '1900000000000000000',
      in_reply_to_status_id_str: '1900000000000000000',
      retweeted_original_id: '1900000000000000009',
      is_inline_media: false,
      reply_count: 1,
      like_count: 2,
      retweet_count: 3,
      view_count: 4,
    })
    expect(archived.user.id_str).toBe('42')
    expect(archived.media_details?.[0]?.media_url_https).toBe('https://pbs.twimg.com/media/photo.jpg')

    // SDK-only / camelCase fields must not leak into the archive JSON
    expect('mediaDetails' in archived).toBe(false)
    expect('quotedTweet' in archived).toBe(false)
    expect('retweetedOriginalId' in archived).toBe(false)
    expect('article' in archived).toBe(false)
    expect('__typename' in archived).toBe(false)
  })

  it('maps quoted tweets and Space hosts recursively', () => {
    const archived = toArchivedTweet(sdkTweet({
      quotedTweet: sdkTweet({
        id: '200',
        quotedTweet: undefined,
      }),
      space: {
        id: 'space-1',
        url: 'https://x.com/i/spaces/space-1',
        title: 'Space',
        state: 'Ended',
        availability: 'replayable',
        createdAt: 1,
        startedAt: 2,
        endedAt: 3,
        durationMs: 1,
        listenersCount: 10,
        liveListenersCount: 3,
        replayCount: 7,
        isReplayAvailable: true,
        host: {
          id: '42',
          name: 'Test User',
          screen_name: 'tester',
          profile_image_url_https: 'https://pbs.twimg.com/profile_images/1/avatar.jpg',
          verified: true,
          is_blue_verified: true,
        },
      },
    }))

    expect(archived.quoted_tweet?.id).toBe('200')
    expect(archived.quoted_tweet?.user.id_str).toBe('42')
    expect(archived.space?.host.id_str).toBe('42')
    expect('id' in (archived.space?.host ?? {})).toBe(false)
  })
})

describe('readTweetKeys', () => {
  it('trims and drops empty entries', () => {
    expect(readTweetKeys(' key1, , key2 ')).toEqual(['key1', 'key2'])
  })

  it('fails fast when no key is configured', () => {
    expect(() => readTweetKeys('')).toThrow(/TWEET_KEYS is empty/)
    expect(() => readTweetKeys(' , ')).toThrow(/TWEET_KEYS is empty/)
  })
})
