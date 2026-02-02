import type { StreamStatus } from '~/store/use-tweet-store'
import { Loader2 } from 'lucide-react'

interface TweetFeedStatusProps {
  status: StreamStatus
  hasTweets: boolean
  onRetry: () => void
}

/**
 * 纯逻辑组件：负责展示列表底部的状态
 */
export function TweetFeedStatus({ status, hasTweets, onRetry }: TweetFeedStatusProps) {
  if (status === 'idle')
    return null

  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-20 border-t border-border/50 mt-4">
      {status === 'fetching' && (
        <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-300">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm font-medium">正在获取更多推文...</span>
        </div>
      )}

      {status === 'exhausted' && (
        <p className="text-sm text-muted-foreground py-4 italic select-none">
          — 已加载全部归档推文 —
        </p>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
          <p className="text-sm text-destructive font-medium">加载失败</p>
          <button
            onClick={onRetry}
            className="text-xs px-3 py-1 bg-secondary hover:bg-secondary/80 rounded transition-colors shadow-sm"
          >
            点击重试
          </button>
        </div>
      )}

      {!hasTweets && status === 'ready' && (
        <div className="text-center p-12 text-muted-foreground animate-in fade-in">
          <p className="text-base font-medium">该用户暂无推文归档。</p>
          <p className="text-sm opacity-70">Archive appears to be empty.</p>
        </div>
      )}
    </div>
  )
}
