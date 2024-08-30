import { defineComponent, ref } from 'vue'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Image } from './Image'

export const ImagePreviewer = defineComponent({
  props: {
    src: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
  },
  setup(props) {
    const isOpen = ref(false)
    return () => (
      <Dialog
        open={isOpen.value}
        onUpdate:open={value => (isOpen.value = value)}
      >
        <DialogTrigger asChild>
          <Image
            {...props}
          />
        </DialogTrigger>
        <DialogContent
          class="flex items-center justify-center"
        >
          <Image
            src={props.src}
          />
        </DialogContent>
      </Dialog>
    )
  },
})
