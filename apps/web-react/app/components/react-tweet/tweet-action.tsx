import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import {
  BarChart2,
  Heart,
  MessageCircle,
  Repeat2,
  Share,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { formatNumber } from './utils'

interface TweetActionProps {
  tweet: EnrichedTweet
  className?: string
}

export function TweetAction({ tweet, className }: TweetActionProps) {
  const actions = [
    {
      icon: MessageCircle,
      count: tweet.reply_count,
      label: '回复',
      hoverColor: 'hover:text-sky-500',
      hoverBg: 'hover:bg-sky-500/10',
    },
    {
      icon: Repeat2,
      count: tweet.retweet_count ?? 0,
      label: '转发',
      hoverColor: 'hover:text-green-500',
      hoverBg: 'hover:bg-green-500/10',
    },
    {
      icon: Heart,
      count: tweet.like_count,
      label: '喜欢',
      hoverColor: 'hover:text-pink-500',
      hoverBg: 'hover:bg-pink-500/10',
    },
    {
      icon: BarChart2,
      count: tweet.view_count,
      label: '浏览',
      hoverColor: 'hover:text-sky-500',
      hoverBg: 'hover:bg-sky-500/10',
    },
  ]

  return (
    <div
      className={cn(
        'flex items-center justify-between mt-1 text-muted-foreground max-w-[425px]',
        className,
      )}
    >
      {actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-1 group transition-colors cursor-pointer rounded-full active:scale-95',
          )}
          title={action.label}
        >
          <div className={
            cn(
              // 5C-4：触控目标 ≥44px（移动端通过 padding 扩张点击区）
              'flex items-center justify-center group-active:bg-current/10 rounded-full transition-colors p-2 pointer-coarse:p-3.5',
              action.hoverColor,
              action.hoverBg,
            )
          }
          >
            <action.icon className="size-4" />
          </div>
          <span className="text-[0.8rem]">
            {(action.count ?? 0) > 0 ? formatNumber(action.count ?? 0) : ''}
          </span>
        </div>
      ))}

      {/* 分享：语义上是原推文链接（右键复制/修饰键开新标签由原生 a 提供），普通左键渐进增强为系统分享 */}
      <a
        href={tweet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center group transition-colors cursor-pointer p-2 -mr-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10 active:scale-95 pointer-coarse:p-3.5 pointer-coarse:-mr-3.5"
        title="分享"
        onClick={(event) => {
          // 仅拦截普通左键点击：修饰键/中键/右键留给原生链接行为
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return
          if (!navigator.share)
            return
          event.preventDefault()
          navigator.share({ url: tweet.url }).catch(() => {})
        }}
      >
        <div className="p-1">
          <Share className="size-4" />
        </div>
      </a>
    </div>
  )
}
