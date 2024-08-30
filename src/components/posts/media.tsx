import { defineComponent } from 'vue'
import { Image } from '../Image'

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
    return () => (
      <div class="grid grid-cols-2 gap-2">
        {media.map(url => (
          isVideo(url)
            ? <video controls src={url} />
            : <Image src={url} />

        ))}
      </div>
    )
  },
})
