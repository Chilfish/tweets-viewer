import type { EnrichedTweet, RawTweet } from '../types/enriched'
import type { IAudioSpace } from '../types/raw/space/Details'
import { describe, expect, it, vi } from 'vitest'
import { FetchResourcesGroup } from '../collections/Groups'
import { Requests } from '../collections/Requests'
import { ResourceType } from '../enums/Resource'
import {
  attachSpaceDetails,
  extractAudiospaceId,
  extractSpaceIdFromUrl,
  mapSpaceDetails,
  resolveSpaceId,
} from '../helper/space'
import { SpaceRequests } from '../requests/Space'
import { loadFixture } from './helpers/load-fixture'

/**
 * Space 卡片纯逻辑（无网络、无 React）+ 请求层接线。
 *
 * 样本全部为真实上游响应固化：推文 `1968314084207788302` 的 `card`（audiospace）、
 * Space `1yoKMPnjEbOxQ` 的 `AudioSpaceById` 响应，以及已删除 Space `1DGLdvzVZmLGm`
 * 的响应（只有 `is_subscribed`、无 metadata）。断言值对齐官方卡片实测文案
 * （`2,478 人がリスニング/リプレイ` / `9月17日` / `42:40`）。
 */

const SPACE_ID = '1yoKMPnjEbOxQ'

const card = loadFixture<unknown>('space/audio-space-card.json')
const audioSpace = loadFixture<IAudioSpace>('space/audio-space-ended.json')
const unavailableSpace = loadFixture<IAudioSpace>('space/audio-space-unavailable.json')
const fixtureTweet = loadFixture<EnrichedTweet>('tweets/with-space-ja.json')

/** 以真实 metadata 为底派生待测场次：只翻转被考察的字段，保留真实结构 */
function derived(over: Record<string, unknown>): Record<string, any> {
  return {
    metadata: { ...audioSpace.metadata, ...over },
  }
}

function enriched(over: Partial<EnrichedTweet> = {}): EnrichedTweet {
  return {
    id: '1968314084207788302',
    url: 'https://twitter.com/BDP_yumemita/status/1968314084207788302',
    lang: 'zxx',
    created_at: 'Wed Sep 17 14:00:21 +0000 2025',
    text: 'https://t.co/gOS5Qc3DS4',
    user: fixtureTweet.user,
    entities: fixtureTweet.entities,
    ...over,
  } as EnrichedTweet
}

function rawTweet(cardData: unknown, restId = '1968314084207788302'): RawTweet {
  return { rest_id: restId, card: cardData, legacy: {} } as unknown as RawTweet
}

describe('audiospace card detection', () => {
  it('extracts the space id from the real audiospace card', () => {
    expect(extractAudiospaceId(card)).toBe(SPACE_ID)
  })

  it('returns null for anything that is not an audiospace card', () => {
    expect(extractAudiospaceId(undefined)).toBeNull()
    expect(extractAudiospaceId({})).toBeNull()
    expect(extractAudiospaceId({ legacy: { name: 'summary_large_image', binding_values: [] } })).toBeNull()
    // 名称像 audiospace 但没有 id binding / 没有 binding_values
    expect(extractAudiospaceId({
      legacy: { name: '3691233323:audiospace', binding_values: [{ key: 'card_url', value: { string_value: 'x' } }] },
    })).toBeNull()
    expect(extractAudiospaceId({ legacy: { name: '3691233323:audiospace' } })).toBeNull()
    // 也支持已是 legacy 层的直接传入（无 legacy 包裹）
    expect(extractAudiospaceId({ name: '3691233323:audiospace', binding_values: [{ key: 'id', value: { string_value: 'abc' } }] })).toBe('abc')
  })
})

