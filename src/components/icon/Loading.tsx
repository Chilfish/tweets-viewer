import type { PropType, Ref } from 'vue'
import { Loader } from 'lucide-vue-next'
import { defineComponent, toValue } from 'vue'

export default defineComponent({
  name: 'Loging',
  props: {
    loading: {
      type: Object as PropType<Ref<boolean> | boolean>,
      required: true,
    },
  },
  setup({ loading }) {
    return () => toValue(loading) && (
      <div
        class="w-full flex items-center justify-center pt-30"
      >
        <Loader class="animate-spin" />
      </div>
    )
  },
})
