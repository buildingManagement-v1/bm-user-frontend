<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Invoice } from '~/types/payment'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const invoices = ref<Invoice[]>([])
const buildings = ref<Building[]>([])
const selectedBuildingId = ref<string>('')
const loading = ref(false)
const loadingBuildings = ref(false)
const isDetailModalOpen = ref(false)
const selectedInvoice = ref<Invoice | null>(null)

const columns: TableColumn<Invoice>[] = [
  { accessorKey: 'invoiceNumber', header: 'Invoice #' },
  { accessorKey: 'tenant', header: 'Tenant' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'dueDate', header: 'Due Date' },
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
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function fetchInvoices() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const response = await buildingApi<ApiResponse<Invoice[]>>(
      selectedBuildingId.value,
      '/v1/app/invoices'
    )
    invoices.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch invoices', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

async function downloadInvoice(invoiceId: string) {
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
    link.setAttribute('download', `invoice-${invoiceId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({ title: 'Invoice downloaded', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Failed to download invoice', description: error.message, color: 'error' })
  }
}

function openDetailModal(invoice: Invoice) {
  selectedInvoice.value = invoice
  isDetailModalOpen.value = true
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    fetchInvoices()
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
        <h1 class="text-2xl font-bold text-gray-900">Invoices</h1>
        <p class="text-gray-600 mt-1">View auto-generated payment invoices</p>
      </div>

      <div class="flex items-center gap-3">
        <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
          :loading="loadingBuildings" class="w-64" />
      </div>
    </div>

    <UCard>
      <UTable :data="invoices" :columns="columns" :loading="loading">
        <template #invoiceNumber-cell="{ row }">
          <span class="font-medium">{{ row.original.invoiceNumber }}</span>
        </template>

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

        <template #dueDate-cell="{ row }">
          <span>{{ formatDate(row.original.dueDate) }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'paid' ? 'success' : row.original.status === 'overdue' ? 'error' : row.original.status === 'sent' ? 'primary' : 'neutral'"
            variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openDetailModal(row.original)">
              View
            </UButton>
            <UButton size="xs" color="primary" variant="ghost" @click="downloadInvoice(row.original.id)">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
            </UButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No invoices yet</p>
            <p class="text-gray-500">
              {{ selectedBuildingId ?
                'Invoices are generated automatically when payments are recorded' : 'Select a building to view invoices'
              }}
            </p>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isDetailModalOpen" title="Invoice Details">
      <template #body>
        <div v-if="selectedInvoice" class="space-y-4">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-500">Invoice Number</p>
              <p class="text-lg font-medium">{{ selectedInvoice.invoiceNumber }}</p>
            </div>
            <UBadge
              :color="selectedInvoice.status === 'paid' ? 'success' : selectedInvoice.status === 'overdue' ? 'error' : selectedInvoice.status === 'sent' ? 'primary' : 'neutral'"
              variant="subtle" class="capitalize">
              {{ selectedInvoice.status }}
            </UBadge>
          </div>

          <div class="grid grid-cols-2 gap-4 py-4 border-y">
            <div>
              <p class="text-sm text-gray-500">Tenant</p>
              <p class="font-medium">{{ selectedInvoice.tenant.name }}</p>
              <p class="text-sm text-gray-600">{{ selectedInvoice.tenant.email }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Unit</p>
              <p class="font-medium" v-if="selectedInvoice.unit">
                {{ selectedInvoice.unit.unitNumber }}
                <span v-if="selectedInvoice.unit.floor" class="text-gray-500">
                  (Floor {{ selectedInvoice.unit.floor }})
                </span>
              </p>
              <p v-else class="text-gray-400">N/A</p>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Items</p>
            <div class="space-y-2">
              <div v-for="(item, index) in selectedInvoice.items" :key="index"
                class="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span>{{ item.description }}</span>
                <span class="font-medium">${{ item.amount.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t">
            <span class="text-lg font-medium">Total Amount</span>
            <span class="text-2xl font-bold text-primary-600">${{ selectedInvoice.amount.toLocaleString() }}</span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Due Date</p>
              <p class="font-medium">{{ formatDate(selectedInvoice.dueDate) }}</p>
            </div>
            <div>
              <p class="text-gray-500">Created</p>
              <p class="font-medium">{{ formatDate(selectedInvoice.createdAt) }}</p>
            </div>
          </div>

          <div v-if="selectedInvoice.notes" class="bg-gray-50 p-3 rounded">
            <p class="text-sm text-gray-500 mb-1">Notes</p>
            <p class="text-sm">{{ selectedInvoice.notes }}</p>
          </div>

          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="isDetailModalOpen = false">
              Close
            </UButton>
            <UButton color="primary" @click="downloadInvoice(selectedInvoice!.id)">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-2" />
              Download PDF
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>