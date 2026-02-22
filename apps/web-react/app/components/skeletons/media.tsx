import { useMediaColumns } from '~/hooks/use-media-columns'
import { Skeleton } from '../ui/skeleton'

export function MediaWallSkeleton() {
  const columns = useMediaColumns()
  // Generate dummy skeletons distributed in columns
  const skeletonHeights = [
    220,
    380,
    280,
    200,
    320,
    240,
    180,
    300,
    260,
    340,
    210,
    290,
  ]

  const buckets = Array.from({ length: columns }, () => [] as number[])
  skeletonHeights.forEach((h, i) => {
    buckets[i % columns].push(h)
  })

  return (
    <div className="flex gap-2 items-start w-full">
      {buckets.map((bucket, i) => (
        <div key={i} className="flex-1 space-y-2">
          {bucket.map((height, j) => (
            <Skeleton
              key={j}
              className="w-full rounded-lg"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function MediaHydrateFallback() {
  return (
    <div className="flex flex-col items-center">
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-7 w-32 rounded-md" />
        </div>
      </div>
      <MediaWallSkeleton />
    </div>
  )
}
