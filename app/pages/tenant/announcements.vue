<script setup lang="ts">
import type { Announcement, AnnouncementPriority, PageInfo, PaginatedResponse } from '~/types'
import { errorMessage } from '~/types/api'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()
const route = useRoute()

const announcements = ref<Announcement[]>([])
const pageInfo = ref<PageInfo | null>(null)
const loading = ref(false)
const currentPage = ref(1)
const limit = 10
const highlighted = computed(() => (typeof route.query.id === 'string' ? route.query.id : null))

const priorityColor: Record<AnnouncementPriority, 'neutral' | 'warning' | 'error'> = {
  normal: 'neutral',
  important: 'warning',
  urgent: 'error',
}

async function load() {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit
    const res = await api<PaginatedResponse<Announcement[]>>(`/v1/tenant/announcements?limit=${limit}&offset=${offset}`)
    announcements.value = res.data
    pageInfo.value = res.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to load announcements', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  currentPage.value = page
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Announcements</h1>
      <p class="text-gray-500 mt-1">Notices from your building management</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!announcements.length" class="text-center py-16 text-gray-500">
      <UIcon name="i-heroicons-megaphone" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      No announcements right now.
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="a in announcements" :key="a.id" variant="elevated"
        :class="a.id === highlighted ? 'ring-2 ring-primary-500' : a.priority === 'urgent' ? 'ring-1 ring-red-300' : ''">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-gray-900">{{ a.title }}</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ a.createdByName ?? 'Management' }} ·
              {{ new Date(a.publishedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </p>
          </div>
          <UBadge v-if="a.priority !== 'normal'" :color="priorityColor[a.priority]" variant="subtle" class="capitalize">
            {{ a.priority }}
          </UBadge>
        </div>
        <p class="mt-3 text-gray-700 whitespace-pre-line">{{ a.content }}</p>
      </UCard>

      <PaginationBar :page-info="pageInfo" item-label="announcements" :current-count="announcements.length"
        :limit="limit" @go-to-page="goToPage" />
    </div>
  </div>
</template>
