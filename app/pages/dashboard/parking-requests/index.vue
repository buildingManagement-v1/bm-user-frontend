<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TenantParkingRequest } from '~/types/parking'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { buildingApi } = useApi()
const toast = useToast()

const requests = ref<TenantParkingRequest[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const statusFilter = ref('pending')
const searchQ = ref('')
const approvingId = ref<string | null>(null)
const rejectingId = ref<string | null>(null)
const rejectModalOpen = ref(false)
const rejectReason = ref('')

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const columns: TableColumn<TenantParkingRequest>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'licensePlate', header: 'License plate' },
  { accessorKey: 'createdAt', header: 'Submitted' },
  { accessorKey: 'actions', header: '' },
]

async function fetchRequests() {
  if (!selectedBuildingId.value) return
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (statusFilter.value) params.set('status', statusFilter.value)
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const res = await buildingApi<PaginatedResponse<TenantParkingRequest[]>>(
      selectedBuildingId.value,
      `/v1/app/parking-requests?${params.toString()}`
    )
    requests.value = res.data ?? []
    pageInfo.value = res.meta?.page_info ?? null
  } catch (e: any) {
    toast.add({ title: 'Failed to fetch requests', description: e.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchRequests()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchRequests()
}

function onStatusChange() {
  currentPage.value = 1
  fetchRequests()
}

function onSearch() {
  currentPage.value = 1
  fetchRequests()
}

async function approve(id: string) {
  if (!selectedBuildingId.value) return
  approvingId.value = id
  try {
    await buildingApi<ApiResponse<unknown>>(
      selectedBuildingId.value,
      `/v1/app/parking-requests/${id}/approve`,
      { method: 'POST' }
    )
    toast.add({ title: 'Parking request approved and car registered', color: 'success' })
    fetchRequests()
  } catch (e: any) {
    toast.add({ title: 'Failed to approve', description: e.message, color: 'error' })
  } finally {
    approvingId.value = null
  }
}

function openRejectModal(id: string) {
  rejectingId.value = id
  rejectReason.value = ''
  rejectModalOpen.value = true
}

function closeRejectModal() {
  rejectingId.value = null
  rejectReason.value = ''
  rejectModalOpen.value = false
}

async function confirmReject() {
  if (!selectedBuildingId.value || !rejectingId.value) return
  try {
    await buildingApi<ApiResponse<unknown>>(
      selectedBuildingId.value,
      `/v1/app/parking-requests/${rejectingId.value}/reject`,
      { method: 'POST', body: { rejectionReason: rejectReason.value || undefined } }
    )
    toast.add({ title: 'Request rejected', color: 'success' })
    closeRejectModal()
    fetchRequests()
  } catch (e: any) {
    toast.add({ title: 'Failed to reject', description: e.message, color: 'error' })
  }
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchRequests()
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Parking requests</h1>
        <p class="text-gray-600 mt-1">Approve or reject tenant parking registration requests</p>
      </div>
      <BuildingSelector v-model="selectedBuildingId" />
    </div>

    <UCard v-if="selectedBuildingId" variant="elevated" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Search</span>
          <UInput
            v-model="searchQ"
            placeholder="Tenant, unit, license plate..."
            class="w-56"
            @keyup.enter="onSearch"
          />
          <UButton size="sm" color="neutral" variant="outline" @click="onSearch">
            Search
          </UButton>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Status</span>
          <USelectMenu
            :model-value="statusOptions.find(o => o.value === statusFilter)"
            :items="statusOptions"
            class="w-40"
            @update:model-value="(v: { value: string } | undefined) => { statusFilter = v?.value ?? 'pending'; onStatusChange() }"
          />
        </div>
      </div>
    </UCard>

    <UCard variant="elevated">
      <PaginationBar
        v-if="pageInfo"
        :page-info="pageInfo"
        item-label="requests"
        :current-count="requests.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
      <UTable :data="requests" :columns="columns" :loading="loading">
        <template #tenant-cell="{ row }">
          <span>{{ row.original.tenant?.name ?? '-' }}</span>
        </template>
        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">Unit {{ row.original.unit.unitNumber }}</span>
          <span v-else>-</span>
        </template>
        <template #licensePlate-cell="{ row }">
          <span class="font-mono font-medium">{{ row.original.licensePlate }}</span>
        </template>
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt).toLocaleDateString() }}
        </template>
        <template #actions-cell="{ row }">
          <template v-if="row.original.status === 'pending'">
            <div class="flex gap-2">
              <UButton
                size="xs"
                color="success"
                variant="soft"
                :loading="approvingId === row.original.id"
                @click="approve(row.original.id)"
              >
                Approve
              </UButton>
              <UButton
                size="xs"
                color="error"
                variant="soft"
                @click="openRejectModal(row.original.id)"
              >
                Reject
              </UButton>
            </div>
          </template>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">
              {{ selectedBuildingId ? 'No parking requests' : 'Select a building' }}
            </p>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="rejectModalOpen" title="Reject parking request" @close="closeRejectModal">
      <template #body>
        <UFormField label="Reason (optional)">
          <UTextarea v-model="rejectReason" placeholder="e.g. Invalid plate format" :rows="3" />
        </UFormField>
        <div class="flex gap-2 justify-end mt-4">
          <UButton color="neutral" variant="ghost" @click="closeRejectModal">Cancel</UButton>
          <UButton color="error" @click="confirmReject">Reject</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
