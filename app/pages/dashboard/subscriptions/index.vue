<script setup lang="ts">
import type { ApiResponse } from '~/types/api'

interface Subscription {
  id: string
  totalAmount: string
  billingCycleStart: string
  billingCycleEnd: string
  nextBillingDate: string
  status: string
  plan?: {
    id: string
    name: string
    price: number
    type: string
    features: {
      maxBuildings: number
      maxUnits: number
      maxManagers: number
      premiumFeatures: string[]
    }
  }
}

interface UsageStats {
  buildingsUsed: number
  unitsUsed: number
  managersUsed: number
}

const { api } = useApi()
const toast = useToast()
const router = useRouter()

const subscription = ref<Subscription | null>(null)
const usage = ref<UsageStats>({ buildingsUsed: 0, unitsUsed: 0, managersUsed: 0 })
const loading = ref(false)
const loadingUsage = ref(false)

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

    if (subscription.value) {
      await fetchUsageStats()
    }
  } catch (error) {
    toast.add({ title: 'Failed to fetch subscription', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function fetchUsageStats() {
  loadingUsage.value = true
  try {
    // Fetch buildings count
    const buildingsRes = await api<ApiResponse<any[]>>('/v1/app/buildings')
    usage.value.buildingsUsed = buildingsRes.data.length

    // Fetch units count for each building
    let totalUnits = 0
    for (const building of buildingsRes.data) {
      try {
        const unitsRes = await api<ApiResponse<any[]>>('/v1/app/units', {
          headers: { 'X-Building-Id': building.id }
        })
        totalUnits += unitsRes.data.length
      } catch (err) {
        console.error(`Failed to fetch units for building ${building.id}`, err)
      }
    }
    usage.value.unitsUsed = totalUnits

    // Fetch managers count
    const managersRes = await api<ApiResponse<any[]>>('/v1/app/managers')
    usage.value.managersUsed = managersRes.data.length
  } catch (error) {
    console.error('Failed to fetch usage stats', error)
  } finally {
    loadingUsage.value = false
  }
}

function getUsageColor(used: number, max: number) {
  const percentage = (used / max) * 100
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 70) return 'text-orange-600'
  return 'text-green-600'
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

function goToPlans() {
  router.push('/dashboard/plans')
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
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!subscription" class="text-center py-12">
      <UIcon name="i-heroicons-exclamation-circle" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
      <p class="text-gray-600 mb-4">You don't have an active subscription yet.</p>
      <UButton color="primary" @click="goToPlans">View Plans</UButton>
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
            <div class="flex items-center gap-2">
              <UBadge v-if="subscription.plan?.type === 'custom'" color="primary" variant="subtle">Custom</UBadge>
              <UBadge :color="subscription.status === 'active' ? 'success' : 'warning'" variant="subtle">
                {{ subscription.status }}
              </UBadge>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-gray-900">{{ subscription.plan?.name || 'N/A' }}</span>
            <span class="text-2xl font-semibold text-gray-900">${{ subscription.totalAmount }}</span>
            <span class="text-gray-600">/year</span>
          </div>

          <!-- Plan Features -->
          <div v-if="subscription.plan" class="space-y-3 pt-4 border-t">
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ subscription.plan.features.maxBuildings }} building{{ subscription.plan.features.maxBuildings > 1
                ? 's' :
                '' }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ subscription.plan.features.maxUnits }} units per building</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ subscription.plan.features.maxManagers }} manager{{ subscription.plan.features.maxManagers > 1 ?
                's' : ''
                }} per building</span>
            </div>
            <div v-if="subscription.plan.features.premiumFeatures.length > 0" class="pt-2 border-t">
              <p class="text-xs font-medium text-gray-700 mb-2">Premium Features:</p>
              <div v-for="feature in subscription.plan.features.premiumFeatures" :key="feature"
                class="flex items-center gap-2 text-xs text-gray-600">
                <UIcon name="i-heroicons-star" class="w-4 h-4 text-yellow-500" />
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Usage Statistics -->
      <UCard v-if="subscription.plan">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Usage Statistics</h2>
            <UIcon v-if="loadingUsage" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
          </div>
        </template>

        <div v-if="loadingUsage" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary-500" />
        </div>

        <div v-else class="grid grid-cols-3 gap-6">
          <!-- Buildings Usage -->
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-2">Buildings</div>
            <div class="text-3xl font-bold"
              :class="getUsageColor(usage.buildingsUsed, subscription.plan.features.maxBuildings)">
              {{ usage.buildingsUsed }}
            </div>
            <div class="text-sm text-gray-500 mt-1">of {{ subscription.plan.features.maxBuildings }}</div>
          </div>

          <!-- Units Usage -->
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-2">Units (Total)</div>
            <div class="text-3xl font-bold"
              :class="getUsageColor(usage.unitsUsed, subscription.plan.features.maxUnits * Math.max(usage.buildingsUsed, 1))">
              {{ usage.unitsUsed }}
            </div>
            <div class="text-sm text-gray-500 mt-1">of {{ subscription.plan.features.maxUnits *
              Math.max(usage.buildingsUsed,
              1) }}</div>
          </div>

          <!-- Managers Usage -->
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-2">Managers</div>
            <div class="text-3xl font-bold"
              :class="getUsageColor(usage.managersUsed, subscription.plan.features.maxManagers)">
              {{ usage.managersUsed }}
            </div>
            <div class="text-sm text-gray-500 mt-1">of {{ subscription.plan.features.maxManagers }}</div>
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
    </div>
  </div>
</template>