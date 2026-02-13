<script setup lang="ts">
import type { PageInfo } from '~/types'

defineProps<{
  pageInfo: PageInfo | null
  itemLabel: string
  currentCount: number
}>()

const emit = defineEmits<{
  'go-to-page': [page: number]
}>()

function goTo(page: number) {
  emit('go-to-page', page)
}
</script>

<template>
  <div v-if="pageInfo" class="flex items-center justify-between gap-4 px-1 pb-3">
    <p class="text-sm text-gray-500">
      Showing {{ currentCount }} of {{ pageInfo.total_count }} {{ itemLabel }}
    </p>
    <div class="flex items-center gap-2">
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        :disabled="!pageInfo.has_previous"
        @click="goTo(pageInfo.current_page - 1)"
      >
        Previous
      </UButton>
      <span class="text-sm">
        Page {{ pageInfo.current_page }} of {{ pageInfo.total_pages }}
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="outline"
        :disabled="!pageInfo.has_next"
        @click="goTo(pageInfo.current_page + 1)"
      >
        Next
      </UButton>
    </div>
  </div>
</template>
