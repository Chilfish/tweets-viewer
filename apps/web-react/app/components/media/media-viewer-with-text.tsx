import type { formatDate, Tweet, type UserInfo } from '@tweets-viewer/shared'
import type { Slide } from 'yet-another-react-lightbox'
import type { InsMediaItem } from '~/stores/ins-store'
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { Info, X } from 'lucide-react'

import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'

import Video from 'yet-another-react-lightbox/plugins/video'
import { useIsMobile } from '~/hooks/use-mobile'
import { TweetText } from '../tweets/tweet-text'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'

interface InsMediaViewerProps {
  isOpen: boolean
  onClose: () => void
  mediaItems: InsMediaItem[]
  startIndex?: number
  post: Tweet
  user: UserInfo
}

export function MediaViewerWithText({
  isOpen,
  onClose,
  mediaItems,
  startIndex = 0,
  post,
  user,
}: InsMediaViewerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const isMobile = useIsMobile()
  const sheetSide = isMobile ? 'bottom' : 'right'

  const slides = mediaItems.map((item) => {
    if (item.type === 'video') {
      return {
        type: 'video',
        width: item.width,
        height: item.height,
        sources: [
          {
            src: item.url,
            type: 'video/mp4',
          },
        ],
      } as Slide
    }
    return {
      type: 'image',
      src: item.url,
      width: item.width,
      height: item.height,
    } as Slide
  })

  const handleClose = () => {
    setIsSheetOpen(false)
    onClose()
  }

  return (
    <>
      <Lightbox
        open={isOpen}
        close={handleClose}
        slides={slides}
        index={startIndex}
        plugins={[Counter, Video]}
        animation={{
          fade: 250,
          swipe: 300,
        }}
        carousel={{
          padding: '40px',
          spacing: '40px',
          imageFit: 'contain',
        }}
        styles={{
          container: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          },
        }}
        toolbar={{
          buttons: [
            <div className="flex items-center text-gray-100 hover:text-gray-50 absolute right-6 top-5">
              {/* 信息按钮 */}
              <button
                onClick={() => setIsSheetOpen(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="查看详情"
              >
                <Info className="w-6 h-6" />
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>,
          ],
        }}
        render={{
          buttonPrev: mediaItems.length <= 1 ? () => null : undefined,
          buttonNext: mediaItems.length <= 1 ? () => null : undefined,
        }}
        counter={{
          container: {
            style: {
              top: '8px',
              left: '8px',
              bottom: 'unset',
              right: 'unset',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '14px',
            },
          },
        }}
      />

      {/* 详情Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side={sheetSide}
          className="sm:max-w-[36rem] z-[10000] h-fit p-4 px-2 rounded-md mt-20 gap-0"
        >
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">推文详情</SheetTitle>
          </SheetHeader>

          <Card>
            <CardContent className="px-4 overflow-auto max-h-[calc(100vh-18rem)]">
              <div className="flex gap-2">
                <Avatar className="size-10 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-baseline min-w-0 gap-1">
                      <span className="font-semibold text-sm truncate text-card-foreground">
                        {user.name}
                      </span>
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        @
                        {user.screenName}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground flex-shrink-0">
                    {formatDate(post.createdAt)}
                  </div>

                  <TweetText text={post.fullText} />
                </div>
              </div>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
    </>
  )
}
