import { describe, expect, it } from 'vitest'
import { groupTweetsByYearThenUser } from '../group-tweets-by-year-user'

function tweet(id: number, created_at: string, userName?: string, name?: string) {
  return { id, created_at, user: userName ? { screen_name: userName, name } : undefined }
}

describe('groupTweetsByYearThenUser', () => {
  it('returns an empty array for empty input', () => {
    expect(groupTweetsByYearThenUser([])).toEqual([])
  })

  it('groups by year, then by user within each year', () => {
    const tweets = [
      tweet(1, '2024-03-01T12:00:00Z', 'alice', 'Alice'),
      tweet(2, '2024-07-15T12:00:00Z', 'bob', 'Bob'),
      tweet(3, '2024-01-01T12:00:00Z', 'alice', 'Alice'),
      tweet(4, '2023-05-05T12:00:00Z', 'alice', 'Alice'),
    ]
    const groups = groupTweetsByYearThenUser(tweets)
    expect(groups.map(g => g.year)).toEqual([2024, 2023])
    expect(groups[0].users.map(u => u.userName)).toEqual(['alice', 'bob'])
    expect(groups[0].users[0].tweets.map(t => t.id)).toEqual([1, 3])
    expect(groups[0].users[1].tweets.map(t => t.id)).toEqual([2])
    expect(groups[1].users.map(u => u.userName)).toEqual(['alice'])
  })

  it('keeps a user in separate sub-groups across different years', () => {
    const tweets = [
      tweet(1, '2024-03-01T12:00:00Z', 'alice'),
      tweet(2, '2023-03-01T12:00:00Z', 'alice'),
    ]
    const groups = groupTweetsByYearThenUser(tweets)
    expect(groups).toHaveLength(2)
    expect(groups[0].users).toHaveLength(1)
    expect(groups[1].users).toHaveLength(1)
  })

  it('preserves year descending order from the input timeline', () => {
    const tweets = [
      tweet(1, '2025-01-01T12:00:00Z', 'a'),
      tweet(2, '2024-01-01T12:00:00Z', 'b'),
      tweet(3, '2023-01-01T12:00:00Z', 'c'),
    ]
    const groups = groupTweetsByYearThenUser(tweets)
    expect(groups.map(g => g.year)).toEqual([2025, 2024, 2023])
  })

  it('falls back to createdAt and userName / unknown', () => {
    const tweets = [
      { id: 1, createdAt: '2024-01-15T12:00:00Z', user: { userName: 'viaUsername' } },
      { id: 2, createdAt: '2024-01-16T12:00:00Z' },
    ]
    const groups = groupTweetsByYearThenUser(tweets as any)
    expect(groups[0].users.map(u => u.userName)).toEqual(['viaUsername', 'unknown'])
  })

  it('uses year 0 for unparseable dates', () => {
    const tweets = [{ id: 1, created_at: 'not-a-date', user: { screen_name: 'a' } }]
    const groups = groupTweetsByYearThenUser(tweets as any)
    expect(groups[0].year).toBe(0)
  })

  it('captures displayName and avatarUrl from the tweet user', () => {
    const tweets = [
      {
        id: 1,
        created_at: '2024-01-15T12:00:00Z',
        user: { screen_name: 'alice', name: 'Alice', profile_image_url_https: 'https://x/a.jpg' },
      },
    ]
    const groups = groupTweetsByYearThenUser(tweets as any)
    expect(groups[0].users[0].displayName).toBe('Alice')
    expect(groups[0].users[0].avatarUrl).toBe('https://x/a.jpg')
  })
})
