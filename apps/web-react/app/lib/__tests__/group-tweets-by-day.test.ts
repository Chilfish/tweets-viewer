import { describe, expect, it } from 'vitest'
import { groupTweetsByDay } from '../group-tweets-by-day'

interface FakeTweet {
  id: string
  created_at?: string
  createdAt?: string
}

describe('groupTweetsByDay', () => {
  it('连续段按日分组，保持原始顺序', () => {
    const tweets: FakeTweet[] = [
      { id: 'a', created_at: '2024-03-05T10:00:00Z' },
      { id: 'b', created_at: '2024-03-05T11:00:00Z' },
      { id: 'c', created_at: '2024-03-06T10:00:00Z' },
      { id: 'd', created_at: '2024-03-07T10:00:00Z' },
    ]
    const groups = groupTweetsByDay(tweets)
    expect(groups.map(g => g.dateKey)).toEqual(['2024-03-05', '2024-03-06', '2024-03-07'])
    expect(groups[0]!.tweets.map(t => t.id)).toEqual(['a', 'b'])
    expect(groups[2]!.tweets.map(t => t.id)).toEqual(['d'])
  })

  it('同一天被后续日期打断后再次出现时，按连续段新开一组（不跨段合并）', () => {
    const tweets: FakeTweet[] = [
      { id: 'a', created_at: '2024-03-05T10:00:00Z' },
      { id: 'b', created_at: '2024-03-06T10:00:00Z' },
      { id: 'c', created_at: '2024-03-05T12:00:00Z' },
    ]
    const groups = groupTweetsByDay(tweets)
    expect(groups.map(g => g.dateKey)).toEqual(['2024-03-05', '2024-03-06', '2024-03-05'])
  })

  it('兼容 createdAt 兜底与无日期数据', () => {
    const tweets: FakeTweet[] = [
      { id: 'a', createdAt: '2024-03-05T10:00:00Z' },
      { id: 'b' },
    ]
    const groups = groupTweetsByDay(tweets)
    expect(groups[0]!.dateKey).toBe('2024-03-05')
    expect(groups[1]!.dateKey).toBe('')
  })

  it('非法日期归入空键组', () => {
    const tweets: FakeTweet[] = [
      { id: 'a', created_at: 'not-a-date' },
      { id: 'b', created_at: '2024-03-05T10:00:00Z' },
    ]
    const groups = groupTweetsByDay(tweets)
    expect(groups.map(g => g.dateKey)).toEqual(['', '2024-03-05'])
  })

  it('空数组返回空数组', () => {
    expect(groupTweetsByDay([])).toEqual([])
  })
})
