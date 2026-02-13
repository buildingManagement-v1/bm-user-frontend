<script setup lang="ts">
import type { PageInfo } from '~/types'

const props = withDefaults(
  defineProps<{
    pageInfo: PageInfo | null
    itemLabel: string
    currentCount: number
    limit?: number
    showLimitSelector?: boolean
  }>(),
  { limit: 20, showLimitSelector: false }
)

const emit = defineEmits<{
  'go-to-page': [page: number]
  'update:limit': [value: number]
}>()

const limitOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
]

const selectedLimit = computed({
  get: () => limitOptions.find((o) => o.value === props.limit) ?? limitOptions[1],
  set: (opt) => {
    if (opt?.value) emit('update:limit', opt.value)
  },
})

function goTo(page: number) {
  emit('go-to-page', page)
}
</script>

<template>
  <div v-if="pageInfo" class="flex items-center justify-between gap-4 px-1 pb-3 flex-wrap">
    <div class="flex items-center gap-3">
      <p class="text-sm text-gray-500">
        Showing {{ currentCount }} of {{ pageInfo.total_count }} {{ itemLabel }}
      </p>
      <div v-if="showLimitSelector" class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Per page</span>
        <USelectMenu :search-input="false" v-model="selectedLimit" :items="limitOptions" class="w-20" />
      </div>
    </div>
    <div class="flex items-center gap-2">
      <UButton size="xs" color="neutral" variant="outline" :disabled="!pageInfo.has_previous"
        @click="goTo(pageInfo.current_page - 1)">
        Previous
      </UButton>
      <span class="text-sm">
        Page {{ pageInfo.current_page }} of {{ pageInfo.total_pages }}
      </span>
      <UButton size="xs" color="neutral" variant="outline" :disabled="!pageInfo.has_next"
        @click="goTo(pageInfo.current_page + 1)">
        Next
      </UButton>
    </div>
  </div>
</template>
