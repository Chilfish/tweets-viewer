import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/last-years-today'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { History } from 'lucide-react'
import { useRouteLoaderData, useSearchParams } from 'react-router'
import { TweetsHydrateFallback } from '~/components/skeletons/tweets'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { FeedStatus } from '~/components/feed-status'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { useUrlPaginatedStream } from '~/hooks/use-url-paginated-stream'
import { groupTweetsByYear } from '~/lib/group-tweets-by-year'
import { apiClient, cn } from '~/lib/utils'

export const handle = {
  isWide: false,
  pageTransition: 'fade',
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

/** 「那年今日」仪式感头部：大字日期 + 回忆总数（@name 不重复，上方已有 ProfileHeader）。 */
function RitualHeader({ totalCount }: { totalCount: number }) {
  const todayLabel = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col items-center gap-1 px-4 pb-5 pt-6 text-center">
      <h1 className="bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-6xl font-bold tracking-tight text-transparent md:text-7xl">
        {todayLabel}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        往年今日，共
        <span className="mx-1 font-semibold text-foreground">{totalCount}</span>
        条回忆
      </p>
      <div className="mt-5 h-px w-12 bg-border/70" />
    </div>
  )
}

export default function LastYearsTodayPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets } = loaderData
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'

  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser

  const { items, status, total, loadMore, retry } = useUrlPaginatedStream<EnrichedTweet>({
    pageData: paginatedTweets,
    extract: data => data.data,
    filterKey: `${params.name}-${reverse}`,
    page,
    fetchNextPage: async ({ cursor }) => {
      try {
        const { data } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/get/${params.name}/last-years-today`, {
          params: {
            page: page + 1,
            pageSize: PAGE_SIZE,
            reverse,
            cursor,
          },
        })
        return data
      }
      catch {
        return null
      }
    },
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const yearGroups = groupTweetsByYear(items)

  const renderTweets = () => {
    if (status !== 'fetching' && items.length === 0) {
      return (
        <div className="py-12 text-center flex flex-col gap-2 items-center justify-center text-muted-foreground">
          <History className="size-12 opacity-20" />
          <p>往年今天还没有留下回忆</p>
        </div>
      )
    }

    return (
      <>
        <div
          key={searchParams.toString()}
          className="flex flex-col divide-y divide-border/40 animate-in fade-in duration-300"
        >
          {yearGroups.map((group, idx) => (
            <section key={`${group.year}-${idx}`}>
              <YearDivider year={group.year} className={idx === 0 ? 'mt-2' : 'mt-8'} />
              {group.tweets.map(tweet => (
                <MyTweet
                  tweet={tweet}
                  tweetAuthorName={user?.fullName ?? params.name ?? ''}
                  key={tweet.id}
                  containerClassName="animate-in slide-in-from-bottom-2 duration-300"
                />
              ))}
            </section>
          ))}
        </div>

        <FeedStatus
          status={status}
          hasItems={items.length > 0}
          onRetry={retry}
          tailText="已加载全部回忆"
        />

        <InfiniteScrollTrigger
          onIntersect={loadMore}
          disabled={status !== 'ready'}
        />
      </>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions hideComments hideDateRange />
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mt-4 mb-16">
        <RitualHeader totalCount={total} />
        {renderTweets()}
      </div>
    </>
  )
}
