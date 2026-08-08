import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../use-user-store'

describe('useUserStore', () => {
  it('should initialize with correct defaults', () => {
    const state = useUserStore.getState()
    expect(state.users).toEqual([])
    expect(state.activeUser).toBeNull()
    expect(state.isInitialized).toBe(false)
  })

  it('should set users', () => {
    const users = [{ id: '1', userName: 'alice', fullName: 'Alice' }] as any
    useUserStore.getState().setUsers(users)
    expect(useUserStore.getState().users).toEqual(users)
  })

  it('should set active user', () => {
    const user = { id: '1', userName: 'alice', fullName: 'Alice' } as any
    useUserStore.getState().setActiveUser(user)
    expect(useUserStore.getState().activeUser).toEqual(user)
    useUserStore.getState().setActiveUser(null)
    expect(useUserStore.getState().activeUser).toBeNull()
  })

  it('should set initialized', () => {
    useUserStore.getState().setInitialized(true)
    expect(useUserStore.getState().isInitialized).toBe(true)
  })
})

describe('useUserStore pushRecentUser', () => {
  beforeEach(() => {
    useUserStore.setState({ recentUserNames: [] })
  })

  it('should prepend new user names', () => {
    useUserStore.getState().pushRecentUser('alice')
    useUserStore.getState().pushRecentUser('bob')
    expect(useUserStore.getState().recentUserNames).toEqual(['bob', 'alice'])
  })

  it('should dedupe and move existing name to front', () => {
    useUserStore.getState().pushRecentUser('alice')
    useUserStore.getState().pushRecentUser('bob')
    useUserStore.getState().pushRecentUser('alice')
    expect(useUserStore.getState().recentUserNames).toEqual(['alice', 'bob'])
  })

  it('should cap the recent list at MAX_RECENT_USERS', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    names.forEach(name => useUserStore.getState().pushRecentUser(name))
    const recent = useUserStore.getState().recentUserNames
    expect(recent).toEqual(['g', 'f', 'e', 'd', 'c', 'b'])
    expect(recent).toHaveLength(6)
  })
})
