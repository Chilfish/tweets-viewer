import { Skeleton } from '~/components/ui/skeleton'

export function InsProfileHeaderSkeleton() {
  return (
    <div className="tweet-container p-0 rounded w-full bg-card border-2 border-border/50 overflow-hidden min-h-fit">
      <div className="px-4 sm:px-5 py-5 sm:py-6">
        {/* Avatar + Stats row */}
        <div className="flex items-start gap-4 sm:gap-6 mb-4">
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shrink-0" />

          <div className="flex-1 pt-1 space-y-2">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md opacity-60" />

            {/* Stats */}
            <div className="flex gap-5 sm:gap-6 mt-3">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2 mt-1">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[70%] rounded-md" />
        </div>

        {/* External URL */}
        <Skeleton className="h-4 w-40 rounded-md mt-2 opacity-60" />
      </div>
    </div>
  )
}
