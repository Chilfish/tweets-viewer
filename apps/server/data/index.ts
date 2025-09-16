import type { Tweet } from '@tweets-viewer/shared'
import rinData from './ttisrn_0710.json'

const insData = {
  ttisrn_0710: rinData,
} as {
  [name: string]: Tweet[]
}

export function getInsData({
  page,
  reverse,
  name,
}: {
  page: number
  reverse: boolean
  name: string
}) {
  let data = (insData[name] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  if (!reverse) {
    data = data.toReversed()
  }

  return data.slice(page * 10, (page + 1) * 10)
}
