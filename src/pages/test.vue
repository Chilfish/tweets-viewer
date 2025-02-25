<script setup lang="ts">
import { h } from 'vue'
import Image from '~/components/Image.vue'
import { Button } from '~/components/ui/button'
import { useDialog } from '~/components/ui/dialog'

const [openDialog, closeDialog] = useDialog()

function handleOpen() {
  openDialog('test', {
    component: h(
      Image,
      {
        src: 'https://placehold.co/600x400',
        alt: 'Random image',
        onClick: () => closeDialog('test'),
      },
    ),
  })
}
</script>

<template>
  <div>
    <h1>Test</h1>
    <Button @click="handleOpen">
      Open
    </Button>
  </div>
</template>
