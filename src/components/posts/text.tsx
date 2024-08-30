import { defineComponent } from 'vue'

export const PostText = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup({ text }) {
    // TODO: 解析文本
    return () => (
      <p class="py-2">
        {text}
      </p>
    )
  },
})
