<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Tenant, TenantDeletionPreview } from '~/types/tenant'
import type { Lease } from '~/types/lease'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

type TenantWithUnit = Tenant & {
  activeUnit?: {
    id: string;
    unitNumber: string;
    floor?: number;
  };
}

const { api, buildingApi } = useApi()
const toast = useToast()

const tenants = ref<Tenant[]>([])
const tenantLeases = ref<Lease[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const filterStatus = ref<string>('')
const searchQ = ref('')
const loadingLeases = ref(false)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const selectedStatusOption = computed({
  get: () => statusOptions.find(o => o.value === filterStatus.value) ?? statusOptions[0],
  set: (v: { value: string; label: string } | undefined) => {
    filterStatus.value = v?.value ?? ''
    onFilterChange()
  },
})
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const deleteTarget = ref<Tenant | null>(null)
const deletePreview = ref<TenantDeletionPreview | null>(null)
const previewLoading = ref(false)
const deleteLoading = ref(false)
const isLeaseModalOpen = ref(false)
const isLeaseFormModalOpen = ref(false)
const isCalendarModalOpen = ref(false)
const selectedTenant = ref<Tenant | null>(null)
const selectedLease = ref<Lease | null>(null)
const leaseMode = ref<'create' | 'edit'>('create')

const columns: TableColumn<TenantWithUnit>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'unitId', header: 'Unit' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

const leaseColumns: TableColumn<Lease>[] = [
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'rentAmount', header: 'Rent' },
  { accessorKey: 'startDate', header: 'Start Date' },
  { accessorKey: 'endDate', header: 'End Date' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

const tenantsWithUnits = computed<TenantWithUnit[]>(() => {
  return tenants.value.map(tenant => {
    const activeLease = tenant.leases?.find(l => l.status === 'active')
    return {
      ...tenant,
      activeUnit: activeLease?.unit as { id: string; unitNumber: string; floor?: number } | undefined
    }
  })
})

async function fetchTenants() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const response = await buildingApi<PaginatedResponse<Tenant[]>>(
      selectedBuildingId.value,
      `/v1/app/tenants?${params.toString()}`
    )
    pageInfo.value = response.meta.page_info
    const tenantsWithLeases = await Promise.all(
      response.data.map(async (tenant) => {
        try {
          const leasesResponse = await buildingApi<ApiResponse<Lease[]>>(
            selectedBuildingId.value!,
            `/v1/app/leases/tenant/${tenant.id}`
          )
          return { ...tenant, leases: leasesResponse.data }
        } catch {
          return { ...tenant, leases: [] }
        }
      })
    )
    tenants.value = tenantsWithLeases
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch tenants', description: error.message || '', color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchTenants()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchTenants()
}

function onFilterChange() {
  currentPage.value = 1
  fetchTenants()
}

async function fetchTenantLeases(tenantId: string) {
  if (!selectedBuildingId.value) return

  loadingLeases.value = true
  try {
    const response = await buildingApi<ApiResponse<Lease[]>>(
      selectedBuildingId.value,
      `/v1/app/leases/tenant/${tenantId}`
    )
    tenantLeases.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch leases', description: error.message || '', color: 'error' })
  } finally {
    loadingLeases.value = false
  }
}

function openEditModal(tenant: Tenant) {
  selectedTenant.value = tenant
  isEditModalOpen.value = true
}

function openLeaseModal(tenant: Tenant) {
  selectedTenant.value = tenant
  fetchTenantLeases(tenant.id)
  isLeaseModalOpen.value = true
}

function openCalendarModal(tenant: Tenant) {
  selectedTenant.value = tenant
  isCalendarModalOpen.value = true
}

function openCreateLeaseModal() {
  leaseMode.value = 'create'
  selectedLease.value = null
  isLeaseFormModalOpen.value = true
}

function openEditLeaseModal(lease: Lease) {
  leaseMode.value = 'edit'
  selectedLease.value = lease
  isLeaseFormModalOpen.value = true
}

async function openDeleteModal(tenant: Tenant) {
  if (!selectedBuildingId.value) return

  deleteTarget.value = tenant
  deletePreview.value = null
  isDeleteModalOpen.value = true

  previewLoading.value = true
  try {
    const response = await buildingApi<ApiResponse<TenantDeletionPreview>>(
      selectedBuildingId.value,
      `/v1/app/tenants/${tenant.id}/deletion-preview`
    )
    deletePreview.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Could not load deletion details', description: error.message || '', color: 'error' })
  } finally {
    previewLoading.value = false
  }
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  deleteTarget.value = null
  deletePreview.value = null
}

async function confirmDeleteTenant() {
  if (!deleteTarget.value || !selectedBuildingId.value) return

  deleteLoading.value = true
  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/tenants/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Tenant deleted successfully', color: 'success' })
    closeDeleteModal()
    fetchTenants()
  } catch (error: any) {
    const message = error.message || 'Could not delete tenant'
    toast.add({ title: 'Failed to delete tenant', description: message, color: 'error' })
  } finally {
    deleteLoading.value = false
  }
}

