<script setup lang="ts">
import { Bot } from 'lucide-vue-next'
import { ref } from 'vue'
import { Toaster, useToast } from '@/components/ui/toast'

const count = ref(0)
const { toast } = useToast()
</script>

<template>
  <Toaster />
  <main class="mx-auto w-50% p-4">
    <Button
      variant="link"
      size="sm"
      @click="() => {
        count++
        toast({
          title: 'Hello World',
          description: `This is a toast message ${count}`,
        })
      }"
    >
      count is {{ count }}
    </Button>

    <Alert
      variant="error"
    >
      <Bot class="h-4 w-4" />
      <AlertTitle>
        Alert Title
      </AlertTitle>
      <AlertDescription>
        Alert Description
      </AlertDescription>
    </Alert>
  </main>
</template>
