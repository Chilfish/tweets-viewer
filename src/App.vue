<script setup lang="ts">
import type {
  GlobalThemeOverrides,
} from 'naive-ui'
import {
  darkTheme,
  dateZhCN,
  NConfigProvider,
  NMessageProvider,
  NModalProvider,
  zhCN,
} from 'naive-ui'
import { computed } from 'vue'
import { DialogProvider } from '~/components/ui/dialog'
import { checkNetwork, isDark } from '~/composables'

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

        <DialogProvider>
          <RouterView />
        </DialogProvider>
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>
