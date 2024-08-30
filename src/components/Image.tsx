import { defineComponent, onMounted, ref } from 'vue'
import { placeholderSVG } from '~/constant'

export const Image = defineComponent({
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: 'Image',
    },
    width: Number,
    height: Number,
  },
  setup(props) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = props.src
          img.onerror = () => {
            img.src = placeholderSVG
          }
          observer.unobserve(entry.target)
        }
      })
    })

    const imgRef = ref<HTMLImageElement | null>(null)
    onMounted(() => {
      if (imgRef.value) {
        observer.observe(imgRef.value)
      }
    })

    return () => (
      <img
        ref={imgRef}
        alt={props.alt}
        class="rounded-lg object-cover"
        height={props.height}
        width={props.width}
        src={placeholderSVG}
        style={{
          aspectRatio: `${props.width}/${props.height}`,
          objectFit: 'cover',
          height: `${props.height}px`,
          width: `${props.width}px`,
        }}
      />
    )
  },
})
