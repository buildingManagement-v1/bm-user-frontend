<script setup lang="ts">
const route = useRoute()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const navigation = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/tenant/dashboard' },
  { label: 'Announcements', icon: 'i-heroicons-megaphone', to: '/tenant/announcements' },
  { label: 'Maintenance', icon: 'i-heroicons-wrench-screwdriver', to: '/tenant/maintenance' },
  { label: 'Payment History', icon: 'i-heroicons-banknotes', to: '/tenant/payments' },
  { label: 'Submit payment', icon: 'i-heroicons-document-plus', to: '/tenant/payment-requests' },
  { label: 'Parking requests', icon: 'i-heroicons-truck', to: '/tenant/parking-requests' },
  { label: 'Notifications', icon: 'i-heroicons-bell', to: '/tenant/notifications' },
  { label: 'Settings', icon: 'i-heroicons-cog-6-tooth', to: '/tenant/settings' },
]

function isActive(itemTo: string) {
  if (itemTo === '/tenant/dashboard') {
    return route.path === '/tenant/dashboard'
  }
  return route.path === itemTo || route.path.startsWith(itemTo + '/')
}
</script>

<template>
  <aside :class="[
    'fixed inset-y-0 left-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-40',
    isOpen ? 'w-64' : 'w-20'
  ]">
    <div class="h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-200">
      <div v-if="isOpen" class="flex items-center gap-2">
        <UIcon name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600" />
        <span class="text-xl font-bold text-gray-900">Tenant Portal</span>
      </div>
      <UIcon v-else name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600 mx-auto" />
    </div>

    <nav class="nav-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="[
        'flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors',
        isActive(item.to)
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-700 hover:bg-gray-100',
      ]">
        <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="isOpen" class="font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="shrink-0 p-4 border-t border-gray-200">
      <UButton color="neutral" variant="ghost" block
        :icon="isOpen ? 'i-heroicons-chevron-left' : 'i-heroicons-chevron-right'" @click="emit('toggle')">
        <span v-if="isOpen">Collapse</span>
      </UButton>
    </div>
  </aside>
</template>