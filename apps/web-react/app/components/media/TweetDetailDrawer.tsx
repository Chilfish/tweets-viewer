import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { MyTweet } from '~/components/tweet/Tweet'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Sheet, SheetContent } from '~/components/ui/sheet'

interface TweetDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTweet: EnrichedTweet | undefined
}

export function TweetDetailDrawer({
  open,
  onOpenChange,
  currentTweet,
}: TweetDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[82vh] rounded-t-xl transition-all duration-200 ease-out"
      >
        <div className="overflow-y-auto h-full">
          <ScrollArea>
            {currentTweet && (
              <MyTweet
                tweet={currentTweet}
                tweetAuthorName={currentTweet.user.name}
                hideMedia
              />
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
