import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '~/lib/utils'
import { YearNavigator } from '../year-navigator'

function renderWithRouter(name = 'testuser') {
  const router = createMemoryRouter(
    [
      { path: '/tweets/:name', element: <YearNavigator name={name} /> },
    ],
    { initialEntries: [`/tweets/${name}`] },
  )
  render(<RouterProvider router={router} />)
  return router
}

function mockStats(data: Array<{ year: number, count: number }>) {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data } as never)
}

describe('yearNavigator', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when stats are empty (graceful degradation)', async () => {
    mockStats([])
    renderWithRouter()
    await waitFor(() => expect(screen.queryByRole('button')).toBeNull())
  })

  it('opens dropdown with year entries, counts and gap placeholders (Base UI menu smoke)', async () => {
    mockStats([
      { year: 2026, count: 5 },
      { year: 2024, count: 3 },
    ])
    renderWithRouter()

    const trigger = await screen.findByRole('button', { name: /按年浏览/ })
    await userEvent.click(trigger)

    // 覆盖区间标题（无 MenuGroupContext 报错即通过）
    expect(await screen.findByText(/2024\s*-\s*2026/)).toBeInTheDocument()
    // 年份项 + 条数
    expect(await screen.findByText('2026')).toBeInTheDocument()
    expect(screen.getByText('5 条')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('3 条')).toBeInTheDocument()
    // 缺口年份（2025）灰显为「暂无数据」
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('writes start/end to URL when a year is clicked', async () => {
    mockStats([{ year: 2026, count: 5 }])
    const router = renderWithRouter()

    const trigger = await screen.findByRole('button', { name: /按年浏览/ })
    await userEvent.click(trigger)
    await userEvent.click(await screen.findByText('2026'))

    // URL 驱动：写入整年日期范围
    await waitFor(() => {
      expect(router.state.location.search).toContain('start=2026-01-01')
      expect(router.state.location.search).toContain('end=2026-12-31')
    })
    // trigger 更新为当前年份
    expect(await screen.findByRole('button', { name: /2026/ })).toBeInTheDocument()
  })

  it('shows active year when URL already has a year range', async () => {
    mockStats([{ year: 2024, count: 3 }])
    const router = createMemoryRouter(
      [
        {
          path: '/tweets/:name',
          element: <YearNavigator name="testuser" />,
        },
      ],
      { initialEntries: ['/tweets/testuser?start=2024-01-01&end=2024-12-31'] },
    )
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('button', { name: /2024/ })).toBeInTheDocument()
  })
})
