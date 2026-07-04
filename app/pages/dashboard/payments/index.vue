<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Payment } from '~/types/payment'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const payments = ref<Payment[]>([])
const { selectedBuildingId } = useSelectedBuilding()
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const filterType = ref<string>('')
const filterStatus = ref<string>('')
const searchQ = ref('')
const isCreateModalOpen = ref(false)

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'rent', label: 'Rent' },
  { value: 'utility', label: 'Utility' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'other', label: 'Other' },
]
const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const selectedTypeOption = computed({
  get: () => typeOptions.find(o => o.value === filterType.value) ?? typeOptions[0],
  set: (v: { value: string } | undefined) => {
    filterType.value = v?.value ?? ''
    onFilterChange()
  },
})
const selectedStatusOption = computed({
  get: () => statusOptions.find(o => o.value === filterStatus.value) ?? statusOptions[0],
  set: (v: { value: string } | undefined) => {
    filterStatus.value = v?.value ?? ''
    onFilterChange()
  },
})

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'paymentDate', header: 'Payment Date' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'invoice', header: 'Invoice' },
]

async function fetchPayments() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    if (filterType.value) params.set('type', filterType.value)
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (searchQ.value.trim()) params.set('q', searchQ.value.trim())
    const response = await buildingApi<PaginatedResponse<Payment[]>>(
      selectedBuildingId.value,
      `/v1/app/payments?${params.toString()}`
    )
    payments.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch payments', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchPayments()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchPayments()
}

function onFilterChange() {
  currentPage.value = 1
  fetchPayments()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function handleSuccess() {
  isCreateModalOpen.value = false
  fetchPayments()
}

async function downloadReceipt(invoiceId: string) {
  if (!selectedBuildingId.value) return

  try {
    const response = await buildingApi(
      selectedBuildingId.value,
      `/v1/app/invoices/${invoiceId}/download`,
      { responseType: 'blob' }
    )

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `receipt-${invoiceId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({ title: 'Receipt downloaded', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Failed to download receipt', description: error.message, color: 'error' })
  }
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchPayments()
  }
}, { immediate: true })

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
        <p class="text-gray-600 mt-1">Record and track tenant payments</p>
      </div>

      <div class="flex items-center gap-3">
        <BuildingSelector v-model="selectedBuildingId" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          Record Payment
        </UButton>
      </div>
    </div>

    <UCard v-if="selectedBuildingId" variant="elevated" class="mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Type</span>
          <USelectMenu v-model="selectedTypeOption" :items="typeOptions" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Status</span>
          <USelectMenu v-model="selectedStatusOption" :items="statusOptions" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Tenant name</span>
          <UInput v-model="searchQ" placeholder="Search..." class="w-48" @keyup.enter="onFilterChange" />
          <UButton size="sm" color="neutral" variant="outline" @click="onFilterChange">Search</UButton>
        </div>
      </div>
    </UCard>

    <UCard variant="elevated">
      <PaginationBar :page-info="pageInfo" item-label="payments" :current-count="payments.length" :limit="limit"
        show-limit-selector @go-to-page="goToPage" @update:limit="onLimitChange" />
      <UTable :data="payments" :columns="columns" :loading="loading">
        <template #tenant-cell="{ row }">
          <span>{{ row.original.tenant.name }}</span>
        </template>

        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">
            Unit {{ row.original.unit.unitNumber }}
            <span v-if="row.original.unit.floor != null" class="text-zinc-500"> (Floor {{ row.original.unit.floor }})</span>
          </span>
          <span v-else class="text-zinc-400">-</span>
        </template>

        <template #amount-cell="{ row }">
          <div>
            <span class="font-medium">ETB {{ Number(row.original.amount).toLocaleString() }}</span>
            <div v-if="Number(row.original.vatAmount) > 0 || Number(row.original.withholdingAmount) > 0" class="text-xs text-zinc-500">
              Base {{ Number(row.original.baseAmount).toLocaleString() }}
              <span v-if="Number(row.original.vatAmount) > 0"> + VAT {{ Number(row.original.vatAmount).toLocaleString() }}</span>
              <span v-if="Number(row.original.withholdingAmount) > 0"> − WHT {{ Number(row.original.withholdingAmount).toLocaleString() }}</span>
            </div>
          </div>
        </template>

        <template #type-cell="{ row }">
          <UBadge
            :color="row.original.type === 'rent' ? 'primary' : row.original.type === 'deposit' ? 'success' : 'neutral'"
            variant="subtle" class="capitalize">
            {{ row.original.type }}
          </UBadge>
        </template>

        <template #paymentDate-cell="{ row }">
          <span>{{ formatDate(row.original.paymentDate) }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'completed' ? 'success' : row.original.status === 'pending' ? 'warning' : 'error'"
            variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #invoice-cell="{ row }">
          <div v-if="row.original.invoice" class="flex items-center gap-2">
            <span class="text-primary-600">{{ row.original.invoice.invoiceNumber }}</span>
            <UButton size="xs" color="primary" variant="ghost" @click="downloadReceipt(row.original.invoice.id)">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            </UButton>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No payments recorded</p>
            <p class="text-gray-500 mb-4">
              {{ selectedBuildingId ? 'Record your first payment' : 'Select a building to view payments' }}
            </p>
            <UButton v-if="selectedBuildingId" color="primary" @click="isCreateModalOpen = true">
              Record Payment
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="Record Payment">
      <template #body>
        <PaymentForm v-if="selectedBuildingId" :building-id="selectedBuildingId" @success="handleSuccess"
          @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>