describe('AudioSpaceById metadata mapping', () => {
  const space = mapSpaceDetails(SPACE_ID, audioSpace, fixtureTweet.user)

  it('maps the real metadata onto the card fields', () => {
    expect(space).not.toBeNull()

    expect(space!.id).toBe(SPACE_ID)
    expect(space!.url).toBe('https://x.com/i/spaces/1yoKMPnjEbOxQ')
    // 标题含 CJK + emoji，未被截断
    expect(space!.title).toBe('#ゆめみた合宿3日目！ついに最終日！✨コメントはハッシュタグにてお願いします✨')
    expect(space!.state).toBe('Ended')
    expect(space!.isReplayAvailable).toBe(true)
    expect(space!.availability).toBe('replayable')

    // 官方卡片 42:40 = ended_at - started_at
    expect(space!.startedAt).toBe(1758117620659)
    expect(space!.endedAt).toBe(1758120181605)
    expect(space!.durationMs).toBe(2560946)

    // 官方卡片 2,478 人がリスニング/リプレイ = 直播收听 + 回放
    expect(space!.liveListenersCount).toBe(1245)
    expect(space!.replayCount).toBe(1233)
    expect(space!.listenersCount).toBe(2478)

    expect(space!.host.name).toBe('夢限大みゅーたいぷ')
    expect(space!.host.screen_name).toBe('BDP_yumemita')
    expect(space!.host.id_str).toBe('1546362523561390081')
    expect(space!.host.profile_image_url_https).toContain('pbs.twimg.com/profile_images/')
  })

  it('fills verification from the tweet author when the host is the author', () => {
    // AudioSpaceById 的 creator_results 是精简对象：不含 is_blue_verified / verified_type
    const creator = (audioSpace.metadata as any).creator_results.result
    expect(creator.is_blue_verified).toBeUndefined()
    expect(creator.legacy.verified_type).toBeUndefined()

    // 推文作者对象更完整，同账号时补齐——否则官方卡片上的认证徽标会丢
    expect(space!.host.is_blue_verified).toBe(true)
    expect(space!.host.verified_type).toBe('Business')

    // 不同账号（非主播）不借用认证
    const other = mapSpaceDetails(SPACE_ID, audioSpace, {
      ...fixtureTweet.user,
      screen_name: 'someone_else',
      is_blue_verified: true,
      verified_type: 'Government',
    })
    expect(other!.host.is_blue_verified).toBe(false)
    expect(other!.host.verified_type).toBeUndefined()
  })
})

describe('malformed metadata degrades without throwing', () => {
  it('drops the card only when the space id itself is unknown', () => {
    // 没有 id 就无法构造任何 URL —— 唯一返回 null 的情形
    expect(mapSpaceDetails('', audioSpace)).toBeNull()
    expect(mapSpaceDetails('', undefined)).toBeNull()
  })

  it('degrades partial metadata instead of throwing', () => {
    // 无标题：仍返回（标题空），不整块丢弃
    const noTitle = mapSpaceDetails(SPACE_ID, derived({ title: '' }))
    expect(noTitle).not.toBeNull()
    expect(noTitle!.title).toBe('')
    expect(noTitle!.availability).toBe('replayable')

    // 进行中场次（无 ended_at）→ 不抛错，时长缺失
    const live = mapSpaceDetails(SPACE_ID, derived({ state: 'Running', ended_at: undefined }))
    expect(live!.durationMs).toBeNull()
    expect(live!.state).toBe('Running')

    // 缺 creator_results → 主播信息为空，但标题/人数仍在
    const noCreator = mapSpaceDetails(SPACE_ID, derived({ creator_results: undefined }))
    expect(noCreator!.title).toContain('ゆめみた合宿3日目')
    expect(noCreator!.host.screen_name).toBe('')
    expect(noCreator!.host.name).toBe('')
    expect(noCreator!.listenersCount).toBe(2478)

    // 人数缺失 → 归一为 0，不产生 NaN
    const noCounts = mapSpaceDetails(SPACE_ID, derived({
      total_live_listeners: undefined,
      total_replay_watched: undefined,
    }))
    expect(noCounts!.listenersCount).toBe(0)

    // 上游时间戳非法 → 时长缺失，不抛错
    expect(mapSpaceDetails(SPACE_ID, derived({ ended_at: 'not-a-number' }))!.durationMs).toBeNull()
  })
})

