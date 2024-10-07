<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Image from '~/components/Image.vue'
import { PostText } from '~/components/posts/text'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { formatDate } from '~/utils'

interface ImgData {
  url: string
  statusId: string
  createdAt: string
  text: string
}

const imgData = ref<ImgData | null>(null)
const isLoading = ref(false)

async function fetchImgData() {
  isLoading.value = true
  imgData.value = null

  imgData.value = await fetch('/api/img').then(res => res.json())
  isLoading.value = false
}

onMounted(async () => {
  await fetchImgData()
})
</script>

<template>
  <div
    class="mx-auto min-h-50vh flex flex-col justify-center transition-all container space-y-3"
    md="max-w-2xl"
  >
    <Card
      v-if="imgData"
    >
      <CardContent class="p-0">
        <Image
          class="h-auto w-full"
          :src="imgData.url"
          :alt="imgData.text.slice(0, 20)"
          @error="fetchImgData"
        />
      </CardContent>

      <CardFooter
        v-if="imgData.statusId"
        class="flex flex-col items-start p-4"
      >
        <PostText
          :text="imgData.text"
        />
        <a
          class="h-auto p-0 text-sm text-gray-500"
          hover="underline"
          :href="`https://twitter.com/user/status/${imgData.statusId}`"
          target="_blank"
        >
          {{ formatDate(imgData.createdAt) }}
        </a>
      </CardFooter>
    </Card>

    <div
      v-else
      class="mx-auto h-30rem w-full flex flex-col sm:w-50vw space-y-3"
    >
      <Skeleton class="h-full rounded-xl" />
      <div class="space-y-4">
        <Skeleton class="h-4 w-15rem" />
        <Skeleton class="h-4 w-10rem" />
      </div>
    </div>

    <Button
      v-if="!isLoading"
      :style="{
        letterSpacing: '0.05rem',
      }"
      class="mx-auto mt-4 w-full"
      variant="ghost"
      @click="fetchImgData"
    >
      看看别的
    </Button>
  </div>
</template>
