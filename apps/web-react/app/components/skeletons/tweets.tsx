import { TweetSkeleton } from '../tweet/tweet-skeleton'
import { Skeleton } from '../ui/skeleton'

export function TweetsHydrateFallback() {
  return (
    <div className="flex flex-col items-center">
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 h-[45px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2 mb-16 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TweetSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