describe('request layer targets AudioSpaceById', () => {
  it('builds an AudioSpaceById request with replays enabled', () => {
    const config = SpaceRequests.details(SPACE_ID)

    expect(config.method).toBe('get')
    expect(config.url).toContain('/graphql/HPEisOmj1epUNLCWTYhUWw/AudioSpaceById')

    const variables = JSON.parse(config.params.variables)
    expect(variables.id).toBe(SPACE_ID)
    expect(variables.withReplays).toBe(true)
  })

  it('the resource is registered for fetching (wiring guard)', () => {
    expect(ResourceType.SPACE_DETAILS).toBe('SPACE_DETAILS')
    // 未注册进 FetchResourcesGroup 会被 _validateArgs 判为无效资源，请求静默失败
    expect(FetchResourcesGroup).toContain(ResourceType.SPACE_DETAILS)
    expect(Requests[ResourceType.SPACE_DETAILS]({ id: SPACE_ID }).url).toContain('AudioSpaceById')
  })
})

describe('deleted / inaccessible space becomes a tombstone', () => {
  it('maps a metadata-less response to the unavailable state', () => {
    expect(unavailableSpace.metadata).toBeUndefined()

    const space = mapSpaceDetails('1DGLdvzVZmLGm', unavailableSpace)

    expect(space).not.toBeNull()
    expect(space!.availability).toBe('unavailable')
    expect(space!.id).toBe('1DGLdvzVZmLGm')
    // 墓碑仍需可跳转地址（由 card binding 的 id 构造，不依赖 metadata）
    expect(space!.url).toBe('https://x.com/i/spaces/1DGLdvzVZmLGm')
    expect(space!.title).toBe('')
    expect(space!.listenersCount).toBe(0)
    expect(space!.durationMs).toBeNull()
    expect(space!.isReplayAvailable).toBe(false)
    expect(space!.host.name).toBe('')
    expect(space!.host.screen_name).toBe('')
  })

  it('treats a missing audioSpace node the same way', () => {
    expect(mapSpaceDetails('1DGLdvzVZmLGm', null)!.availability).toBe('unavailable')
    expect(mapSpaceDetails('1DGLdvzVZmLGm', undefined)!.availability).toBe('unavailable')
    expect(mapSpaceDetails('1DGLdvzVZmLGm', {})!.availability).toBe('unavailable')
  })

  // 回归：无卡片的 Space 推文过去会被整条漏掉 —— 只认 card binding 的 id
  it('resolves the space id from the body link when there is no card', () => {
    const cardless = loadFixture<{
      card: unknown
      entities: Array<{ expanded_url: string, href?: string }>
    }>('space/audio-space-cardless-tweet.json')

    expect(cardless.card).toBeNull()
    // 只有卡片时才有 id，此处为空
    expect(extractAudiospaceId(cardless.card)).toBeNull()

    const entities = cardless.entities.map(e => ({ ...e, href: e.expanded_url }))
    expect(resolveSpaceId(cardless.card, entities)).toBe('1djGXroNWDExZ')

    // 卡片优先于正文链接
    expect(resolveSpaceId(card, entities)).toBe(SPACE_ID)

    // 既无卡片也无 Space 链接 → null
    expect(resolveSpaceId(null, [{ href: 'https://example.com/a' }])).toBeNull()
    expect(resolveSpaceId(null, [])).toBeNull()
    expect(resolveSpaceId(undefined, undefined)).toBeNull()

    // 该 Space 同样已删除 → 墓碑态
    const space = mapSpaceDetails('1djGXroNWDExZ', unavailableSpace)
    expect(space!.availability).toBe('unavailable')
    expect(space!.url).toBe('https://x.com/i/spaces/1djGXroNWDExZ')
  })

  it('extracts the space id from a space url', () => {
    expect(extractSpaceIdFromUrl('https://x.com/i/spaces/1djGXroNWDExZ')).toBe('1djGXroNWDExZ')
    expect(extractSpaceIdFromUrl('https://twitter.com/i/spaces/1yoKMPnjEbOxQ?foo=1')).toBe('1yoKMPnjEbOxQ')
    expect(extractSpaceIdFromUrl('https://x.com/BDP_yumemita')).toBeNull()
    expect(extractSpaceIdFromUrl('https://t.co/ELCNFX5yGy')).toBeNull()
    expect(extractSpaceIdFromUrl(undefined)).toBeNull()
  })
})

