import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '~/store/use-user-store'
import { HomeMemoEntry } from '../memo-entry'
import { HomeUserEntry } from '../user-entry'

function makeUser(userName: string, fullName: string): EnrichedUser {
  return {
    userName,
    fullName,
    profileImage: `https://pbs.twimg.com/profile_images/${userName}.jpg`,
    description: '',
    followersCount: 0,
    followingsCount: 0,
    statusesCount: 0,
  } as unknown as EnrichedUser
}

const userA = makeUser('240y_k', '西尾夕香')
const userB = makeUser('ttisrn_0710', '立石凛')

describe('homeUserEntry', () => {
  beforeEach(() => {
    // 重置持久化 store，避免用例间串扰（_hasHydrated 手动置真，绕过 async 水合）
    useUserStore.setState({
      users: [],
      activeUser: null,
      recentUserNames: [],
      _hasHydrated: true,
    })
  })

  it('renders a continue-browsing entry for the active user', () => {
    useUserStore.setState({ activeUser: userA })
    render(
      <MemoryRouter>
        <HomeUserEntry />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /继续浏览/ })
    expect(link).toHaveAttribute('href', '/tweets/240y_k')
    expect(screen.getByText('西尾夕香')).toBeInTheDocument()
  })

  it('renders recent and archived user cards with links', () => {
    useUserStore.setState({ users: [userA, userB], recentUserNames: ['ttisrn_0710'] })
    render(
      <MemoryRouter>
        <HomeUserEntry />
      </MemoryRouter>,
    )
    expect(screen.getByText('最近浏览')).toBeInTheDocument()
    expect(screen.getByText('归档用户')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /ttisrn_0710/ })).not.toHaveLength(0)
    expect(screen.getByRole('link', { name: /西尾夕香/ })).toHaveAttribute('href', '/tweets/240y_k')
  })

  it('shows the empty state when no archived users exist', () => {
    render(
      <MemoryRouter>
        <HomeUserEntry />
      </MemoryRouter>,
    )
    expect(screen.getByText(/归档为空/)).toBeInTheDocument()
  })

  it('renders nothing (placeholder) before hydration completes', () => {
    useUserStore.setState({ _hasHydrated: false })
    const { container } = render(
      <MemoryRouter>
        <HomeUserEntry />
      </MemoryRouter>,
    )
    expect(container.querySelector('.h-32')).not.toBeNull()
    expect(screen.queryByText(/继续浏览/)).not.toBeInTheDocument()
  })
})

describe('homeMemoEntry', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [],
      activeUser: null,
      recentUserNames: [],
      _hasHydrated: true,
    })
  })

  it('links to the memo page of the active user', () => {
    useUserStore.setState({ activeUser: userA })
    render(
      <MemoryRouter>
        <HomeMemoEntry />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /那年今日/ })
    expect(link).toHaveAttribute('href', '/memo/240y_k')
    expect(screen.getByText(/240y_k/)).toBeInTheDocument()
  })

  it('falls back to the first archived user when no active user', () => {
    useUserStore.setState({ users: [userB] })
    render(
      <MemoryRouter>
        <HomeMemoEntry />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /那年今日/ })).toHaveAttribute('href', '/memo/ttisrn_0710')
  })

  it('renders nothing when no user is available', () => {
    render(
      <MemoryRouter>
        <HomeMemoEntry />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: /那年今日/ })).not.toBeInTheDocument()
  })
})
