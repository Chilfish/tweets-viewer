import { Skeleton } from '~/components/ui/skeleton'

export function ProfileHeaderSkeleton() {
  return (
    <div className="tweet-container p-0 rounded w-full bg-card border border-border/50 overflow-hidden">
      {/* Banner */}
      <div className="aspect-3/1 w-full relative">
        <Skeleton className="size-full rounded-none" />
      </div>

      <div className="px-4 pb-4">
        {/* Avatar - Overlapping Banner */}
        <div className="relative h-16 sm:h-20 mb-2">
          <div className="absolute -top-[50%] left-0 sm:-top-[60%] p-1 bg-background rounded-full">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background" />
          </div>
        </div>

        {/* User Identity */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md opacity-60" />
        </div>

        {/* Bio */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[85%] rounded-md" />
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap gap-4">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}
