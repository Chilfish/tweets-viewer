import type { Entity, EntityWithType, RawTweet } from '../types/enriched'

interface InternalEntityRange {
  type: EntityWithType['type']
  indices: [number, number]
  data: any
}

function extractRanges(tweet: RawTweet, leadingMentionEndIndex: number): InternalEntityRange[] {
  const ranges: InternalEntityRange[] = []
  const entitySet = new Set<string>()

  const addRange = (source: any, type: EntityWithType['type']) => {
    if (!source || !source.indices)
      return

    const rawIndices = source.indices as [number, number]
    if (rawIndices[1] <= leadingMentionEndIndex)
      return

    // Media 特殊处理：逻辑长度为0，不参与文本切分
    const effectiveIndices: [number, number] = type === 'media'
      ? [0, 0]
      : [
          Math.max(0, rawIndices[0] - leadingMentionEndIndex),
          Math.max(0, rawIndices[1] - leadingMentionEndIndex),
        ]

    const key = `${effectiveIndices[0]}-${effectiveIndices[1]}-${type}`
    if (entitySet.has(key))
      return
    entitySet.add(key)

    ranges.push({
      type,
      indices: effectiveIndices,
      data: { ...source, type },
    })
  }

  const legacy = tweet.legacy.entities
  const note = tweet.note_tweet?.note_tweet_results?.result.entity_set

  const processSource = (source: any) => {
    if (!source)
      return
    source.hashtags?.forEach((e: any) => addRange(e, 'hashtag'))
    source.user_mentions?.forEach((e: any) => addRange(e, 'mention'))
    source.urls?.forEach((e: any) => addRange(e, 'url'))
    source.symbols?.forEach((e: any) => addRange(e, 'symbol'))
    source.media?.forEach((e: any) => addRange(e, 'media'))
  }

  if (note)
    processSource(note)
  else processSource(legacy)

  return ranges.sort((a, b) => a.indices[0] - b.indices[0])
}

function createFinalEntity(base: any, text: string, index: number): Entity {
  const common = { index, text }
  // 移除 indices 字段，只保留业务数据
  const { indices, ...cleanBase } = base

  switch (base.type) {
    case 'hashtag':
      return { ...cleanBase, ...common, href: `https://twitter.com/hashtag/${base.text}` }
    case 'mention':
      return { ...cleanBase, ...common, href: `https://twitter.com/${base.screen_name}` }
    case 'url':
    case 'media':
      return { ...cleanBase, ...common, href: base.expanded_url, text: base.display_url || text }
    case 'symbol':
      return { ...cleanBase, ...common, href: `https://twitter.com/search?q=%24${base.text}` }
    default:
      return { ...cleanBase, ...common }
  }
}

export function getEntities(tweet: RawTweet, rawText: string): Entity[] {
  const leadingMentionMatch = rawText.match(/^(@\w{1,15}\s*)+/)
  const leadingMentionEndIndex = leadingMentionMatch ? leadingMentionMatch[0].length : 0
  const displayText = rawText.slice(leadingMentionEndIndex)

  const ranges = extractRanges(tweet, leadingMentionEndIndex)
  const result: Entity[] = []
  let cursor = 0
  const textChars = Array.from(displayText)

  const textRanges = ranges.filter(r => r.type !== 'media')

  for (const range of textRanges) {
    const [start, end] = range.indices

    // 填充纯文本片段
    if (cursor < start) {
      const textSegment = textChars.slice(cursor, start).join('')
      if (textSegment) {
        result.push({
          type: 'text',
          text: textSegment,
          index: result.length,
        })
      }
    }

    // 处理功能性实体
    const entityText = textChars.slice(start, end).join('')
    result.push(createFinalEntity(range.data, entityText, result.length))
    cursor = end
  }

  // 尾部文本
  if (cursor < textChars.length) {
    result.push({
      type: 'text',
      text: textChars.slice(cursor).join(''),
      index: result.length,
    })
  }

  // 移除 Media 占位的 Text (如果需要) 并添加 Media Entity
  const mediaRange = ranges.find(range => range.type === 'media')
  if (mediaRange) {
    const mediaUrl = mediaRange.data.url?.trim()
    const idxToRemove = result.findIndex(e => e.type === 'text' && e.text.trim() === mediaUrl)
    if (idxToRemove !== -1)
      result.splice(idxToRemove, 1)

    result.forEach((entity) => {
      if (entity.type === 'text' && entity.text.includes(mediaUrl)) {
        entity.text = entity.text.replace(mediaUrl, '')
      }
    })

    // Media 始终追加在最后，或者根据业务需求放置
    // 这里我们不加入 Media 到 text 流中，通常由 UI 独立渲染组件
    // 但为了保持数据完整性，如果原逻辑需要返回 Media Entity，可以 push
    // result.push(createFinalEntity(mediaRange.data, '', result.length))
  }

  // 重新标准化 index 确保连续
  const standardEntities = result.map((e, i) => ({ ...e, index: i }))

  const legacy = tweet.legacy
  const extendedEntities = legacy?.extended_entities || legacy?.entities
  const mediaList = extendedEntities?.media || []

  const altEntities: Entity[] = []
  mediaList.forEach((media: any, i: number) => {
    if (media.ext_alt_text) {
      altEntities.push({
        type: 'separator',
        text: ' | ',
        index: 30000 + i,
        mediaIndex: i,
      } as Entity)
      altEntities.push({
        type: 'media_alt',
        text: media.ext_alt_text,
        media_url: media.media_url_https,
        index: 20000 + i,
      } as Entity)
    }
  })

  return [...standardEntities, ...altEntities]
}

export function getMediaAltEntities(tweet: RawTweet): Entity[] {
  const legacy = tweet.legacy
  const extendedEntities = legacy?.extended_entities || legacy?.entities
  const mediaList = extendedEntities?.media || []

  const altEntities: Entity[] = []
  mediaList.forEach((media: any, i: number) => {
    if (media.ext_alt_text) {
      // 这里的 Separator 主要是为了让 AI 理解上下文分隔
      // 实际翻译逻辑中可能会被过滤或特殊处理
      // altEntities.push({
      //   type: 'separator',
      //   text: ' | ',
      //   index: 30000 + i,
      //   mediaIndex: i,
      // } as Entity)
      altEntities.push({
        type: 'media_alt',
        text: media.ext_alt_text,
        media_url: media.media_url_https,
        index: 20000 + i,
      } as Entity)
    }
  })
  return altEntities
}
