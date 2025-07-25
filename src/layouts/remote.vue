<script setup lang="ts">
import BackToTop from '~/components/BackToTop.vue'
import HeaderRemote from '~/components/HeaderRemote.vue'
</script>

<template>
  <main
    class="container mx-auto flex flex-col gap-0 transition-all duration-300 lg:w-[60vw] xl:w-[50vw] md:p-4"
  >
  <HeaderRemote />

    <slot />

    <BackToTop />
  </main>
</template>
