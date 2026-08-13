import { describe, expect, it } from 'vitest'
import { groupTweetsByUser } from '../group-tweets-by-user'

function tweet(id: number, userName: string, name?: string) {
  return { id, user: { screen_name: userName, name } }
}

describe('groupTweetsByUser', () => {
  it('returns an empty array for empty input', () => {
    expect(groupTweetsByUser([])).toEqual([])
  })

  it('groups consecutive tweets by same author', () => {
    const tweets = [
      tweet(1, 'alice', 'Alice'),
      tweet(2, 'alice', 'Alice'),
      tweet(3, 'bob', 'Bob'),
      tweet(4, 'bob', 'Bob'),
    ]
    const groups = groupTweetsByUser(tweets)
    expect(groups.map(g => g.userName)).toEqual(['alice', 'bob'])
    expect(groups[0].displayName).toBe('Alice')
    expect(groups[0].tweets.map(t => t.id)).toEqual([1, 2])
    expect(groups[1].tweets.map(t => t.id)).toEqual([3, 4])
  })

  it('splits a group when the author changes back', () => {
    const tweets = [
      tweet(1, 'alice'),
      tweet(2, 'bob'),
      tweet(3, 'alice'),
    ]
    const groups = groupTweetsByUser(tweets)
    expect(groups.map(g => g.userName)).toEqual(['alice', 'bob', 'alice'])
  })

  it('falls back to userName and unknown', () => {
    const tweets = [
      { id: 1, user: { userName: 'viaUsername' } },
      { id: 2 },
    ]
    const groups = groupTweetsByUser(tweets as any)
    expect(groups.map(g => g.userName)).toEqual(['viaUsername', 'unknown'])
  })

  it('captures avatar url', () => {
    const tweets = [
      { id: 1, user: { screen_name: 'alice', profile_image_url_https: 'https://x/avatar.jpg' } },
    ]
    const groups = groupTweetsByUser(tweets as any)
    expect(groups[0].avatarUrl).toBe('https://x/avatar.jpg')
  })
})
