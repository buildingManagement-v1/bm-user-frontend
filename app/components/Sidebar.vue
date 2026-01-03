<script setup lang="ts">
import type { Manager } from '~/types/manager'
import { ManagerRole } from '~/types/manager'

const route = useRoute()
const { user, userType } = useAuth()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

interface NavItem {
  label: string
  icon: string
  to: string
  ownerOnly?: boolean
  managerRoles?: ManagerRole[]
}

const allNavigation: NavItem[] = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard' },
  { label: 'Buildings', icon: 'i-heroicons-building-office-2', to: '/dashboard/buildings' },
  {
    label: 'Units',
    icon: 'i-heroicons-squares-2x2',
    to: '/dashboard/units',
    managerRoles: [ManagerRole.TENANT_MANAGER, ManagerRole.MAINTENANCE_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Tenants',
    icon: 'i-heroicons-users',
    to: '/dashboard/tenants',
    managerRoles: [ManagerRole.TENANT_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Maintenance',
    icon: 'i-heroicons-wrench-screwdriver',
    to: '/dashboard/maintenance',
    managerRoles: [ManagerRole.MAINTENANCE_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Billing',
    icon: 'i-heroicons-currency-dollar',
    to: '/dashboard/billing',
    managerRoles: [ManagerRole.PAYMENT_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Reports',
    icon: 'i-heroicons-chart-bar',
    to: '/dashboard/reports',
    managerRoles: [ManagerRole.REPORTS_VIEWER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Managers',
    icon: 'i-heroicons-user-group',
    to: '/dashboard/managers',
    ownerOnly: true
  },
]

const navigation = computed(() => {
  const currentUser = user.value
  if (!currentUser) return []

  const isOwner = userType.value === 'user'

  return allNavigation.filter(item => {
    // Dashboard visible to all
    if (item.to === '/dashboard') return true

    // Owner-only items
    if (item.ownerOnly) return isOwner

    // Items available to both owners and managers
    if (!item.managerRoles) return isOwner

    // For managers, check if they have the required role
    if (!isOwner && 'buildings' in currentUser) {
      const manager = currentUser as Manager
      // Get all roles from all building assignments
      const allRoles = manager.buildings?.flatMap(b => b.roles) || []
      return item.managerRoles.some(role => allRoles.includes(role))
    }

    return isOwner
  })
})

function isActive(itemTo: string) {
  if (itemTo === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path === itemTo || route.path.startsWith(itemTo + '/')
}
</script>

<template>
  <aside :class="[
    'fixed inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 z-40',
    isOpen ? 'w-64' : 'w-20'
  ]">
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200">
      <div v-if="isOpen" class="flex items-center gap-2">
        <UIcon name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600" />
        <span class="text-xl font-bold text-gray-900">BMS</span>
      </div>
      <UIcon v-else name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600 mx-auto" />
    </div>

    <nav class="p-4 space-y-2">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="[
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        isActive(item.to)
          ? 'bg-primary-50 text-primary-600'
          : 'text-gray-700 hover:bg-gray-100',
      ]">
        <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="isOpen" class="font-medium">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="absolute bottom-4 left-0 right-0 px-4">
      <UButton color="neutral" variant="ghost" block
        :icon="isOpen ? 'i-heroicons-chevron-left' : 'i-heroicons-chevron-right'" @click="emit('toggle')">
        <span v-if="isOpen">Collapse</span>
      </UButton>
    </div>
  </aside>
</template>