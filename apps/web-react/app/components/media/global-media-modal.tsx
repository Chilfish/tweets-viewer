/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useAppStore } from '~/stores/app-store'
import { MediaPreviewModal } from './media-preview-modal'
import { TweetMediaModal } from './tweet-media-modal'

export function GlobalMediaModal() {
  const { tweetMediaModal, mediaPreviewModal } = useAppStore()

  return (
    <>
      {/* 推文媒体模态框 - 用于 media-grid，显示推文详情 */}
      {tweetMediaModal.isOpen &&
        tweetMediaModal.currentTweet &&
        tweetMediaModal.currentUser &&
        tweetMediaModal.currentMediaItems.length > 0 && <TweetMediaModal />}

      {/* 媒体预览模态框 - 用于 tweet-card，仅预览媒体 */}
      {mediaPreviewModal.isOpen &&
        mediaPreviewModal.currentMediaItems.length > 0 && <MediaPreviewModal />}
    </>
  )
}
