import { useAppStore } from '~/stores/app-store'
import { MediaViewerWithText } from './media-viewer-with-text'

export function TweetMediaModal() {
  const { tweetMediaModal, closeTweetMediaModal } = useAppStore()
  const {
    isOpen,
    currentMediaItems,
    currentMediaIndex,
    currentTweet,
    currentUser,
  } = tweetMediaModal

  if (
    !isOpen
    || !currentTweet
    || !currentUser
    || currentMediaItems.length === 0
  ) {
    return null
  }

  return (
    <MediaViewerWithText
      isOpen={isOpen}
      onClose={closeTweetMediaModal}
      mediaItems={currentMediaItems.map(item => ({
        ...item,
        postId: currentTweet.tweetId,
        fullText: currentTweet.fullText,
      }))}
      startIndex={currentMediaIndex}
      post={currentTweet}
      user={currentUser}
    />
  )
}
