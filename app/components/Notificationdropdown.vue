<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const router = useRouter()
const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchNotifications(1, 10)
  }
})

function getTimeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

async function handleNotificationClick(notification: any) {
  if (!notification.isRead) {
    await markAsRead(notification.id)
  }

  if (notification.link) {
    router.push(notification.link)
  }

  emit('update:open', false)
}

async function handleMarkAllRead() {
  await markAllAsRead()
}

function viewAll() {
  const userType = useCookie('user_type').value
  if (userType === 'tenant') {
    router.push('/tenant/notifications')
  } else {
    router.push('/dashboard/notifications')
  }
  emit('update:open', false)
}
</script>

<template>
  <UModal v-model:open="props.open" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Notifications</h3>
        <UButton v-if="notifications.length > 0" size="xs" color="neutral" variant="ghost" @click="handleMarkAllRead">
          Mark all read
        </UButton>
      </div>
    </template>

    <template #body>
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-bell-slash" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p class="text-gray-500">No notifications</p>
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div v-for="notification in notifications" :key="notification.id" @click="handleNotificationClick(notification)"
          class="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          :class="{ 'bg-blue-50': !notification.isRead }">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <div v-if="!notification.isRead" class="w-2 h-2 bg-primary-500 rounded-full" />
              <div v-else class="w-2 h-2" />
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-gray-900">{{ notification.title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ getTimeAgo(notification.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-center">
        <UButton color="neutral" variant="ghost" @click="viewAll">
          View all notifications
        </UButton>
      </div>
    </template>
  </UModal>
</template>