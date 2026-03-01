<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ApiResponse } from '~/types'
import type { PaginatedResponse } from '~/types'
import type { PageInfo } from '~/types'
import type { TenantPaymentRequest } from '~/types/payment-request'

definePageMeta({
  layout: 'tenant',
})

const { api } = useApi()
const toast = useToast()

const requests = ref<TenantPaymentRequest[]>([])
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const isFormOpen = ref(false)

const columns: TableColumn<TenantPaymentRequest>[] = [
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'paymentDate', header: 'Date' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'createdAt', header: 'Submitted' },
  { id: 'receipt', header: 'Receipt' },
]

async function fetchRequests() {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const params = new URLSearchParams()
    params.set('limit', String(limit.value))
    params.set('offset', String(offset))
    const res = await api<PaginatedResponse<TenantPaymentRequest[]>>(
      `/v1/tenant/payment-requests?${params.toString()}`
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

const receiptPreviewUrl = ref<string | null>(null)
const receiptModalOpen = ref(false)

async function viewReceipt(id: string) {
  try {
    const blob = await api<Blob>(`/v1/tenant/payment-requests/${id}/receipt`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob as unknown as Blob)
    receiptPreviewUrl.value = url
    receiptModalOpen.value = true
  } catch (e: any) {
    toast.add({ title: 'Failed to load receipt', description: e.message, color: 'error' })
  }
}

function closeReceiptPreview() {
  if (receiptPreviewUrl.value) {
    URL.revokeObjectURL(receiptPreviewUrl.value)
    receiptPreviewUrl.value = null
  }
  receiptModalOpen.value = false
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
        <h1 class="text-2xl font-bold text-gray-900">Payment requests</h1>
        <p class="text-gray-600 mt-1">Submit a payment with receipt for manager approval</p>
      </div>
      <UButton color="primary" icon="i-heroicons-plus" @click="isFormOpen = true">
        Submit payment
      </UButton>
    </div>

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
        <template #amount-cell="{ row }">
          ETB {{ Number(row.original.amount).toLocaleString() }}
        </template>
        <template #type-cell="{ row }">
          <span class="capitalize">{{ row.original.type }}</span>
        </template>
        <template #paymentDate-cell="{ row }">
          {{ new Date(row.original.paymentDate).toLocaleDateString() }}
        </template>
        <template #status-cell="{ row }">
          <div>
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
          </div>
        </template>
        <template #createdAt-cell="{ row }">
          {{ new Date(row.original.createdAt).toLocaleDateString() }}
        </template>
        <template #receipt-cell="{ row }">
          <UButton size="xs" color="primary" variant="ghost" @click="viewReceipt(row.original.id)">
            View
          </UButton>
        </template>
        <template #empty>
          <div class="text-center py-12">
            <p class="text-gray-500">No payment requests yet. Submit one for approval.</p>
            <UButton class="mt-4" color="primary" @click="isFormOpen = true">Submit payment</UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isFormOpen" title="Submit payment for approval">
      <template #body>
        <TenantPaymentRequestForm @success="handleSuccess" @cancel="isFormOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="receiptModalOpen" title="Receipt" @close="closeReceiptPreview">
      <template #body>
        <div class="flex justify-center p-4">
          <img v-if="receiptPreviewUrl" :src="receiptPreviewUrl" alt="Receipt" class="max-w-full max-h-[70vh] object-contain" />
        </div>
      </template>
    </UModal>
  </div>
</template>
