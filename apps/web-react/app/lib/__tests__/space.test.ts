import type { SpaceDetails } from '@tweets-viewer/rettiwt-api'
import { describe, expect, it } from 'vitest'
import {
  formatSpaceDate,
  formatSpaceDuration,
  formatSpaceListeners,
  isSpaceUrl,
  resolveSpacePlaybackState,
} from '../space'

/**
 * X Space 卡片展示层纯逻辑。
 *
 * 断言值对齐官方卡片实测文案（`42:40` / `9月17日` / `2,478`）。
 */

describe('space display formatting', () => {
  it('formats duration, date and listener count', () => {
    expect(formatSpaceDuration(2560946)).toBe('42:40')
    expect(formatSpaceDuration(3723000)).toBe('1:02:03')
    expect(formatSpaceDuration(59000)).toBe('0:59')
    expect(formatSpaceDuration(null)).toBe('')
    expect(formatSpaceDuration(0)).toBe('')
    expect(formatSpaceDuration(Number.NaN)).toBe('')

    // 实测样本：2025-09-17 22:00 (Asia/Shanghai) → 官方卡片「9月17日」，不补前导零
    expect(formatSpaceDate(1758117620659)).toBe('9月17日')
    expect(formatSpaceDate(new Date('2025-09-05T04:00:00Z').getTime())).toBe('9月5日')
    expect(formatSpaceDate(null)).toBe('')

    expect(formatSpaceListeners(2478)).toBe('2,478')
    expect(formatSpaceListeners(1245)).toBe('1,245')
    expect(formatSpaceListeners(0)).toBe('0')
  })

  it('recognises space urls for body de-duplication', () => {
    expect(isSpaceUrl('https://x.com/i/spaces/1yoKMPnjEbOxQ')).toBe(true)
    expect(isSpaceUrl('https://twitter.com/i/spaces/1yoKMPnjEbOxQ')).toBe(true)
    expect(isSpaceUrl('https://x.com/i/spaces/1yoKMPnjEbOxQ?foo=1')).toBe(true)
    expect(isSpaceUrl('https://t.co/gOS5Qc3DS4')).toBe(false)
    expect(isSpaceUrl('https://x.com/BDP_yumemita')).toBe(false)
    expect(isSpaceUrl(undefined)).toBe(false)
  })
})

describe('resolveSpacePlaybackState', () => {
  it('uses availability when present', () => {
    expect(resolveSpacePlaybackState({ availability: 'live', isReplayAvailable: false })).toBe('live')
    expect(resolveSpacePlaybackState({ availability: 'upcoming', isReplayAvailable: false })).toBe('upcoming')
  })

  // 回归：availability 是后加字段，旧数据没有它 —— 曾直接查表拿到 undefined 后崩溃
  it('falls back for data written before availability existed', () => {
    const stale = { isReplayAvailable: true } as unknown as Pick<SpaceDetails, 'availability' | 'isReplayAvailable'>
    expect(resolveSpacePlaybackState(stale)).toBe('replayable')
    expect(resolveSpacePlaybackState({ ...stale, isReplayAvailable: false })).toBe('no-replay')

    // 连 isReplayAvailable 都没有 → 保守不说「可播放」
    expect(resolveSpacePlaybackState({} as unknown as Pick<SpaceDetails, 'availability' | 'isReplayAvailable'>))
      .toBe('no-replay')

    // 墓碑态（unavailable）不是行动区状态，一并保守处理
    expect(resolveSpacePlaybackState({ availability: 'unavailable', isReplayAvailable: false })).toBe('no-replay')
  })
})
