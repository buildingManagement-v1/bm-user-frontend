<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Payment } from '~/types/payment'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const payments = ref<Payment[]>([])
const buildings = ref<Building[]>([])
const selectedBuildingId = ref<string>('')
const loading = ref(false)
const loadingBuildings = ref(false)
const isCreateModalOpen = ref(false)

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'paymentDate', header: 'Payment Date' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'invoice', header: 'Invoice' },
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
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function fetchPayments() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const response = await buildingApi<ApiResponse<Payment[]>>(
      selectedBuildingId.value,
      '/v1/app/payments'
    )
    payments.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch payments', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
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
    fetchPayments()
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
        <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
        <p class="text-gray-600 mt-1">Record and track tenant payments</p>
      </div>

      <div class="flex items-center gap-3">
        <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
          :loading="loadingBuildings" class="w-64" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          Record Payment
        </UButton>
      </div>
    </div>

    <UCard>
      <UTable :data="payments" :columns="columns" :loading="loading">
        <template #tenant-cell="{ row }">
          <span>{{ row.original.tenant.name }}</span>
        </template>

        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">
            {{ row.original.unit.unitNumber }}
            <span v-if="row.original.unit.floor" class="text-gray-500">
              (Floor {{ row.original.unit.floor }})
            </span>
          </span>
          <span v-else class="text-gray-400">N/A</span>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-medium">${{ row.original.amount.toLocaleString() }}</span>
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