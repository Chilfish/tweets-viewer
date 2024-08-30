<script setup lang="ts">
import { useTweetStore } from '~/stores/tweets'

const user = useTweetStore().user!
</script>

<template>
  <section>
    <h2>{{ user.name }}</h2>
    <p>{{ user.bio }}</p>
  </section>
</template>
