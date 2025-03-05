<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import Image from '~/components/Image.vue'
import { PostText } from '~/components/posts/text'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import Video from '~/components/Video.vue'
import { fallbackUser } from '~/constant'
import { formatDate } from '~/utils/date'
import { request } from '~/utils/fetch'

interface ImgData {
  url: string
  statusId: string
  createdAt: string
  text: string
}

const name = location.pathname.split('/')[1]?.replace('@', '') || fallbackUser

const {
  data: imgData,
  refetch,
  isFetching,
} = useQuery({
  queryKey: ['tweets-pic'],
  queryFn: () =>
    request
      .get<ImgData>('/image/get', {
        id: `tweets-pic-${name}-${Date.now()}`,
        params: {
          name,
        },
      })
      .then((res) => res.data),
  initialData: null,
  refetchOnWindowFocus: false,
})

const isVideo = computed(() => imgData.value?.url.includes('video.twimg.com'))
</script>

<template>
  <div
    class="mx-auto min-h-[50vh] w-[90vw] transition-all space-y-3 md:max-w-[36rem]"
  >
    <Card v-if="imgData">
      <CardContent class="p-0">
        <Image
          v-if="!isVideo"
          class="h-auto w-full rounded-lg object-cover"
          :src="imgData.url"
          :alt="imgData.text.slice(0, 20)"
        />
        <Video
          v-else
          :src="imgData.url"
          :alt="imgData.text.slice(0, 20)"
        />
      </CardContent>

      <CardFooter
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

    <div class="center gap-4 pt-4">
      <Button
        v-if="!isFetching"
        :style="{
          letterSpacing: '0.05rem',
        }"
        variant="outline"
        @click="() => refetch()"
      >
        看看别的
      </Button>

      <RouterLink
        to="/"
        class="px-4 py-2 radix-btn"
        hover="bg-accent text-accent-foreground text-blue"
      >
        返回首页
      </RouterLink>
    </div>
  </div>
</template>
