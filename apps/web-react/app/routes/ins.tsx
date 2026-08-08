import type { IGPost, IGUserInfo, PaginatedResponse } from '@tweets-viewer/shared'
import type { Route } from './+types/ins'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { isAxiosError } from 'axios'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { IGPostSkeleton } from '~/components/ins/IGPostSkeleton'
import { InstagramPostCard } from '~/components/ins/InstagramPostCard'
import { InfiniteScrollTrigger } from '~/components/tweet/InfiniteScrollTrigger'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { Button } from '~/components/ui/button'
import { apiClient } from '~/lib/utils'
import { useIGStore } from '~/store/use-ig-store'

interface InsLoaderData {
  user: IGUserInfo | null
  posts: PaginatedResponse<IGPost>
  /** 加载失败时的错误信息（区别于 404 空态：404 是"无 IG 归档"业务态，不设 error） */
  error?: string | null
}

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name} on Instagram` },
    { name: 'description', content: `Instagram posts from @${name}` },
  ]
}

export const handle = {
  isWide: false,
  skeleton: <IGPostSkeleton />,
}

export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const { name } = params
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1

  try {
    const { data } = await apiClient.get<InsLoaderData>(`/ins/${name}`, {
      params: { page },
    })
    return data
  }
  catch (err) {
    // 404 = 该用户无 IG 归档，属正常业务态：返回空数据让组件渲染空态 UI，
    // 而非抛给 root ErrorBoundary（会整页替换、且 SSR 首屏 hydration 时错位）。
    // 其他错误（网络/5xx）显式传给组件渲染"加载失败"，不伪装成空态。
    if (isAxiosError(err) && err.response?.status === 404) {
      return {
        posts: { data: [], meta: { total: 0, page: 0, pageSize: 0, hasMore: false } },
        user: null,
      } as InsLoaderData
    }

    console.error('IG load failed:', err)
    return {
      posts: { data: [], meta: { total: 0, page: 0, pageSize: 0, hasMore: false } },
      user: null,
      error: 'Instagram 数据加载失败，请重试',
    } as InsLoaderData
  }
}

export default function InsPage({ loaderData, params }: Route.ComponentProps) {
  const { posts: paginatedPosts, error } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const { posts, status, setStatus, appendPosts, resetStream } = useIGStore()
  const prevFilterKey = useRef<string>('')
  const filterKey = params.name

  useEffect(() => {
    let shouldReset = false
    if (prevFilterKey.current !== filterKey) {
      shouldReset = true
      prevFilterKey.current = filterKey
    }

    if (shouldReset || page === 1) {
      resetStream()
    }

    if (paginatedPosts.data.length > 0) {
      appendPosts(paginatedPosts.data)
    }

    if (!paginatedPosts.meta.hasMore) {
      setStatus('exhausted')
    }
    else {
      setStatus('ready')
    }
  }, [paginatedPosts, filterKey, page, resetStream, appendPosts, setStatus])

  // --- Error state: loader 显式标记的加载失败（区别于 404 空态）
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-5xl mb-2">⚠️</div>
        <p className="text-lg font-semibold">加载失败</p>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <Button
          variant="secondary"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          重新加载
        </Button>
      </div>
    )
  }

  // --- Empty state (defensive: server should 404 in this case, but just in case)
  if (!paginatedPosts.meta.total && paginatedPosts.data.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-5xl mb-2">📭</div>
        <p className="text-lg font-semibold">No Instagram Data</p>
        <p className="text-sm text-muted-foreground max-w-md">
          @
          {params.name}
          {' '}
          的 Instagram 数据未归档
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(paginatedPosts.meta.total / PAGE_SIZE)

  const handleLoadMore = () => {
    if (status === 'fetching' || status === 'exhausted' || status === 'error')
      return
    setSearchParams((prev) => {
      const currentP = Number(prev.get('page')) || 1
      prev.set('page', (currentP + 1).toString())
      return prev
    }, { replace: true })
  }

  return (
    <>
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4 mb-16">
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <InstagramPostCard key={post.id} post={post} />
          ))}
        </div>

        {posts.length === 0 && status === 'ready' && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-base font-medium">No posts found</p>
            <p className="text-sm opacity-70">
              @
              {params.name}
              {' '}
              has no archived posts yet.
            </p>
          </div>
        )}

        <InfiniteScrollTrigger
          onIntersect={handleLoadMore}
          disabled={status === 'fetching' || status === 'exhausted' || status === 'error'}
        />

        {status === 'exhausted' && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4 italic">
            All posts loaded
          </p>
        )}
      </div>
    </>
  )
}
