import { cn } from '~/lib/utils'
import { RichText } from '../RichText'

interface IGCaptionProps {
  username: string
  text: string
  className?: string
}

/**
 * Instagram caption 文本
 */
export function IGCaption({
  username,
  text,
  className,
}: IGCaptionProps) {
  if (!text)
    return null

  return (
    <div className={cn('text-sm leading-relaxed px-4 pb-3', className)}>
      <div className="whitespace-pre-wrap wrap-break-words text-foreground">
        <span className="font-semibold mr-1.5">
          @
          {username}
        </span>
        <RichText
          text={text}
        />
      </div>
    </div>
  )
}