async function deleteLease(id: string) {
  if (!confirm('Are you sure you want to delete this lease?')) return
  if (!selectedBuildingId.value) return

  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/leases/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Lease deleted successfully', color: 'success' })
    if (selectedTenant.value) {
      fetchTenantLeases(selectedTenant.value.id)
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || 'Could not delete lease'
    toast.add({ title: 'Failed to delete lease', description: message, color: 'error' })
  }
}

const deletionSummaryItems = computed<Array<{ label: string; count: number }>>(() => {
  const counts = deletePreview.value?.counts
  if (!counts) return []
  return [
    { label: 'Active lease(s)', count: counts.activeLeases },
    { label: 'Unpaid / overdue payment period(s)', count: counts.unpaidPaymentPeriods },
    { label: 'Registered vehicle(s)', count: counts.vehicles },
    { label: 'Pending payment request(s)', count: counts.pendingPaymentRequests },
    { label: 'Pending parking request(s)', count: counts.pendingParkingRequests },
    { label: 'Open maintenance request(s)', count: counts.openMaintenanceRequests },
  ].filter(item => item.count > 0)
})

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedTenant.value = null
  fetchTenants()
}

function handleLeaseSuccess() {
  isLeaseFormModalOpen.value = false
  selectedLease.value = null
  fetchTenants()
  if (selectedTenant.value) {
    fetchTenantLeases(selectedTenant.value.id)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchTenants()
  }
}, { immediate: true })

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tenants</h1>
        <p class="text-gray-600 mt-1">Manage building tenants and leases</p>
      </div>

      <div class="flex items-center gap-3">
        <BuildingSelector v-model="selectedBuildingId" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          Add Tenant
        </UButton>
      </div>
    </div>

    <UCard v-if="selectedBuildingId" class="mb-4" variant="elevated">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Status</span>
          <USelectMenu v-model="selectedStatusOption" :items="statusOptions" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Name or email</span>
          <UInput v-model="searchQ" placeholder="Search..." class="w-48" @keyup.enter="onFilterChange" />
          <UButton size="sm" color="neutral" variant="outline" @click="onFilterChange">Search</UButton>
        </div>
      </div>
    </UCard>

    <UCard variant="elevated">
      <PaginationBar :page-info="pageInfo" item-label="tenants" :current-count="tenants.length" :limit="limit"
        show-limit-selector @go-to-page="goToPage" @update:limit="onLimitChange" />
      <UTable :data="tenantsWithUnits" :columns="columns" :loading="loading">
        <template #phone-cell="{ row }">
          <span v-if="row.original.phone">{{ row.original.phone }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #unitId-cell="{ row }">
          <span v-if="row.original.activeUnit">
            {{ row.original.activeUnit.unitNumber }}
            <span v-if="row.original.activeUnit.floor" class="text-gray-500">
              (Floor {{ row.original.activeUnit.floor }})
            </span>
          </span>
          <span v-else class="text-gray-400">No active lease</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'" variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="primary" variant="ghost" @click="openLeaseModal(row.original)">
              Lease
            </UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="openCalendarModal(row.original)">
              Calendar
            </UButton>
            <UDropdownMenu :items="[
              [{ label: 'Edit', icon: 'i-heroicons-pencil', onSelect: () => openEditModal(row.original) }],
              [{ label: 'Delete', icon: 'i-heroicons-trash', onSelect: () => openDeleteModal(row.original) }]
            ]" :content="{ align: 'end' }">
              <UButton size="xs" color="neutral" variant="outline" icon="i-heroicons-ellipsis-vertical" />
            </UDropdownMenu>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-users" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No tenants yet</p>
            <p class="text-gray-500 mb-4">
              {{ selectedBuildingId ? 'Get started by adding your first tenant' : 'Select a building to manage tenants'
              }}
            </p>
            <UButton v-if="selectedBuildingId" color="primary" @click="isCreateModalOpen = true">
              Add Tenant
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create Tenant Modal -->
    <UModal v-model:open="isCreateModalOpen" title="Add New Tenant">
      <template #body>
        <TenantForm v-if="selectedBuildingId" mode="create" :building-id="selectedBuildingId" @success="handleSuccess"
          @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <!-- Edit Tenant Modal -->
    <UModal v-model:open="isEditModalOpen" title="Edit Tenant">
      <template #body>
        <TenantForm v-if="selectedTenant && selectedBuildingId" mode="edit" :building-id="selectedBuildingId"
          :tenant="selectedTenant" @success="handleSuccess" @cancel="isEditModalOpen = false" />
      </template>
    </UModal>

    <!-- Delete Tenant Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :title="`Delete ${deleteTarget?.name}?`">
      <template #body>
        <div class="space-y-4">
          <UAlert color="error" variant="subtle" icon="i-heroicons-exclamation-triangle"
            title="This tenant and all their related records will be deleted"
            description="Their leases, registered vehicles and requests will be removed, and units on active leases will become vacant. Payment history is retained." />

          <div v-if="previewLoading" class="space-y-2">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-4 w-1/2" />
          </div>

          <div v-else-if="deletePreview" class="space-y-3">
            <div v-if="deletePreview.activeLeases.length > 0">
              <p class="text-sm font-medium text-gray-900 mb-1">Active leases that will be removed:</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li v-for="lease in deletePreview.activeLeases" :key="lease.id">
                  Unit {{ lease.unitNumber }}
                  <span v-if="lease.floor" class="text-gray-500">(Floor {{ lease.floor }})</span>
                  — ETB {{ lease.rentAmount.toLocaleString() }}, ends {{ formatDate(lease.endDate) }}
                </li>
              </ul>
            </div>

            <div v-if="deletionSummaryItems.length > 0">
              <p class="text-sm font-medium text-gray-900 mb-1">Affected records:</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li v-for="item in deletionSummaryItems" :key="item.label">
                  {{ item.count }} {{ item.label }}
                </li>
              </ul>
            </div>

            <p v-if="deletionSummaryItems.length === 0" class="text-sm text-gray-600">
              This tenant has no active leases or open records.
            </p>
          </div>

          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" :disabled="deleteLoading" @click="closeDeleteModal">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleteLoading" @click="confirmDeleteTenant">
              Delete tenant
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Lease Table Modal -->
    <UModal v-model:open="isLeaseModalOpen" :title="`${selectedTenant?.name} - Leases`" :ui="{ content: 'max-w-7xl' }">
      <template #body>
        <div v-if="selectedTenant" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Lease Agreements</h3>
            <UButton size="sm" color="primary" @click="openCreateLeaseModal">
              Add Lease
            </UButton>
          </div>

          <UTable :data="tenantLeases" :columns="leaseColumns" :loading="loadingLeases">
            <template #unit-cell="{ row }">
              <span>{{ row.original.unit.unitNumber }}</span>
              <span v-if="row.original.unit.floor" class="text-gray-500">
                (Floor {{ row.original.unit.floor }})
              </span>
            </template>

            <template #rentAmount-cell="{ row }">
              <span>ETB {{ row.original.rentAmount.toLocaleString() }}</span>
            </template>

            <template #startDate-cell="{ row }">
              <span>{{ formatDate(row.original.startDate) }}</span>
            </template>

            <template #endDate-cell="{ row }">
              <span>{{ formatDate(row.original.endDate) }}</span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="row.original.status === 'active' ? 'success' : row.original.status === 'expired' ? 'warning' : 'neutral'"
                variant="subtle" class="capitalize">
                {{ row.original.status }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex gap-2">
                <UButton v-if="row.original.status !== 'terminated'" size="xs" color="neutral" variant="ghost"
                  @click="openEditLeaseModal(row.original)">
                  Edit
                </UButton>
                <UButton size="xs" color="error" variant="ghost" @click="deleteLease(row.original.id)">
                  Delete
                </UButton>
              </div>
            </template>

            <template #empty>
              <div class="text-center py-8">
                <p class="text-gray-500 mb-4">No leases yet</p>
                <UButton color="primary" size="sm" @click="openCreateLeaseModal">
                  Add First Lease
                </UButton>
              </div>
            </template>
          </UTable>
        </div>
      </template>
    </UModal>

    <!-- Lease Form Modal -->
    <UModal v-model:open="isLeaseFormModalOpen" :title="leaseMode === 'create' ? 'Create Lease' : 'Edit Lease'">
      <template #body>
        <LeaseForm v-if="selectedTenant && selectedBuildingId" :mode="leaseMode" :building-id="selectedBuildingId"
          :tenant-id="selectedTenant.id" :lease="selectedLease || undefined" @success="handleLeaseSuccess"
          @cancel="isLeaseFormModalOpen = false" />
      </template>
    </UModal>

    <!-- Payment Calendar Modal -->
    <UModal v-model:open="isCalendarModalOpen" :title="`${selectedTenant?.name} - Payment Calendar`" size="xl">
      <template #body>
        <PaymentCalendar v-if="selectedTenant" :building-id="selectedBuildingId" :tenant-id="selectedTenant.id" />
      </template>
    </UModal>
  </div>
</template>