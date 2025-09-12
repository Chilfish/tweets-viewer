import { useAppStore } from '~/stores/app-store'
import { MediaViewer } from './media-viewer'

export function MediaPreviewModal() {
  const { mediaPreviewModal, closeMediaPreviewModal } = useAppStore()
  const { isOpen, currentMediaItems, currentMediaIndex } = mediaPreviewModal

  if (!isOpen || currentMediaItems.length === 0) {
    return null
  }

  return (
    <MediaViewer
      isOpen={isOpen}
      onClose={closeMediaPreviewModal}
      mediaItems={currentMediaItems}
      startIndex={currentMediaIndex}
    />
  )
}
