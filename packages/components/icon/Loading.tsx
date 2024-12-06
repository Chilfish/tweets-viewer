import { Loader } from 'lucide-vue-next'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Loading',
  props: {
    loading: {
      type: Boolean,
      default: true,
    },
  },
  setup({ loading }) {
    return () => loading && (
      <div
        class="w-full flex items-center justify-center pt-10"
      >
        <Loader class="animate-spin" />
      </div>
    )
  },
})
