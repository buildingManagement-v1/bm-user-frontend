<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ApiResponse } from '~/types'
import type { PaginatedResponse } from '~/types'
import type { PageInfo } from '~/types'
import type { Payment } from '~/types/payment'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()

const payments = ref<Payment[]>([])
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)

const columns: TableColumn<Payment>[] = [
  { accessorKey: 'paymentDate', header: 'Date' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'notes', header: 'Notes' },
  { id: 'actions', header: 'Receipt' },
]

async function fetchPayments() {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    const response = await api<PaginatedResponse<Payment[]>>(
      `/v1/tenant/payment-history?${params.toString()}`
    )
    payments.value = response.data ?? []
    pageInfo.value = response.meta?.page_info ?? null
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

async function downloadReceipt(invoiceId: string) {
  try {
    const response = await api(
      `/v1/tenant/invoices/${invoiceId}/download`,
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

onMounted(() => {
  fetchPayments()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Payment History</h1>
      <p class="text-gray-600 mt-1">View your payment records and transaction history</p>
    </div>

    <UCard variant="elevated">
      <PaginationBar
        :page-info="pageInfo"
        item-label="payments"
        :current-count="payments.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
      <UTable :data="payments" :columns="columns" :loading="loading">
        <template #paymentDate-cell="{ row }">
          {{ new Date(row.original.paymentDate).toLocaleDateString() }}
        </template>

        <template #unit-cell="{ row }">
          <span v-if="row.original.unit">
            Unit {{ row.original.unit.unitNumber }}
            <span v-if="row.original.unit.floor != null" class="text-gray-500"> (Floor {{ row.original.unit.floor }})</span>
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #type-cell="{ row }">
          <span class="capitalize">{{ row.original.type }}</span>
        </template>

        <template #amount-cell="{ row }">
          <span class="font-medium">ETB {{ row.original.amount.toLocaleString() }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'completed' ? 'success' : row.original.status === 'pending' ? 'warning' : row.original.status === 'failed' ? 'error' : 'neutral'"
            variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #notes-cell="{ row }">
          <span class="text-gray-500">{{ row.original.notes || '-' }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UButton v-if="row.original.invoice" size="xs" color="primary" variant="ghost"
            @click="downloadReceipt(row.original.invoice!.id)">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
          </UButton>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No payment history</p>
            <p class="text-gray-500">Your payment records will appear here</p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