describe('availability drives whether playback is offered', () => {
  it('only an ended space with replay enabled is replayable', () => {
    expect(mapSpaceDetails(SPACE_ID, audioSpace)!.availability).toBe('replayable')
    // 已结束但主办方未开启回放 —— 没有录音可放，不得给播放入口
    expect(mapSpaceDetails(SPACE_ID, derived({ is_space_available_for_replay: false }))!.availability)
      .toBe('no-replay')
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'TimedOut', is_space_available_for_replay: false }))!.availability)
      .toBe('no-replay')
  })

  it('classifies live and upcoming spaces', () => {
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'Running' }))!.availability).toBe('live')
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'NotStarted' }))!.availability).toBe('upcoming')
    // 大小写不敏感（上游 state 大小写不保证）
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'running' }))!.availability).toBe('live')
  })

  it('replay-disabled space still shows its metadata', () => {
    const noReplay = mapSpaceDetails(SPACE_ID, derived({ is_space_available_for_replay: false }))!
    // 回放关闭只是「不能播」，元数据照常展示（官方卡片也仍列出人数/时长）
    expect(noReplay.title).toContain('ゆめみた合宿3日目')
    expect(noReplay.listenersCount).toBe(2478)
    expect(noReplay.durationMs).toBe(2560946)
    expect(noReplay.host.name).toBe('夢限大みゅーたいぷ')
  })
})

describe('attachSpaceDetails wires space onto enriched tweets', () => {
  it('resolves the space from the card binding and attaches the mapped details', async () => {
    const tweets = [enriched()]
    const fetchSpace = vi.fn().mockResolvedValue(audioSpace)

    await attachSpaceDetails(tweets, [rawTweet(card)], fetchSpace)

    expect(fetchSpace).toHaveBeenCalledWith(SPACE_ID)
    expect(tweets[0]!.space).toMatchObject({ id: SPACE_ID, availability: 'replayable', listenersCount: 2478 })
  })

  it('falls back to the body link when the tweet has no card', async () => {
    const tweets = [enriched()]
    const fetchSpace = vi.fn().mockResolvedValue(unavailableSpace)

    await attachSpaceDetails(tweets, [rawTweet(null)], fetchSpace)

    expect(fetchSpace).toHaveBeenCalledWith(SPACE_ID)
    expect(tweets[0]!.space).toMatchObject({ id: SPACE_ID, availability: 'unavailable' })
  })

  it('de-duplicates upstream calls per space id within a batch', async () => {
    const tweets = [enriched({ id: '1' }), enriched({ id: '2' })]
    const fetchSpace = vi.fn().mockResolvedValue(audioSpace)

    await attachSpaceDetails(tweets, [rawTweet(null), rawTweet(null)], fetchSpace)

    // 两条推文指向同一个 Space → 只打一次上游
    expect(fetchSpace).toHaveBeenCalledTimes(1)
    expect(fetchSpace).toHaveBeenCalledWith(SPACE_ID)
    expect(tweets[0]!.space).toMatchObject({ id: SPACE_ID })
    expect(tweets[1]!.space).toMatchObject({ id: SPACE_ID })
  })

  it('does not fabricate a tombstone when the upstream call fails', async () => {
    const tweets = [enriched()]
    const fetchSpace = vi.fn().mockRejectedValue(new Error('429 Too Many Requests'))

    await expect(attachSpaceDetails(tweets, [rawTweet(card)], fetchSpace)).resolves.toBeUndefined()

    expect(tweets[0]!.space).toBeUndefined()
  })

  it('leaves tweets without any space reference untouched', async () => {
    const tweets = [enriched({ entities: [{ type: 'text', index: 0, text: 'hello' }] })]
    const fetchSpace = vi.fn()

    await attachSpaceDetails(tweets, [rawTweet(null)], fetchSpace)

    expect(fetchSpace).not.toHaveBeenCalled()
    expect(tweets[0]!.space).toBeUndefined()
  })
})
