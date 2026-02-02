import { Skeleton } from './skeleton'
import { TweetContainer } from './tweet-container'

export function TweetSkeleton() {
  return (
    <TweetContainer className="pointer-events-none pb-1">
      <Skeleton style={{ height: '3rem', marginBottom: '0.75rem' }} />
      <Skeleton style={{ height: '6rem', margin: '0.5rem 0' }} />
      <div className="border-t border-[rgb(207,217,222)] dark:border-[rgb(66,83,100)] my-2" />
      <Skeleton
        style={{
          height: '2rem',
        }}
      />
      <Skeleton
        className="rounded-full mt-2"
        style={{
          height: '2rem',
        }}
      />
    </TweetContainer>
  )
}
