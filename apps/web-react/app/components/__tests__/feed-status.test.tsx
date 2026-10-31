import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FeedStatus } from '../feed-status'

describe('feedStatus', () => {
  it('renders nothing when idle', () => {
    const { container } = render(
      <FeedStatus status="idle" hasItems={false} onRetry={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when fetching without items', () => {
    const { container } = render(
      <FeedStatus status="fetching" hasItems={false} onRetry={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the default empty copy', () => {
    render(<FeedStatus status="ready" hasItems={false} onRetry={() => {}} />)

    expect(screen.getByText('暂无内容')).toBeInTheDocument()
  })

  it('renders custom empty copy', () => {
    render(
      <FeedStatus
        status="exhausted"
        hasItems={false}
        onRetry={() => {}}
        emptyTitle="没有推文"
        emptyDescription="换个用户试试"
      />,
    )

    expect(screen.getByText('没有推文')).toBeInTheDocument()
    expect(screen.getByText('换个用户试试')).toBeInTheDocument()
  })

  it('hides the empty state when the host renders its own', () => {
    const { container } = render(
      <FeedStatus status="ready" hasItems={false} onRetry={() => {}} hideEmptyState />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the full-page error copy and retries', () => {
    const onRetry = vi.fn()
    render(<FeedStatus status="error" hasItems={false} onRetry={onRetry} />)

    expect(screen.getByText('加载失败')).toBeInTheDocument()
    expect(screen.getByText('请检查网络后重试。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders a custom error message', () => {
    render(
      <FeedStatus
        status="error"
        hasItems={false}
        onRetry={() => {}}
        errorMessage="请求超时了"
      />,
    )

    expect(screen.getByText('请求超时了')).toBeInTheDocument()
  })

  it('renders the tail fetching state', () => {
    render(<FeedStatus status="fetching" hasItems onRetry={() => {}} />)

    expect(screen.getByText('正在加载更多…')).toBeInTheDocument()
  })

  it('renders the tail error state and retries', () => {
    const onRetry = vi.fn()
    render(<FeedStatus status="error" hasItems onRetry={onRetry} />)

    expect(screen.getByText('加载失败')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders the tail exhausted copy', () => {
    render(
      <FeedStatus status="exhausted" hasItems onRetry={() => {}} tailText="到底了" />,
    )

    expect(screen.getByText(/到底了/)).toBeInTheDocument()
  })
})
