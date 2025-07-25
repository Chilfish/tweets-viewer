<script setup lang="tsx">
import { useSeo } from '~/composables'

useSeo()
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
      吧，小蓝鸟按钮可查看已有数据的列表，有事就找
      <a
        target="_blank"
        href="https://chilfish.top/bili"
        class="link"
      >
        @Chilfish
      </a>
    </p>
    <p>
      还新做了个
      <RouterLink
        class="link"
        to="/@ttisrn_0710/pic"
      >
        随机每日一凛
      </RouterLink>
      的页面，也可以看看。不过是手动筛的，可能会混入别人）
    </p>
    <p>
      其他人的就随缘放上来吧，在做适配中……
    </p>
    <ul>
      <li>
        可能会漏掉一些转推；
      </li>
      <li>
        数据不一定会最新同步，在爬取前就删除的就找不回了
      </li>
      <li>
        显示已删除的推文，可以点击推文右下角按钮转到互联网档案馆查看备份
      </li>
    </ul>
    <p>
      不过是完全出于考古自用的目的来搭建的，会有一些已知的、自己能忍受的小 bug）
    </p>
    <p>
      不要当噶比好吗🥺🥺
    </p>
  </div>
</template>

<style lang="css" scoped>
p {
  text-indent: 1rem;
  text-align: justify;
}

ul {
  list-style-type: disc;
}

li {
  margin-left: 3rem;
}
</style>
