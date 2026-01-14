<script setup lang="ts">
const router = useRouter()
const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

const currentPage = ref(1)
const totalPages = ref(1)

async function loadNotifications(page = 1) {
  const response = await fetchNotifications(page, 20)
  currentPage.value = response.page
  totalPages.value = response.totalPages
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

    <UCard>
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-bell-slash" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p class="text-gray-600">You're all caught up!</p>
      </div>

      <div v-else class="divide-y">
        <div v-for="notification in notifications" :key="notification.id"
          class="p-4 hover:bg-gray-50 transition cursor-pointer" :class="{ 'bg-blue-50': !notification.isRead }"
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
                <p class="text-sm text-gray-500 mt-2">{{ getTimeAgo(notification.createdAt) }}</p>
              </div>
            </div>

            <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
              @click.stop="handleDelete(notification.id)" />
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="totalPages > 1" class="flex justify-center gap-2">
      <UButton :disabled="currentPage === 1" color="neutral" variant="outline"
        @click="loadNotifications(currentPage - 1)">
        Previous
      </UButton>
      <span class="flex items-center px-4 text-gray-600">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <UButton :disabled="currentPage === totalPages" color="neutral" variant="outline"
        @click="loadNotifications(currentPage + 1)">
        Next
      </UButton>
    </div>
  </div>
</template>