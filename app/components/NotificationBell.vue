<script setup lang="ts">
const { unreadCount, fetchUnreadCount } = useNotifications()
const isOpen = ref(false)

let intervalId: NodeJS.Timeout | null = null

function startPolling() {
  fetchUnreadCount()
  intervalId = setInterval(() => {
    fetchUnreadCount()
  }, 30000) // Poll every 30 seconds
}

function stopPolling() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => {
  startPolling()

  window.addEventListener('focus', fetchUnreadCount)
})

onUnmounted(() => {
  stopPolling()
  window.removeEventListener('focus', fetchUnreadCount)
})
</script>

<template>
  <div class="relative">
    <UButton color="neutral" variant="ghost" icon="i-heroicons-bell" @click="isOpen = !isOpen" class="relative">
      <UBadge v-if="unreadCount > 0" :label="unreadCount > 99 ? '99+' : unreadCount.toString()" color="error"
        class="absolute -top-1 -right-1" />
    </UButton>

    <Notificationdropdown v-model:open="isOpen" />
  </div>
</template>