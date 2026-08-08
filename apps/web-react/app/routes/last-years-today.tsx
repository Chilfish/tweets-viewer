import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/last-years-today'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { CalendarDays, History } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useRevalidator, useRouteLoaderData, useSearchParams } from 'react-router'
import { TweetsHydrateFallback } from '~/components/skeletons/tweets'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetFeedStatus } from '~/components/tweet/TweetFeedStatus'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { groupTweetsByYear } from '~/lib/group-tweets-by-year'
import { apiClient, cn } from '~/lib/utils'
import { useTweetStore } from '~/store/use-tweet-store'

export const handle = {
  isWide: false,
  skeleton: <TweetsHydrateFallback />,
}
export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `那年今日 - @${name}` },
    { name: 'description', content: `查看 @${name} 在往年今天的推文` },
  ]
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const reverse = url.searchParams.get('reverse') === 'true'
  try {
    const { data: paginatedTweets } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/get/${name}/last-years-today`, {
      params: {
        page,
        reverse,
        pageSize: PAGE_SIZE,
      },
    })

    return {
      paginatedTweets,
    }
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Response('User not found', { status: 404 })
    }
    throw error
  }
}

function YearDivider({ year, className }: { year: number, className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center gap-3 px-1', className)}>
      <span className="text-sm font-semibold tracking-wide text-foreground/70">
        {year > 0 ? year : '年份未知'}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}

/** 「那年今日」仪式感头部：大字日期 + 回忆总数。 */
function RitualHeader({ name, totalCount }: { name: string, totalCount: number }) {
  const todayLabel = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col items-center gap-1 px-4 pb-4 pt-8 text-center">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
        <CalendarDays className="size-3.5" />
        那年今日 · On This Day
      </div>
      <h1 className="mt-1 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl">
        {todayLabel}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        @
        {name}
        {' '}
        在往年今天留下过
        <span className="font-semibold text-foreground">
          {' '}
          {totalCount}
          {' '}
        </span>
        条回忆
      </p>
      <div className="mt-5 h-px w-16 bg-border" />
    </div>
  )
}

export default function LastYearsTodayPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'

  const { tweets, status, setStatus, appendTweets, resetStream } = useTweetStore()
  const revalidator = useRevalidator()
  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser

  const prevFilterKey = useRef<string>('')
  const filterKey = `${params.name}-${reverse}`

  useEffect(() => {
    let shouldReset = false
    if (prevFilterKey.current !== filterKey) {
      shouldReset = true
      prevFilterKey.current = filterKey
    }

    if (shouldReset || page === 1) {
      resetStream()
    }

    if (paginatedTweets.data.length > 0) {
      appendTweets(paginatedTweets.data)
    }

    if (!paginatedTweets.meta.hasMore) {
      setStatus('exhausted')
    }
    else {
      setStatus('ready')
    }
  }, [paginatedTweets, filterKey, page, resetStream, appendTweets, setStatus])

  const totalCount = paginatedTweets.meta?.total ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const yearGroups = groupTweetsByYear(tweets)

  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return

    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  const renderTweets = () => {
    if (status !== 'fetching' && tweets.length === 0) {
      return (
        <div className="py-12 text-center flex flex-col gap-2 items-center justify-center text-muted-foreground">
          <History className="size-12 opacity-20" />
          <p>往年今天还没有留下回忆</p>
        </div>
      )
    }

    return (
      <>
        <div className="flex flex-col gap-3">
          {yearGroups.map((group, idx) => (
            <section key={`${group.year}-${idx}`}>
              <YearDivider year={group.year} className={idx === 0 ? 'mt-2' : 'mt-8'} />
              {group.tweets.map(tweet => (
                <MyTweet
                  tweet={tweet}
                  tweetAuthorName={user?.fullName ?? name ?? ''}
                  key={tweet.id}
                />
              ))}
            </section>
          ))}
        </div>

        <TweetFeedStatus
          status={status}
          hasTweets={tweets.length > 0}
          onRetry={() => revalidator.revalidate()}
        />

        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          disabled={status === 'fetching' || status === 'exhausted' || status === 'error'}
        />
      </>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions hideComments />
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mt-4 mb-16">
        <RitualHeader name={params.name ?? ''} totalCount={totalCount} />
        {renderTweets()}
      </div>
    </>
  )
}
