import type { HTMLAttributes } from 'react'
import { cn } from '~/lib/utils'

export function Skeleton({ style, className }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('tweet-skeleton block w-full', className)}
      style={style}
    />
  )
}
