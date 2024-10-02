<script setup lang="tsx">
import { onBeforeMount } from 'vue'
import { useSeo } from '~/composables'
import { useTweetStore } from '~/stores/tweets'

const tweetStore = useTweetStore()

useSeo()
onBeforeMount(() => {
  if (!tweetStore.isInit) {
    tweetStore.initTweets()
  }
})
</script>

<template>
  <div class="mt-4 flex flex-col gap-2 p-4">
    <p class="">
      网站还在施工中，还是先看看远处的
      <RouterLink
        class="link"
        to="/@ttisrn_0710"
      >
        @立石凛
      </RouterLink>
      吧，要是喜欢也可以看看
      <RouterLink
        class="link"
        to="/@240y_k"
      >
        @西尾夕香
      </RouterLink>
      ，有事就
      <a
        target="_blank"
        href="https://chilfish.top/bili"
        class="link"
      >
        @Chilfish
      </a>
    </p>
    <p>
      其他人的就随缘放上来吧……在做适配中，有些推文不一定有转推；会根据网络情况来是否代理图片；数据不一定会最新同步，在爬取前就删除的就找不回了（也可以手动在互联网档案馆翻）
    </p>
    <p>
      不过是完全出于考古自用的目的来搭建的，会有一些已知的、自己能忍受的小 bug）
    </p>
    <p>
      不过不要当噶比好吗🥺🥺
    </p>
  </div>
</template>

<style lang="css" scoped>
p {
  text-indent: 1rem;
  text-align: justify;
}
</style>
