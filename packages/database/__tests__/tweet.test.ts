import { describe, expect, it } from 'vitest'
import {
  extractMediaImageUrls,
  extractTweetSortKey,
  mapToEnrichedTweet,
} from '../modules/tweet'

function photo(url: string) {
  return {
    type: 'photo' as const,
    index: 0,
    media_url_https: url,
    original_info: { width: 100, height: 100 },
  }
}

const mockTweet = {
  id: 1,
  tweetId: '1234567890',
  userId: 'test_user',
  fullText: 'Hello world',
  createdAt: new Date('2024-01-15T12:00:00Z'),
  jsonData: {
    id: '1234567890',
    text: 'Hello world',
    created_at: '2024-01-15T12:00:00Z',
    user: { userName: 'test_user' },
  },
}

describe('mapToEnrichedTweet', () => {
  it('should return jsonData from tweet row', () => {
    const result = mapToEnrichedTweet(mockTweet as any)
    expect(result).toEqual(mockTweet.jsonData)
  })

  it('should preserve created_at from jsonData', () => {
    const result = mapToEnrichedTweet(mockTweet as any)
    expect(result.created_at).toBe('2024-01-15T12:00:00Z')
  })

  it('should preserve tweet id', () => {
    const result = mapToEnrichedTweet(mockTweet as any)
    expect(result.id).toBe('1234567890')
  })
})

describe('extractTweetSortKey', () => {
  it('should fall back to tweetId when no retweet', () => {
    const row = { tweetId: '1234567890', jsonData: { retweeted_original_id: undefined } }
    expect(extractTweetSortKey(row as any)).toBe('1234567890')
  })

  it('should prefer retweeted_original_id (retweets follow original timeline)', () => {
    const row = {
      tweetId: '2222222222',
      jsonData: { retweeted_original_id: '1111111111' },
    }
    expect(extractTweetSortKey(row as any)).toBe('1111111111')
  })
})

describe('extractMediaImageUrls', () => {
  it('collects media_url_https from every media entry', () => {
    const tweet = { media_details: [photo('a.jpg'), photo('b.jpg')] }
    expect(extractMediaImageUrls(tweet as any)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('returns [] when there is no media_details', () => {
    expect(extractMediaImageUrls({} as any)).toEqual([])
  })

  it('ignores empty or missing media_url_https', () => {
    const tweet = {
      media_details: [photo('a.jpg'), { ...photo(''), media_url_https: undefined }],
    }
    expect(extractMediaImageUrls(tweet as any)).toEqual(['a.jpg'])
  })

  it('returns [] for retweets (media belongs to the original author)', () => {
    const tweet = {
      retweeted_original_id: '111',
      media_details: [photo('a.jpg')],
    }
    expect(extractMediaImageUrls(tweet as any)).toEqual([])
  })
})
