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
        'flex items-center justify-between mt-1 text-[#536471] dark:text-[#71767b] max-w-[425px]',
        className,
      )}
    >
      {actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-1 group transition-colors cursor-pointer rounded-full',
          )}
          title={action.label}
        >
          <div className={
            cn(
              'flex items-center justify-center group-active:bg-current/10 rounded-full transition-colors p-2',
              action.hoverColor,
              action.hoverBg,
            )
          }
          >
            <action.icon className="size-4" />
          </div>
          <span className="text-[0.8rem]">
            {action.count > 0 ? formatNumber(action.count) : ''}
          </span>
        </div>
      ))}

      <button
        className="flex items-center group transition-colors cursor-pointer p-2 -mr-2 rounded-full hover:text-sky-500 hover:bg-sky-500/10"
        title="分享"
      >
        <div className="p-1">
          <Share className="size-4" />
        </div>
      </button>
    </div>
  )
}
