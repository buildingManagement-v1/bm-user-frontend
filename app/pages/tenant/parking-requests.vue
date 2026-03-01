<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PaginatedResponse, PageInfo } from '~/types'
import type { TenantParkingRequest } from '~/types/parking'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()

const requests = ref<TenantParkingRequest[]>([])
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const searchQ = ref('')
const isFormOpen = ref(false)

const columns: TableColumn<TenantParkingRequest>[] = [
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'licensePlate', header: 'License plate' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Submitted' },
]

async function fetchRequests() {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const res = await api<PaginatedResponse<TenantParkingRequest[]>>(
      `/v1/tenant/parking-requests?${params.toString()}`
    )
    requests.value = res.data ?? []
    pageInfo.value = res.meta?.page_info ?? null
  } catch (e: any) {
    toast.add({ title: 'Failed to load requests', description: e.message, color: 'error' })
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

function onSearch() {
  currentPage.value = 1
  fetchRequests()
}

function handleSuccess() {
  isFormOpen.value = false
  fetchRequests()
}

onMounted(() => {
  fetchRequests()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Parking requests</h1>
        <p class="text-gray-600 mt-1">Request to register a vehicle for your unit</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="isFormOpen = true">
        Request parking
      </UButton>
    </div>

    <UCard class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="searchQ"
          placeholder="Search by unit or license plate..."
          class="w-56"
          @keyup.enter="onSearch"
        />
        <UButton size="sm" color="neutral" variant="outline" @click="onSearch">
          Search
        </UButton>
      </div>
    </UCard>

    <UCard>
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
        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">Unit {{ row.original.unit.unitNumber }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #licensePlate-cell="{ row }">
          <span class="font-mono font-medium">{{ row.original.licensePlate }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'approved' ? 'success' : row.original.status === 'rejected' ? 'error' : 'warning'"
            variant="subtle"
            class="capitalize"
          >
            {{ row.original.status }}
          </UBadge>
          <p v-if="row.original.status === 'rejected' && row.original.rejectionReason" class="text-xs text-gray-500 mt-1">
            {{ row.original.rejectionReason }}
          </p>
        </template>
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt).toLocaleDateString() }}
        </template>
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No parking requests yet. Submit one for approval.</p>
            <UButton class="mt-4" color="primary" @click="isFormOpen = true">Request parking</UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isFormOpen" title="Request parking registration">
      <template #body>
        <TenantParkingRequestForm @success="handleSuccess" @cancel="isFormOpen = false" />
      </template>
    </UModal>
  </div>
</template>
