import type { EnrichedTweet, MediaAnimatedGif, MediaVideo as TMediaVideo } from '@tweets-viewer/rettiwt-api'
import { useRef, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import {
  getMediaUrl,
  getMp4Video,
} from './utils'

interface Props {
  tweet: EnrichedTweet
  media: MediaAnimatedGif | TMediaVideo
  showCoverOnly?: boolean
}

export function TweetMediaVideo({ tweet, media, showCoverOnly }: Props) {
  'use no memo'

  const [showPlayButton, setShowPlayButton] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mp4Video = getMp4Video(media)

  const handlePlayClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const video = videoRef.current
    if (!video)
      return

    await video.play()
    video.focus()
    setShowPlayButton(false)
  }

  const videoButtonClasses = 'absolute flex w-12 h-12 items-center justify-center bg-[#1d9bf0] hover:bg-[#1a8cd8] focus-visible:bg-[#1a8cd8] transition-colors duration-200 border-4 border-white rounded-full cursor-pointer'
  const imageClasses = 'absolute inset-0 m-0 object-cover object-center w-full h-full'

  if (showCoverOnly) {
    return (
      <>
        <MediaImage
          src={getMediaUrl(media, 'large')}
          alt="Video"
          className={imageClasses}
          draggable
        />
        <button
          type="button"
          className={videoButtonClasses}
          aria-label="View video on X"
        >
          <svg
            viewBox="0 0 24 24"
            className="ml-[3px] w-[calc(50%+4px)] h-[calc(50%+4px)] max-w-full text-white fill-current select-none"
            aria-hidden="true"
          >
            <g>
              <path d="M21 12L4 2v20l17-10z"></path>
            </g>
          </svg>
        </button>
      </>
    )
  }

  return (
    <>
      <MediaVideo
        ref={videoRef}
        className={imageClasses}
        poster={getMediaUrl(media, 'small')}
        controls={!showPlayButton}
        playsInline
        tabIndex={showPlayButton ? -1 : 0}
      >
        <source
          src={`https://proxy.chilfish.top/${mp4Video.url}`}
          type={mp4Video.content_type}
        />
      </MediaVideo>

      {showPlayButton && (
        <button
          type="button"
          className={videoButtonClasses}
          aria-label="View video on X"
          onClick={handlePlayClick}
        >
          <svg
            viewBox="0 0 24 24"
            className="ml-[3px] w-[calc(50%+4px)] h-[calc(50%+4px)] max-w-full text-white fill-current select-none"
            aria-hidden="true"
          >
            <g>
              <path d="M21 12L4 2v20l17-10z"></path>
            </g>
          </svg>
        </button>
      )}
    </>
  )
}
