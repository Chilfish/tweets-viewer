import type { ReactNode } from 'react'
import type { StreamStatus } from '~/hooks/use-url-paginated-stream'
import { Inbox, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface FeedStatusProps {
  status: StreamStatus
  /** 当前流是否已有条目（决定渲染"尾部状态"还是"空态/全页错误态"） */
  hasItems: boolean
  onRetry: () => void
  /** 空态图标（默认 Inbox） */
  emptyIcon?: ReactNode
  /** 空态主文案 */
  emptyTitle?: string
  /** 空态副文案 */
  emptyDescription?: string
  /** 全页错误态副文案（默认通用文案） */
  errorMessage?: string
  /** 尾部"已全部加载"文案 */
  tailText?: string
  className?: string
}

/**
 * 列表四态统一状态组件（5C-1）。
 *
 * 收敛 tweets / memo / media / search / ins 五条列表流的既有手写状态：
 * - **尾部状态**（已有内容）：加载更多 spinner / 加载失败+重试 / 已全部加载分隔尾
 * - **空态**（无内容且 ready/exhausted）：图标 + 主副文案
 * - **全页错误态**（无内容且 error）：图标 + 文案 + 重试按钮
 *
 * 所有状态切换带 `animate-in fade-in`，视觉上淡入淡出不跳变；
 * 文案全中文、图标用 lucide（aria-hidden，避免与相邻文字重复朗读）。
 */
export function FeedStatus({
  status,
  hasItems,
  onRetry,
  emptyIcon,
  emptyTitle = '暂无内容',
  emptyDescription,
  errorMessage = '网络开小差了，请稍后重试。',
  tailText = '已加载全部内容',
  className,
}: FeedStatusProps) {
  if (status === 'idle')
    return null

  // ── 尾部状态（已有内容时的加载/错误/已全部加载）──
  if (hasItems) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-8 mt-2 border-t border-border/50 animate-in fade-in duration-200',
          className,
        )}
      >
        {status === 'fetching' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            <span className="text-sm font-medium">正在加载更多...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-destructive font-medium">加载失败</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              点击重试
            </Button>
          </div>
        )}

        {status === 'exhausted' && (
          <p className="text-sm text-muted-foreground py-2 italic select-none">
            —
            {' '}
            {tailText}
            {' '}
            —
          </p>
        )}
      </div>
    )
  }

  // ── 空态 / 全页错误态（无内容）──
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-20 text-center animate-in fade-in duration-200',
        className,
      )}
    >
      {status === 'error' ? (
        <>
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
            <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold">加载失败</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {errorMessage}
          </p>
          <Button variant="secondary" className="mt-2" onClick={onRetry}>
            重新加载
          </Button>
        </>
      ) : (
        <>
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/60">
            {emptyIcon ?? <Inbox className="size-8 text-muted-foreground/60" aria-hidden="true" />}
          </div>
          <p className="text-base font-semibold">{emptyTitle}</p>
          {emptyDescription && (
            <p className="text-sm text-muted-foreground max-w-md">{emptyDescription}</p>
          )}
        </>
      )}
    </div>
  )
}
