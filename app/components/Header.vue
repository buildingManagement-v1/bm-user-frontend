<script setup lang="ts">
const { user, logout } = useAuth()

const userMenuItems = [
  [{
    label: user.value?.email || '',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    onSelect: () => navigateTo('/dashboard/settings')
  }],
  [{
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: logout
  }]
]
</script>

<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold text-gray-900">Building Management System</h2>
    </div>

    <div class="flex items-center gap-4">
      <UDropdownMenu :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
        <UButton color="neutral" variant="ghost" trailing-icon="i-heroicons-chevron-down">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-600 font-semibold text-sm">{{ user?.name?.charAt(0).toUpperCase() }}</span>
            </div>
            <span class="font-medium">{{ user?.name }}</span>
          </div>
        </UButton>

        <template #account>
          <div class="text-left">
            <p class="truncate font-medium text-gray-900">{{ user?.name }}</p>
            <p class="truncate text-sm text-gray-500">{{ user?.email }}</p>
          </div>
        </template>
      </UDropdownMenu>
    </div>
  </header>
</template>