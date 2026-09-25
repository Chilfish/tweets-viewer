import type { SpaceDetails, SpacePlaybackState } from '@tweets-viewer/rettiwt-api'
import { formatDate } from '@tweets-viewer/shared'

/**
 * X Space 卡片的**展示层**纯逻辑。
 *
 * 数据层映射（卡片识别 / AudioSpaceById → SpaceDetails）在 `packages/rettiwt-api/helper/space`；
 * 这里只做与呈现相关的格式化与状态判定——刻意放在前端，因为 web-react 从 rettiwt-api
 * 只做 type-only 导入，运行时导入会把服务端依赖拖进浏览器 bundle。
 */

/** 正文中的 Space 链接（`x.com/i/spaces/<id>` / `twitter.com/i/spaces/<id>`） */
const SPACE_URL_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/i\/spaces\/[0-9A-Za-z]+/

/** 该 URL 是否指向 X Space 页面（正文据此避免与卡片重复展示同一个跳转） */
export function isSpaceUrl(url?: string | null): boolean {
  return typeof url === 'string' && SPACE_URL_RE.test(url)
}

/** 场次时长 → 官方口径 `42:40`（≥1 小时为 `1:02:03`）；无效时长返回空串 */
export function formatSpaceDuration(ms?: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0)
    return ''

  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  const pad = (n: number) => n.toString().padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`
}

/** 场次日期 → 官方口径 `9月17日`（Asia/Shanghai 口径，不补前导零） */
export function formatSpaceDate(ms?: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0)
    return ''

  const [month, day] = formatDate(ms, { timezone: 'beijing', fmt: 'MM-dd' }).split('-')
  if (!month || !day)
    return ''

  return `${Number(month)}月${Number(day)}日`
}

/** 收听/回放人数 → 千分位 `2,478` */
export function formatSpaceListeners(count: number): string {
  if (!Number.isFinite(count) || count <= 0)
    return '0'
  return count.toLocaleString('en-US')
}

const SPACE_PLAYBACK_STATES: Record<SpacePlaybackState, true> = {
  'replayable': true,
  'live': true,
  'upcoming': true,
  'no-replay': true,
}

/**
 * 解析卡片行动区状态，**兼容旧数据**。
 *
 * `availability` 是后加字段：改动前落地的 `space`（memory LRU / 本地文件 / DB jsonData）
 * 没有它，直接查表会拿到 `undefined` 并在渲染时崩。故此处按早期就存在的
 * `isReplayAvailable` 回退推导；再退化（字段也缺失）时保守取 `no-replay`——
 * 宁可不说「可播放」，也不给一个播不了的承诺。
 */
export function resolveSpacePlaybackState(
  space: Pick<SpaceDetails, 'availability' | 'isReplayAvailable'>,
): SpacePlaybackState {
  const { availability } = space
  if (availability && availability !== 'unavailable' && availability in SPACE_PLAYBACK_STATES)
    return availability as SpacePlaybackState

  return space.isReplayAvailable ? 'replayable' : 'no-replay'
}
