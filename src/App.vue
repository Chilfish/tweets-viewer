<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NModalProvider,
  darkTheme,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { computed } from 'vue'
import { isDark } from '~/composables'

const theme = computed(() => !isDark.value ? null : darkTheme)
</script>

<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme
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
  min-width: 0;
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
