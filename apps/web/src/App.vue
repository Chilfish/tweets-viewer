<script setup lang="ts">
import type {
  GlobalThemeOverrides,
} from 'naive-ui'
import { checkNetwork, isDark } from '@tweets-viewer/core'
import {
  darkTheme,
  dateZhCN,
  NConfigProvider,
  NMessageProvider,
  NModalProvider,
  zhCN,
} from 'naive-ui'
import { computed } from 'vue'

checkNetwork()

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
        <div
          v-if="!isDark"
          class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)] bg-white"
        />
        <div
          v-else
          class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] bg-neutral-950"
        />

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
