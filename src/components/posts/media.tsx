import { defineComponent } from 'vue'
import { ImagePreviewer } from '../ImagePreviewer'
import { Video } from '../Video'

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
        class="grid gap-2px"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {media.map(url => (
          isVideo(url)
            ? (
                <Video
                  height={height}
                  width={width}
                  src={url}
                />
              )
            : (
                <ImagePreviewer
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
