<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Tenant } from '~/types/tenant'
import type { Building } from '~/types/building'
import type { Lease } from '~/types/lease'
import type { ApiResponse } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const tenants = ref<Tenant[]>([])
const buildings = ref<Building[]>([])
const tenantLeases = ref<Lease[]>([])
const selectedBuildingId = ref<string>('')
const loading = ref(false)
const loadingBuildings = ref(false)
const loadingLeases = ref(false)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isLeaseModalOpen = ref(false)
const isLeaseFormModalOpen = ref(false)
const isCalendarModalOpen = ref(false)
const selectedTenant = ref<Tenant | null>(null)
const selectedLease = ref<Lease | null>(null)
const leaseMode = ref<'create' | 'edit'>('create')

const columns: TableColumn<Tenant>[] = [
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

const buildingOptions = computed(() =>
  buildings.value.map(b => ({ value: b.id, label: b.name }))
)

const selectedBuilding = computed({
  get: () => buildingOptions.value.find(b => b.value === selectedBuildingId.value),
  set: (val: { value: string; label: string } | undefined) => {
    selectedBuildingId.value = val?.value || ''
  }
})

async function fetchBuildings() {
  loadingBuildings.value = true
  try {
    const response = await api<ApiResponse<Building[]>>('/v1/app/buildings')
    buildings.value = response.data.filter(b => b.status === 'active')
    if (buildings.value.length > 0 && !selectedBuildingId.value) {
      selectedBuildingId.value = buildings.value[0]!.id
    }
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch buildings', description: error.message || '', color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function fetchTenants() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const response = await buildingApi<ApiResponse<Tenant[]>>(
      selectedBuildingId.value,
      '/v1/app/tenants'
    )
    tenants.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch tenants', description: error.message || '', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function fetchTenantLeases(tenantId: string) {
  if (!selectedBuildingId.value) return

  loadingLeases.value = true
  try {
    const response = await buildingApi<ApiResponse<Lease[]>>(
      selectedBuildingId.value,
      '/v1/app/leases'
    )
    tenantLeases.value = response.data.filter(l => l.tenantId === tenantId)
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

async function deleteTenant(id: string) {
  if (!confirm('Are you sure you want to delete this tenant?')) return
  if (!selectedBuildingId.value) return

  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/tenants/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Tenant deleted successfully', color: 'success' })
    fetchTenants()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete tenant', description: error.message || '', color: 'error' })
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
    toast.add({ title: 'Failed to delete lease', description: error.message || '', color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedTenant.value = null
  fetchTenants()
}

function handleLeaseSuccess() {
  isLeaseFormModalOpen.value = false
  selectedLease.value = null
  if (selectedTenant.value) {
    fetchTenantLeases(selectedTenant.value.id)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    fetchTenants()
  }
})

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tenants</h1>
        <p class="text-gray-600 mt-1">Manage building tenants and leases</p>
      </div>

      <div class="flex items-center gap-3">
        <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
          :loading="loadingBuildings" class="w-64" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          Add Tenant
        </UButton>
      </div>
    </div>

    <UCard>
      <UTable :data="tenants" :columns="columns" :loading="loading">
        <template #phone-cell="{ row }">
          <span v-if="row.original.phone">{{ row.original.phone }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #unitId-cell="{ row }">
          <span v-if="row.original.unit">
            {{ row.original.unit.unitNumber }}
            <span v-if="row.original.unit.floor" class="text-gray-500">
              (Floor {{ row.original.unit.floor }})
            </span>
          </span>
          <span v-else class="text-gray-400">No unit assigned</span>
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
              [{ label: 'Delete', icon: 'i-heroicons-trash', onSelect: () => deleteTenant(row.original.id) }]
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
              <span>${{ row.original.rentAmount.toLocaleString() }}</span>
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
                <UButton size="xs" color="neutral" variant="ghost" @click="openEditLeaseModal(row.original)">
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