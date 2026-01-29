import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import type { Route } from './+types/media'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { PaginatedResponse } from './tweets'
import { apiUrl } from '@tweets-viewer/shared'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr/immutable'

import { UserTabs } from '~/components/layout/user-tabs'
import { MediaWall } from '~/components/media/MediaWall'
import { ProfileHeaderSkeleton } from '~/components/profile/profile-header-skeleton'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { TweetNavigation } from '~/components/tweet/TweetNavigation'
import { TweetsToolbarActions } from '~/components/tweets/tweets-toolbar-actions'
import { useUserStore } from '~/store/use-user-store'

const PAGE_SIZE = 20

// 扁平化的媒体项接口用于瀑布流
export interface FlatMediaItem {
  id: string // 组合ID: tweetId + mediaIndex
  tweetId: string
  mediaIndex: number // 当前媒体在推文中的索引
  url: string
  type: 'photo' | 'video' | 'animated_gif'
  width: number
  height: number
  aspectRatio: number
  videoInfo?: any
  createdAt: string
  tweet: EnrichedTweet // 保留原始推文引用，用于点击查看详情
}

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Media` },
    { name: 'description', content: `Media gallery from @${name}` },
  ]
}

async function getTweets(username: string, page: number, reverse: boolean, start?: string, end?: string) {
  const { data } = await axios.get<PaginatedResponse<EnrichedTweet>>(`${apiUrl}/tweets/get/${username}`, {
    params: { page, reverse, pageSize: PAGE_SIZE, start, end },
  })
  return data
}

export default function MediaPage({ params }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const reverse = searchParams.get('reverse') === 'true'
  const start = searchParams.get('start') || undefined
  const end = searchParams.get('end') || undefined

  const { activeUser, setActiveUser } = useUserStore()
  const [mediaItems, setMediaItems] = useState<FlatMediaItem[]>([])

  // 1. 获取推文数据
  const { data: paginatedResponse, isLoading, error } = useSWR(
    [params.name, 'tweets-media-source', page, reverse, start, end],
    ([name, _, p, rev, s, e]) => getTweets(name, p, rev, s, e),
    { revalidateOnFocus: false },
  )

  const rawTweets = paginatedResponse?.data
  const meta = paginatedResponse?.meta

  // 2. 数据处理：提取并打平媒体
  useEffect(() => {
    if (rawTweets) {
      const flatMedia: FlatMediaItem[] = []
      const seenUrls = new Set<string>() // 用于去重

      rawTweets.forEach((tweet) => {
        // 排除转推的内容（通过 retweeted_original_id 判断）
        if (tweet.retweeted_original_id) {
          return
        }

        // 只处理当前推文的直接媒体，不包括引用推文的媒体
        if (tweet.media_details && tweet.media_details.length > 0) {
          tweet.media_details.forEach((media, index) => {
            const url = media.media_url_https

            // 去重
            if (seenUrls.has(url)) {
              return
            }
            seenUrls.add(url)

            // 计算宽高比，防止除以零
            const w = media.original_info?.width || 1000
            const h = media.original_info?.height || 1000
            const aspectRatio = h / w // 注意：瀑布流通常需要高度/宽度，以便计算占位高度

            flatMedia.push({
              id: `${tweet.id}-${index}`,
              tweetId: tweet.id,
              mediaIndex: index,
              url,
              type: media.type,
              width: w,
              height: h,
              aspectRatio,
              videoInfo: (media as any).video_info,
              createdAt: tweet.created_at,
              tweet,
            })
          })
        }
      })

      setMediaItems(flatMedia)
    }
  }, [rawTweets])

  // 3. 用户信息同步
  const { data: userData } = useSWR(
    !activeUser || activeUser.userName !== params.name ? [params.name, 'user'] : null,
    async ([name]) => {
      const { data } = await axios.get(`${apiUrl}/users/get/${name}`)
      return data
    },
  )

  useEffect(() => {
    if (userData) {
      setActiveUser(userData)
    }
  }, [userData, setActiveUser])

  const user = activeUser && activeUser.userName === params.name ? activeUser : userData

  const totalTweets = meta?.total ?? user?.statusesCount ?? 0
  const totalPages = Math.ceil(totalTweets / PAGE_SIZE)

  return (
    <main className="min-h-svh bg-background flex flex-col items-center">
      {user ? (
        <div className="w-full flex flex-col items-center gap-2 py-6">
          <ProfileHeader user={user} />
          <UserTabs user={user} />
        </div>
      ) : (
        <div className="w-full flex justify-center py-6">
          <ProfileHeaderSkeleton />
        </div>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all">
        <div className="w-full max-w-6xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
          <TweetNavigation totalPages={totalPages} />
          <TweetsToolbarActions />
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 mt-6 mb-20">
        <MediaWall
          items={mediaItems}
          isLoading={isLoading}
          isEmpty={!isLoading && mediaItems.length === 0}
        />

        {!isLoading && mediaItems.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8 opacity-50">
            显示第
            {' '}
            {page}
            {' '}
            页推文中的媒体内容
          </p>
        )}
      </div>
    </main>
  )
}
