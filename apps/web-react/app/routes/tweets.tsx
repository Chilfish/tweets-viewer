import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/tweets'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { useRouteLoaderData, useSearchParams } from 'react-router'
import { TweetsHydrateFallback } from '~/components/skeletons/tweets'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { MyTweet } from '~/components/tweet/Tweet'
import { FeedStatus } from '~/components/feed-status'
import { DateDivider } from '~/components/tweet/date-divider'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweet/tweets-toolbar-actions'
import { YearNavigator } from '~/components/tweet/year-navigator'
import { useUrlPaginatedStream } from '~/hooks/use-url-paginated-stream'
import { groupTweetsByDay } from '~/lib/group-tweets-by-day'
import { apiClient } from '~/lib/utils'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name} 的推文` },
    { name: 'description', content: `查看 @${name} 的全部归档推文` },
  ]
}

export const handle = {
  isWide: false,
  pageTransition: 'slide',
  skeleton: <TweetsHydrateFallback />,
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const reverse = url.searchParams.get('reverse') === 'true'
  const start = url.searchParams.get('start') || undefined
  const end = url.searchParams.get('end') || undefined
  const noReplies = url.searchParams.get('no_replies') === 'true'

  try {
    const { data: paginatedTweets } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/get/${name}`, {
      params: {
        page,
        reverse,
        pageSize: PAGE_SIZE,
        start,
        end,
        noReplies,
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

export default function TweetsPage({ loaderData, params }: Route.ComponentProps) {
  const { paginatedTweets } = loaderData
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined
  const noReplies = searchParams.get('no_replies') === 'true'

  const layoutData = useRouteLoaderData('rootLayout') as { activeUser: EnrichedUser | null }
  const user = layoutData?.activeUser

  const { items, status, total, loadMore, retry } = useUrlPaginatedStream<EnrichedTweet>({
    pageData: paginatedTweets,
    extract: data => data.data,
    filterKey: `${params.name}-${reverse}-${start}-${end}-${noReplies}`,
    page,
    fetchNextPage: async ({ cursor }) => {
      try {
        const { data } = await apiClient.get<PaginatedResponse<EnrichedTweet>>(`/tweets/get/${params.name}`, {
          params: {
            page: page + 1,
            pageSize: PAGE_SIZE,
            reverse,
            start,
            end,
            noReplies,
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

  const totalCount = total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const dayGroups = groupTweetsByDay(items)

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <div className="flex min-w-0 items-center gap-1">
            <YearNavigator name={params.name} />
            <TweetsToolbarActions />
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mb-16">
        {/* 5B-3：URL 驱动的跳页/筛选变化 → 整页内容淡入（key 随 search 变化重挂载）；
            滚动续载不写 URL → key 不变，仅新追加的推文触发各自的入场动画，避免整屏闪动。
            5E-1：流式布局去卡片边框；5E-2：跨天日期分隔线（iOS 消息分组范式） */}
        <div
          key={searchParams.toString()}
          className="flex flex-col animate-in fade-in duration-300"
        >
          {dayGroups.map((group, idx) => (
            <section key={`${group.dateKey}-${idx}`}>
              <DateDivider dateKey={group.dateKey} className={idx === 0 ? 'pt-1' : 'pt-3'} />
              <div className="flex flex-col divide-y divide-border/40">
                {group.tweets.map(tweet => (
                  <MyTweet
                    tweet={tweet}
                    tweetAuthorName={user?.fullName ?? params.name ?? ''}
                    key={tweet.id}
                    containerClassName="animate-in slide-in-from-bottom-2 duration-300"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <FeedStatus
          status={status}
          hasItems={items.length > 0}
          onRetry={retry}
          emptyTitle="该用户暂无推文归档"
          emptyDescription="归档中还没有任何推文。"
          tailText="已加载全部归档推文"
        />

        <InfiniteScrollTrigger
          onIntersect={loadMore}
          disabled={status !== 'ready'}
        />
      </div>
    </>
  )
}
