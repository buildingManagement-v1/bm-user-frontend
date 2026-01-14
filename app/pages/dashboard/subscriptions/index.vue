<script setup lang="ts">
import type { Subscription } from '~/types/subscription'
import type { ApiResponse } from '~/types/api'

const { api } = useApi()
const toast = useToast()

const subscription = ref<Subscription | null>(null)
const loading = ref(false)
const isChangePlanModalOpen = ref(false)

const daysRemaining = computed(() => {
  if (!subscription.value) return 0
  const end = new Date(subscription.value.billingCycleEnd)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isExpiringSoon = computed(() => daysRemaining.value <= 30 && daysRemaining.value > 0)

async function fetchSubscription() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Subscription | null>>('/v1/app/subscriptions/my-subscription')
    subscription.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch subscription', color: 'error' })
  } finally {
    loading.value = false
  }
}

function handleChangePlanSuccess() {
  isChangePlanModalOpen.value = false
  fetchSubscription()
}

async function downloadInvoice() {
  if (!subscription.value) return

  try {
    const response = await api(
      `/v1/platform/subscriptions/${subscription.value.id}/download`,
      { responseType: 'blob' }
    )

    const url = window.URL.createObjectURL(new Blob([response]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `subscription-invoice-${subscription.value.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({ title: 'Invoice downloaded', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Failed to download invoice', description: error.message, color: 'error' })
  }
}

onMounted(() => {
  fetchSubscription()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Subscription</h1>
        <p class="text-gray-600 mt-1">View and manage your subscription</p>
      </div>
      <UButton v-if="subscription" color="primary" icon="i-heroicons-arrow-path" @click="isChangePlanModalOpen = true">
        Change Plan
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!subscription" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
      <p class="text-gray-600">You don't have an active subscription yet.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Alert for expiring subscription -->
      <UAlert v-if="isExpiringSoon" color="warning" icon="i-heroicons-exclamation-triangle"
        title="Subscription Expiring Soon"
        :description="`Your subscription will expire in ${daysRemaining} days on ${new Date(subscription.billingCycleEnd).toLocaleDateString()}`" />

      <!-- Current Plan Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Current Plan</h2>
            <UBadge :color="subscription.status === 'active' ? 'success' : 'warning'" variant="subtle">
              {{ subscription.status }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-gray-900">{{ subscription.plan?.name || 'N/A' }}</span>
            <span class="text-2xl font-semibold text-gray-900">${{ subscription.totalAmount }}</span>
            <span class="text-gray-600">/year</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Buildings</div>
              <div class="text-2xl font-semibold text-gray-900">{{ subscription.buildingCount }}</div>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Managers</div>
              <div class="text-2xl font-semibold text-gray-900">{{ subscription.managerCount }}</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Billing Information -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">Billing Information</h2>
        </template>

        <div class="space-y-4">
          <div class="flex justify-between items-center py-3 border-b border-gray-200">
            <span class="text-gray-600">Billing Cycle Start</span>
            <span class="font-medium text-gray-900">
              {{ new Date(subscription.billingCycleStart).toLocaleDateString() }}
            </span>
          </div>

          <div class="flex justify-between items-center py-3 border-b border-gray-200">
            <span class="text-gray-600">Billing Cycle End</span>
            <span class="font-medium text-gray-900">
              {{ new Date(subscription.billingCycleEnd).toLocaleDateString() }}
            </span>
          </div>

          <div class="flex justify-between items-center py-3 border-b border-gray-200">
            <span class="text-gray-600">Next Billing Date</span>
            <span class="font-medium text-gray-900">
              {{ new Date(subscription.nextBillingDate).toLocaleDateString() }}
            </span>
          </div>

          <div class="flex justify-between items-center py-3">
            <span class="text-gray-600">Days Remaining</span>
            <span class="font-medium" :class="isExpiringSoon ? 'text-orange-600' : 'text-gray-900'">
              {{ daysRemaining }} days
            </span>
          </div>

          <div class="pt-4">
            <UButton color="primary" variant="outline" block @click="downloadInvoice">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-2" />
              Download Invoice
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Plan Details -->
      <UCard v-if="subscription.plan">
        <template #header>
          <h2 class="text-lg font-semibold">Plan Details</h2>
        </template>

        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Price per Building (Yearly)</span>
            <span class="font-medium text-gray-900">${{ subscription.plan.buildingPrice }}</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-gray-600">Price per Manager (Yearly)</span>
            <span class="font-medium text-gray-900">${{ subscription.plan.managerPrice }}</span>
          </div>

          <div class="pt-4 border-t border-gray-200">
            <div class="text-xs text-gray-500 mb-2">Calculation:</div>
            <div class="text-sm text-gray-700">
              ({{ subscription.buildingCount }} buildings × ${{ subscription.plan.buildingPrice }}) +
              ({{ subscription.managerCount }} managers × ${{ subscription.plan.managerPrice }}) =
              <span class="font-semibold">${{ subscription.totalAmount }}/year</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="isChangePlanModalOpen" title="Change Plan">
      <template #body>
        <div>
          <ChangePlanModal v-if="subscription" :subscription="subscription" @success="handleChangePlanSuccess"
            @cancel="isChangePlanModalOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>