/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import type { ReactNode } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Video from 'yet-another-react-lightbox/plugins/video'

import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'

import { X } from 'lucide-react'
import type { MediaItem } from '~/stores/media-store'
import type { TweetMedia } from '~/types'

interface MediaViewerProps {
  isOpen: boolean
  onClose: () => void
  mediaItems: MediaItem[] | TweetMedia[]
  startIndex?: number
  additionalToolbarContent?: ReactNode
}

export function MediaViewer({
  isOpen,
  onClose,
  mediaItems,
  startIndex = 0,
  additionalToolbarContent,
}: MediaViewerProps) {
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
      }
    }
    return {
      src: item.url,
      width: item.width,
      height: item.height,
    }
  })

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={startIndex}
      plugins={[Counter, Video]}
      closeOnBackdropClick
      animation={{
        fade: 250,
        swipe: 300,
      }}
      carousel={{
        padding: '40px',
        spacing: '20vw',
        imageFit: 'contain',
      }}
      gestures={{
        swipeToClose: true,
        panToZoom: true,
        scrollToZoom: true,
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 1.5,
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        },
      }}
      toolbar={{
        buttons: [
          <div className='flex gap-4 items-center text-gray-100 hover:text-gray-50 absolute right-6 top-5'>
            {additionalToolbarContent}
            <button onClick={onClose}>
              <X className='size-8' />
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
  )
}
