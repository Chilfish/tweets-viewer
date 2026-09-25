import type { EnrichedTweet, SpaceDetails } from '@tweets-viewer/rettiwt-api'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TweetBody } from '~/components/react-tweet'
import { fixtureSpaceDetails, makeTweet } from '~/test/vrt-fixtures'
import { TweetSpaceCard } from '../TweetSpaceCard'

/**
 * X Space 卡片渲染与正文去重。
 *
 * 覆盖五种可播放状态（可回放 / 直播中 / 尚未开始 / 不可回放 / 已删除墓碑）
 * 与「无 space 数据空渲染」，以及正文不再重复渲染同一个 Space 链接。
 */

const SPACE_URL = 'https://x.com/i/spaces/1yoKMPnjEbOxQ'

function withSpace(space: SpaceDetails | undefined): EnrichedTweet {
  return makeTweet({ space })
}

describe('tweetSpaceCard', () => {
  it('renders nothing when there is no space data', () => {
    const { container } = render(<TweetSpaceCard tweet={withSpace(undefined)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the official card structure for a replayable space', () => {
    render(<TweetSpaceCard tweet={withSpace(fixtureSpaceDetails)} />)

    // 整卡即跳转（本期不站内播放）
    const card = screen.getByRole('link', { name: /播放录音/ })
    expect(card).toHaveAttribute('href', SPACE_URL)
    expect(card).toHaveAttribute('target', '_blank')
    expect(card).toHaveAttribute('rel', expect.stringContaining('noopener'))

    expect(screen.getByText('夢限大みゅーたいぷ')).toBeInTheDocument()
    expect(screen.getByText(/ゆめみた合宿3日目/)).toBeInTheDocument()
    expect(screen.getByText('2,478 人收听/回放')).toBeInTheDocument()
    expect(screen.getByText('9月17日')).toBeInTheDocument()
    expect(screen.getByText('42:40')).toBeInTheDocument()
    expect(screen.getByText('播放录音')).toBeInTheDocument()
  })

  it('renders an explanatory tombstone for a deleted / inaccessible space', () => {
    render(
      <TweetSpaceCard tweet={withSpace({
        ...fixtureSpaceDetails,
        availability: 'unavailable',
        title: '',
        listenersCount: 0,
        durationMs: null,
      })}
      />,
    )

    expect(screen.getByText('Space 已删除或不可访问')).toBeInTheDocument()
    // 仍给一个可核实的入口
    expect(screen.getByRole('link', { name: '在 X 查看' })).toHaveAttribute('href', SPACE_URL)
    // 不可用态不得出现播放入口
    expect(screen.queryByText('播放录音')).not.toBeInTheDocument()
    expect(screen.queryByText('42:40')).not.toBeInTheDocument()
  })

  it('does not offer playback when replay is disabled', () => {
    render(
      <TweetSpaceCard tweet={withSpace({
        ...fixtureSpaceDetails,
        isReplayAvailable: false,
        availability: 'no-replay',
      })}
      />,
    )

    expect(screen.getByText('录音不可回放')).toBeInTheDocument()
    expect(screen.queryByText('播放录音')).not.toBeInTheDocument()
    // 元数据照常展示（官方卡片也仍列出人数/时长）
    expect(screen.getByText('2,478 人收听/回放')).toBeInTheDocument()
    expect(screen.getByText('42:40')).toBeInTheDocument()
  })

  it('labels live and upcoming spaces', () => {
    const { unmount } = render(
      <TweetSpaceCard tweet={withSpace({
        ...fixtureSpaceDetails,
        state: 'Running',
        availability: 'live',
        endedAt: null,
        durationMs: null,
      })}
      />,
    )
    expect(screen.getByText('直播中')).toBeInTheDocument()
    // 进行中无录音 → 不显示时长
    expect(screen.queryByText('42:40')).not.toBeInTheDocument()
    unmount()

    render(
      <TweetSpaceCard tweet={withSpace({
        ...fixtureSpaceDetails,
        state: 'NotStarted',
        availability: 'upcoming',
      })}
      />,
    )
    expect(screen.getByText('尚未开始')).toBeInTheDocument()
  })

  // 回归：availability 是后加字段，旧数据没有它 —— 曾直接查表拿到 undefined 后崩溃
  it('resolves a playback state for space data without availability', () => {
    const stale = { ...fixtureSpaceDetails, availability: undefined } as unknown as SpaceDetails
    render(<TweetSpaceCard tweet={withSpace(stale)} />)
    expect(screen.getByText('播放录音')).toBeInTheDocument()
  })
})

describe('tweetBody space link de-duplication', () => {
  const entities = [{
    type: 'url',
    index: 0,
    url: 'https://t.co/gOS5Qc3DS4',
    text: 'x.com/i/spaces/1yoKM…',
    display_url: 'x.com/i/spaces/1yoKM…',
    expanded_url: SPACE_URL,
    href: SPACE_URL,
  }] as unknown as EnrichedTweet['entities']

  it('hides the space url when the card is rendered', () => {
    const { container } = render(
      <TweetBody tweet={makeTweet({ entities, space: fixtureSpaceDetails })} />,
    )

    expect(container.textContent).not.toContain('x.com/i/spaces')
    expect(container.querySelector(`a[href="${SPACE_URL}"]`)).toBeNull()
  })

  it('keeps the space url when metadata could not be fetched', () => {
    render(<TweetBody tweet={makeTweet({ entities })} />)

    expect(screen.getByRole('link', { name: 'x.com/i/spaces/1yoKM…' })).toBeInTheDocument()
  })
})
