import { describe, expect, it } from 'vitest'
import { groupTweetsByYear } from '../group-tweets-by-year'

function tweet(id: number, created_at: string) {
  return { id, created_at }
}

describe('groupTweetsByYear', () => {
  it('returns an empty array for empty input', () => {
    expect(groupTweetsByYear([])).toEqual([])
  })

  it('groups consecutive same-year tweets', () => {
    const tweets = [
      tweet(1, '2024-03-01T12:00:00Z'),
      tweet(2, '2024-07-15T12:00:00Z'),
      tweet(3, '2023-01-01T12:00:00Z'),
      tweet(4, '2023-05-05T12:00:00Z'),
    ]
    const groups = groupTweetsByYear(tweets)
    expect(groups.map(g => g.year)).toEqual([2024, 2023])
    expect(groups[0].tweets.map(t => t.id)).toEqual([1, 2])
    expect(groups[1].tweets.map(t => t.id)).toEqual([3, 4])
  })

  it('splits a group when the year changes back', () => {
    const tweets = [
      tweet(1, '2024-03-01T12:00:00Z'),
      tweet(2, '2023-03-01T12:00:00Z'),
      tweet(3, '2024-03-01T12:00:00Z'),
    ]
    const groups = groupTweetsByYear(tweets)
    expect(groups.map(g => g.year)).toEqual([2024, 2023, 2024])
  })

  it('parses the raw Twitter created_at format', () => {
    const tweets = [
      tweet(1, 'Wed Jan 28 11:33:30 +0000 2026'),
      tweet(2, 'Thu Jan 29 12:22:28 +0000 2026'),
      tweet(3, 'Sat Jan 24 12:52:35 +0000 2025'),
    ]
    const groups = groupTweetsByYear(tweets)
    expect(groups.map(g => g.year)).toEqual([2026, 2025])
  })

  it('falls back to createdAt when created_at is missing', () => {
    const tweets = [
      { id: 1, createdAt: '2024-01-15T12:00:00Z' },
      { id: 2, createdAt: '2024-06-01T12:00:00Z' },
    ]
    const groups = groupTweetsByYear(tweets)
    expect(groups.map(g => g.year)).toEqual([2024])
  })

  it('uses year 0 for unparseable dates', () => {
    const tweets = [{ id: 1, created_at: 'not-a-date' }]
    const groups = groupTweetsByYear(tweets)
    expect(groups[0].year).toBe(0)
  })
})
