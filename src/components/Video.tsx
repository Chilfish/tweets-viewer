import { defineComponent, onMounted, ref } from 'vue'

export const Video = defineComponent({
  props: {
    src: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
  },
  setup(props) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const video = entry.target as HTMLVideoElement

          video.src = props.src
          video.onerror = (e) => {
            console.error(e)
            video.src = ''
          }
          observer.unobserve(entry.target)
        }
      })
    })

    const videoRef = ref<HTMLVideoElement | null>(null)

    onMounted(() => {
      if (videoRef.value) {
        observer.observe(videoRef.value)
      }
    })

    return () => (
      <video
        controls
        ref={videoRef}
        height={props.height}
        width={props.width}
        class="rounded-lg object-contain"
        style={{
          maxHeight: `${props.height}px`,
        }}
      />
    )
  },
})
