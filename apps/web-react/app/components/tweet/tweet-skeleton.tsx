import { Skeleton } from '~/components/ui/skeleton'

export function TweetSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 border-b border-border/50">
      {/* Header: Avatar + Meta */}
      <div className="flex gap-3">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 pt-1 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md opacity-60" />
            <Skeleton className="h-3.5 w-12 rounded-md opacity-60 ml-auto" />
          </div>
          {/* Content Lines */}
          <div className="space-y-1.5 mt-1">
            <Skeleton className="h-4 w-[90%] rounded-md" />
            <Skeleton className="h-4 w-[80%] rounded-md" />
            <Skeleton className="h-4 w-[60%] rounded-md" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mt-3 pl-[3.25rem] pr-4">
        <Skeleton className="size-8 rounded-full opacity-50" />
        <Skeleton className="size-8 rounded-full opacity-50" />
        <Skeleton className="size-8 rounded-full opacity-50" />
        <Skeleton className="size-8 rounded-full opacity-50" />
      </div>
    </div>
  )
}
