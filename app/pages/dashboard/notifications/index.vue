<script setup lang="ts">
import type { PageInfo } from '~/types'

const router = useRouter()
const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)

async function loadNotifications(page = 1) {
  const response = await fetchNotifications(page, limit.value)
  pageInfo.value = response.meta?.page_info ?? null
  currentPage.value = pageInfo.value?.current_page ?? page
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  loadNotifications(page)
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  loadNotifications(1)
}

function getTimeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

async function handleNotificationClick(notification: any) {
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }

  if (notification.link) {
    router.push(notification.link)
  }
}

async function handleDelete(id: string) {
  await deleteNotification(id)
}

onMounted(() => {
  loadNotifications()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
        <p class="text-gray-600 mt-1">Stay updated with your building activities</p>
      </div>
      <UButton v-if="notifications.length > 0" color="neutral" variant="outline" @click="markAllAsRead">
        Mark all as read
      </UButton>
    </div>

    <UCard variant="elevated">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-bell-slash" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p class="text-gray-600">You're all caught up!</p>
      </div>

      <div v-else class="space-y-2">
        <div v-for="notification in notifications" :key="notification.id"
          class="p-4 transition cursor-pointer rounded-2xl"
          :class="!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100 '"
          @click="handleNotificationClick(notification)">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 flex-1">
              <div class="flex-shrink-0 mt-1">
                <div v-if="!notification.isRead" class="w-2.5 h-2.5 bg-primary-500 rounded-full" />
                <div v-else class="w-2.5 h-2.5" />
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900">{{ notification.title }}</p>
                <p class="text-gray-600 mt-1">{{ notification.message }}</p>
              </div>
            </div>

            <p class="text-sm text-gray-500 mt-2">{{ getTimeAgo(notification.createdAt) }}</p>
          </div>
        </div>
      </div>
    </UCard>

    <PaginationBar v-if="pageInfo" :page-info="pageInfo" item-label="notifications"
      :current-count="notifications.length" :limit="limit" show-limit-selector @go-to-page="goToPage"
      @update:limit="onLimitChange" />
  </div>
</template>