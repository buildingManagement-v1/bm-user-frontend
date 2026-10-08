<script setup lang="ts">
import { ManagerRole } from '~/types/manager'

const route = useRoute()
const { user } = useAuth()
const { isOwner, can } = usePermissions()

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
  /** Visible to every signed-in owner and manager */
  everyone?: boolean
  ownerOnly?: boolean
  /** Manager roles (in the selected building) the backend accepts */
  managerRoles?: ManagerRole[]
  /** Other pages that belong to this item and should highlight it */
  alsoActiveOn?: string[]
}

const allNavigation: NavItem[] = [
  { label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard', everyone: true },
  { label: 'Buildings', icon: 'i-heroicons-building-office-2', to: '/dashboard/buildings' },
  {
    label: 'Units',
    icon: 'i-heroicons-squares-2x2',
    to: '/dashboard/units',
    managerRoles: [ManagerRole.TENANT_MANAGER]
  },
  {
    label: 'Tenants',
    icon: 'i-heroicons-users',
    to: '/dashboard/tenants',
    managerRoles: [ManagerRole.TENANT_MANAGER]
  },
  {
    label: 'Parking',
    icon: 'i-heroicons-truck',
    to: '/dashboard/parking',
    managerRoles: [ManagerRole.TENANT_MANAGER]
  },
  {
    label: 'Parking requests',
    icon: 'i-heroicons-document-check',
    to: '/dashboard/parking-requests',
    managerRoles: [ManagerRole.TENANT_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Announcements',
    icon: 'i-heroicons-megaphone',
    to: '/dashboard/announcements',
    managerRoles: [ManagerRole.TENANT_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Maintenance',
    icon: 'i-heroicons-wrench-screwdriver',
    to: '/dashboard/maintenance-requests',
    managerRoles: [ManagerRole.MAINTENANCE_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Payments',
    icon: 'i-heroicons-banknotes',
    to: '/dashboard/payments',
    managerRoles: [ManagerRole.PAYMENT_MANAGER]
  },
  {
    label: 'Payment requests',
    icon: 'i-heroicons-document-check',
    to: '/dashboard/payment-requests',
    managerRoles: [ManagerRole.PAYMENT_MANAGER, ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Invoices',
    icon: 'i-heroicons-document-text',
    to: '/dashboard/invoices',
    managerRoles: [ManagerRole.PAYMENT_MANAGER]
  },
  {
    label: 'Reports',
    icon: 'i-heroicons-chart-bar',
    to: '/dashboard/reports',
    managerRoles: [ManagerRole.REPORTS_VIEWER]
  },
  {
    label: 'Plans',
    icon: 'i-heroicons-credit-card',
    to: '/dashboard/plans',
    alsoActiveOn: ['/dashboard/subscriptions']
  },
  {
    label: 'Managers',
    icon: 'i-heroicons-user-group',
    to: '/dashboard/managers',
    ownerOnly: true
  },
  {
    label: 'Activities',
    icon: 'i-heroicons-user-group',
    to: '/dashboard/activity-logs',
    managerRoles: [ManagerRole.OPERATIONS_MANAGER]
  },
  {
    label: 'Notifications',
    icon: 'i-heroicons-bell',
    to: '/dashboard/notifications',
    everyone: true
  },
]

const navigation = computed(() => {
  if (!user.value) return []
  return allNavigation.filter(item => {
    if (item.everyone) return true
    if (item.ownerOnly || !item.managerRoles) return isOwner.value
    return can(...item.managerRoles)
  })
})

function matches(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function isActive(item: NavItem) {
  if (item.to === '/dashboard') {
    return route.path === '/dashboard'
  }
  return matches(item.to) || (item.alsoActiveOn?.some(matches) ?? false)
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
        <span class="text-xl font-bold text-gray-900">BMS</span>
      </div>
      <UIcon v-else name="i-heroicons-building-office-2" class="w-8 h-8 text-primary-600 mx-auto" />
    </div>

    <nav class="nav-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
      <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" :class="[
        'group relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border whitespace-nowrap',
        isActive(item)
          ? 'bg-primary-50 text-primary-700 border-primary-200'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent',
      ]">
        <div v-if="isActive(item)" class="absolute left-0 w-1 h-5 bg-primary-500 rounded-r-full" />

        <UIcon :name="item.icon" :class="[
          'w-5 h-5 shrink-0 transition-colors',
          isActive(item) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
        ]" />

        <span v-if="isOpen" class="font-medium">
          {{ item.label }}
        </span>
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