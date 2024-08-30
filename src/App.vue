<script setup lang="ts">
import type {
  GlobalThemeOverrides,
} from 'naive-ui'
import {
  NConfigProvider,
  NMessageProvider,
  NModalProvider,
  darkTheme,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { computed } from 'vue'
import { useHead, useSeoMeta } from '@unhead/vue'
import { isDark } from '~/composables'

const title = 'Twitter Archive Explorer'
const description = 'Explore your Twitter archive with ease'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary',
})

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'theme-color', content: '#3388bb' },
  ],
})

const theme = computed(() => !isDark.value ? null : darkTheme)
const themes = {
  common: {
    primaryColor: '#3388bb',
  },
} satisfies GlobalThemeOverrides
</script>

<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme
    :theme-overrides="themes"
  >
    <NModalProvider>
      <NMessageProvider>
        <RouterView />
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>

<style>
* {
  box-sizing: border-box;
  /* min-width: 0; */
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-track {
  border-radius: 8px;
  background-color: transparent;
}
*::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background-color: #7a797963;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  /* min-height: 100dvh; */
  display: flex;
  flex-direction: column;

  @apply: bg-light-7 dark:bg-dark-8 dark:text-white text-black;
}

p {
  white-space: pre-wrap;
}
</style>
