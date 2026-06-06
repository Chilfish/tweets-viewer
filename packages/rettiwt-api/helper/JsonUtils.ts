/**
 * Search for all the sub-objects (even deep-nested ones) that have the given key-value pair(filter).
 *
 * @param data - The data on which search is to be performed.
 * @param key - The key of the key-value pair to search.
 * @param value - The value of the key-value pait to search.
 * @returns The list of sub-objects from the given object, having the given key-value pair.
 *
 * @internal
 */
/**
 * Search for all the sub-objects (even deep-nested ones) that have the given key-value pair(filter).
 *
 * Uses iterative traversal to avoid stack overflow on deeply nested API responses.
 *
 * @param data - The data on which search is to be performed.
 * @param key - The key of the key-value pair to search.
 * @param value - The value of the key-value pait to search.
 * @returns The list of sub-objects from the given object, having the given key-value pair.
 *
 * @internal
 */
export function findByFilter<T>(data: NonNullable<unknown>, key: string, value: string): T[] {
  const result: T[] = []
  const visited = new Set<unknown>()
  const queue: unknown[] = [data]

  let idx = 0
  while (idx < queue.length) {
    const current = queue[idx++]!

    // Guard against circular references
    if (visited.has(current))
      continue
    if (current !== null && typeof current === 'object')
      visited.add(current)

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item)
      }
    }
    else if (current !== null && typeof current === 'object') {
      const obj = current as Record<string, unknown>
      if (key in obj && obj[key] === value) {
        result.push(current as T)
      }
      for (const v of Object.values(obj)) {
        if (v !== null && typeof v === 'object')
          queue.push(v)
      }
    }
  }

  return result
}

/**
 * Searches for the key which has the given value in the given object.
 *
 * @param data - The data on which search is to be performed.
 * @param value - The value to search.
 * @returns The key with the given value.
 *
 * @internal
 */
export function findKeyByValue(data: NonNullable<unknown>, value: string): string | undefined {
  // Finding the key-value pairs that have the given value
  const kvPair = Object.entries(data).filter(([, v]) => v === value)[0]

  // If a match is found
  if (kvPair) {
    return kvPair[0]
  }
  // If no match is found
  else {
    return undefined
  }
}
