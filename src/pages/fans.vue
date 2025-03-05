<script setup lang="ts">
import { gsap } from 'gsap'
import { onMounted, reactive, ref } from 'vue'
import { proxyUrl } from '~/constant'

const uid =
  new URLSearchParams(document.location.search).get('uid') || '3546759743670773'
const user = reactive({
  name: '',
  fans: 0,
  avatar: '',
})

const error = ref('')

async function fetcher(url: string) {
  const res = await fetch(`${proxyUrl}${url}`)
  if (!res.ok) {
    error.value = '获取接口失败，请稍后再试。'
    return null
  }

  try {
    const data = await res.json()
    if (data.code !== 0) {
      error.value = data.message
      return null
    }
    return data
  } catch (err) {
    error.value = '由于触发哔哩哔哩安全风控策略，该次访问请求被拒绝。'
    console.error(err)
    return null
  }
}

async function fetchFans() {
  const res = await fetcher(
    `https://api.bilibili.com/x/relation/stat?vmid=${uid}`,
  )
  if (!res) return 0

  return res.data.follower
}

async function getInfo() {
  const dom = await fetch(`${proxyUrl}https://space.bilibili.com/${uid}`)
    .then((res) => res.text())
    .catch(() => {
      error.value = '获取用户信息失败，请稍后再试。'
      return ''
    })

  // get from <title> tag
  const title = dom.match(/<title>(.*?)<\/title>/)
  if (!title) return

  user.name = title[1].split('的个人空间-')[0]

  const avatar = dom.match(/<link rel="apple-touch-icon" href="(.*?)">/)
  if (avatar) user.avatar = avatar[1]
}

const tweened = reactive({
  fans: 0,
})
const diff = ref(0)

onMounted(async () => {
  let retried = 0

  await getInfo()
  user.fans = await fetchFans()

  const timer = setInterval(async () => {
    const res = await fetchFans()

    if (res === 0) {
      if (retried < 3) {
        retried++
        return
      }
      error.value = '获取粉丝数失败，请稍后再试。'
      clearInterval(timer)
    }

    user.fans = res
    gsap.to(tweened, {
      fans: user.fans,
      duration: 0.5,
    })

    if (tweened.fans) {
      gsap.to(diff, {
        value: user.fans - tweened.fans,
        duration: 0.5,
      })
    }
  }, 3000)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-8">
    <div class="flex items-center justify-center gap-4">
      <Avatar size="base">
        <AvatarImage
          :alt="`User avatar for ${user.name}`"
          :src="user.avatar"
        />
        <AvatarFallback>{{ user.name }}</AvatarFallback>
      </Avatar>
      <h1
        class="text-center text-3xl font-bold"
      >
        <a
          :href="`https://space.bilibili.com/${uid}`"
          target="_blank"
          rel="noopener noreferrer"
          class="from-red to-pink-9 bg-gradient-to-r bg-clip-text text-transparent underline-offset-5 hover:underline"
        >
          {{ user.name }}
        </a>
      </h1>
    </div>
    <h2
      class="text-center text-3xl font-bold"
    >
      Bilibili fans:  {{ tweened.fans.toFixed(0) }}

      <span class="text-xl">
        <span
          v-if="diff > 0"
          class="text-green-500"
        >
          +{{ diff.toFixed(0) }}
        </span>
        <span
          v-else-if="diff < 0"
          class="text-red-500"
        >
          {{ diff.toFixed(0) }}
        </span>
        <span
          v-else
          class="text-gray-500"
        >
          0
        </span>
      </span>
    </h2>

    <p
      v-if="error"
      class="text-center text-red-500"
    >
      错误：{{ error }}
    </p>

    <iframe
      class="h-96 w-full"
      :src="`https://space.bilibili.com/${uid}`"
      frameborder="0"
      allowfullscreen
    />
  </div>
</template>
