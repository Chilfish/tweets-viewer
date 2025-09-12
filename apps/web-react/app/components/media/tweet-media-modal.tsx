import { ExternalLink } from 'lucide-react'
import { useAppStore } from '~/stores/app-store'
import { MediaViewer } from './media-viewer'

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
    !isOpen ||
    !currentTweet ||
    !currentUser ||
    currentMediaItems.length === 0
  ) {
    return null
  }

  const tweetUrl = `https://twitter.com/${currentUser.screenName}/status/${currentTweet.tweetId}`

  const additionalToolbarContent = (
    <a
      href={tweetUrl}
      target='_blank'
      rel='noopener noreferrer'
      title='View on Twitter'
      className='text-gray-200 w-fit p-2'
    >
      <ExternalLink className='size-6' />
    </a>
  )

  return (
    <MediaViewer
      isOpen={isOpen}
      onClose={closeTweetMediaModal}
      mediaItems={currentMediaItems}
      startIndex={currentMediaIndex}
      additionalToolbarContent={additionalToolbarContent}
    />
  )
}
