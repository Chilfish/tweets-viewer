/** 媒体灯箱 hash 状态化（`#media=<index>`），支持刷新恢复/后退关闭/可分享链接。 */
export const MEDIA_HASH_PREFIX = 'media='

/** 从 location.hash 解析媒体索引；无效返回 null。 */
export function parseMediaHash(hash: string): number | null {
  if (!hash || !hash.startsWith('#'))
    return null
  const raw = hash.slice(1)
  if (!raw.startsWith(MEDIA_HASH_PREFIX))
    return null
  const value = raw.slice(MEDIA_HASH_PREFIX.length)
  if (value === '')
    return null
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : null
}

/** 构建灯箱 hash。 */
export function buildMediaHash(index: number): string {
  return `#${MEDIA_HASH_PREFIX}${index}`
}
