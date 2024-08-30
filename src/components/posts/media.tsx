import { defineComponent } from 'vue'
import { Image } from '../Image'
import { cn } from '~/utils'

function isVideo(url: string) {
  return url.startsWith('https://video.twimg.com/')
}

export const PostMedia = defineComponent({
  props: {
    media: {
      type: Array as () => string[],
      required: true,
    },
  },
  setup({ media }) {
    const size = media.length
    const maxWidth = 1000 // px
    const maxHeight = 500 // px
    const cols = size > 1 ? 2 : 1
    const height = size > 1 ? maxHeight / 2 : maxHeight
    const width = size > 1 ? maxWidth / 2 : maxWidth

    return () => (
      <div
        class={cn('grid gap-2px', `grid-cols-${cols}`)}
      >
        {media.map(url => (
          isVideo(url)
            ? (
                <video
                  controls
                  height={height}
                  width={width}
                  src={url}
                  class="rounded-lg object-contain"
                  style={{
                    maxHeight: `${height}px`,
                  }}
                />
              )
            : (
                <Image
                  height={height}
                  width={width}
                  src={url}
                />
              )
        ))}
      </div>
    )
  },
})
