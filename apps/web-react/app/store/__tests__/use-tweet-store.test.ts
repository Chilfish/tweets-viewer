import { describe, expect, it } from 'vitest'
import { useTweetStore } from '../use-tweet-store'

describe('useTweetStore', () => {
  it('should initialize with correct defaults', () => {
    const state = useTweetStore.getState()
    expect(state.tweets).toEqual([])
    expect(state.status).toBe('idle')
    expect(state.reverse).toBe(false)
  })

  it('should set status', () => {
    useTweetStore.getState().setStatus('fetching')
    expect(useTweetStore.getState().status).toBe('fetching')
  })

  it('should set tweets', () => {
    const tweets = [{ id: '1', text: 'hello', created_at: new Date().toISOString() }] as any
    useTweetStore.getState().setTweets(tweets)
    expect(useTweetStore.getState().tweets).toEqual(tweets)
  })

  it('should append unique tweets', () => {
    useTweetStore.getState().resetStream()
    useTweetStore.getState().appendTweets([{ id: '1' }] as any)
    useTweetStore.getState().appendTweets([{ id: '2' }] as any)
    useTweetStore.getState().appendTweets([{ id: '1' }] as any)
    expect(useTweetStore.getState().tweets).toHaveLength(2)
  })

  it('should reset stream', () => {
    useTweetStore.getState().appendTweets([{ id: '1' }] as any)
    useTweetStore.getState().resetStream()
    expect(useTweetStore.getState().tweets).toEqual([])
    expect(useTweetStore.getState().status).toBe('idle')
  })

  it('should set reverse', () => {
    useTweetStore.getState().setReverse(true)
    expect(useTweetStore.getState().reverse).toBe(true)
    useTweetStore.getState().setReverse(false)
    expect(useTweetStore.getState().reverse).toBe(false)
  })
})
