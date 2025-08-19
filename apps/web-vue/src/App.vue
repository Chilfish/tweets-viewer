<script setup lang="ts">
import { DialogProvider } from '~/components/ui/dialog'
import { TooltipProvider } from '~/components/ui/tooltip'
import { checkNetwork, isDark } from '~/composables'

checkNetwork()
</script>

<template>
  <!-- <div
    v-if="!isDark"
    class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)] bg-white"
  />
  <div
    v-else
    class="fixed top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] bg-neutral-950"
  /> -->

  <DialogProvider>
    <TooltipProvider>
      <RouterView />
    </TooltipProvider>
  </DialogProvider>
</template>
