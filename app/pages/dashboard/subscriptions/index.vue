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

const daysRemaining = computed(() => {
  if (!subscription.value) return 0
  const end = new Date(subscription.value.billingCycleEnd)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isExpiringSoon = computed(() => daysRemaining.value <= 30 && daysRemaining.value > 0)

const maxUnitsAllowed = computed(() => {
  if (!subscription.value?.plan) return 0
  const max = subscription.value.plan.features.maxUnits * Math.max(usage.value.buildingsUsed, 1)
  return max
})

async function fetchSubscription() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Subscription | null> & { usage: UsageStats }>(
      '/v1/app/subscriptions/my-subscription'
    )
    subscription.value = response.data ?? null
    usage.value = response.usage ?? { buildingsUsed: 0, unitsUsed: 0, managersUsed: 0 }
  } catch (error) {
    toast.add({ title: 'Failed to fetch subscription', color: 'error' })
  } finally {
    loading.value = false
  }
}

function getUsageColor(used: number, max: number) {
  if (max <= 0) return 'text-zinc-600'
  const percentage = (used / max) * 100
  if (percentage >= 90) return 'text-red-600 dark:text-red-400'
  if (percentage >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-primary-600 dark:text-primary-400'
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
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
        My Subscription
      </h1>
      <p class="mt-1.5 text-zinc-500">
        View and manage your subscription and usage
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="h-10 w-10 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!subscription" class="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 py-16 text-center">
      <UIcon name="i-heroicons-cube-transparent" class="mx-auto mb-4 h-16 w-16 text-zinc-400" />
      <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No active subscription</h3>
      <p class="mt-2 max-w-sm mx-auto text-zinc-500">
        Subscribe to a plan to start adding buildings, units, and managers.
      </p>
      <UButton color="primary" size="lg" class="mt-6" @click="goToPlans">
        View plans
      </UButton>
    </div>

    <div v-else class="space-y-8">
      <!-- Expiring soon -->
      <UAlert
        v-if="isExpiringSoon"
        color="warning"
        icon="i-heroicons-exclamation-triangle"
        title="Subscription expiring soon"
        :description="`Your subscription will expire in ${daysRemaining} days on ${new Date(subscription.billingCycleEnd).toLocaleDateString()}. Consider renewing or upgrading.`"
      />

      <!-- Current plan + Usage in one row -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Current plan card -->
        <UCard variant="elevated" class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Current plan</h2>
              <div class="flex items-center gap-2">
                <UBadge v-if="subscription.plan?.type === 'custom'" color="primary" variant="subtle">Custom</UBadge>
                <UBadge :color="subscription.status === 'active' ? 'success' : 'warning'" variant="subtle" class="capitalize">
                  {{ subscription.status }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {{ subscription.plan?.name || 'N/A' }}
              </span>
              <span class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                ETB {{ subscription.totalAmount }}
              </span>
              <span class="text-zinc-500">/ year</span>
            </div>

            <div v-if="subscription.plan" class="space-y-2.5 border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <div class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <UIcon name="i-heroicons-check-circle" class="h-5 w-5 shrink-0 text-green-500" />
                <span>{{ subscription.plan.features.maxBuildings }} building{{ subscription.plan.features.maxBuildings > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <UIcon name="i-heroicons-check-circle" class="h-5 w-5 shrink-0 text-green-500" />
                <span>{{ subscription.plan.features.maxUnits }} units per building</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <UIcon name="i-heroicons-check-circle" class="h-5 w-5 shrink-0 text-green-500" />
                <span>{{ subscription.plan.features.maxManagers }} manager{{ subscription.plan.features.maxManagers > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="subscription.plan.features.premiumFeatures?.length" class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                <p class="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Premium</p>
                <div class="flex flex-wrap gap-x-3 gap-y-1">
                  <span
                    v-for="feature in subscription.plan.features.premiumFeatures"
                    :key="feature"
                    class="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    <UIcon name="i-heroicons-star" class="h-3.5 w-3.5 text-amber-500" />
                    {{ feature }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Usage stats -->
        <UCard v-if="subscription.plan" variant="elevated">
          <template #header>
            <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Usage</h2>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
                <UIcon name="i-heroicons-building-office-2" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Buildings</p>
                <p class="text-xl font-bold" :class="getUsageColor(usage.buildingsUsed, subscription.plan.features.maxBuildings)">
                  {{ usage.buildingsUsed }} <span class="text-sm font-normal text-zinc-500">/ {{ subscription.plan.features.maxBuildings }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
                <UIcon name="i-heroicons-home" class="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Units (total)</p>
                <p class="text-xl font-bold" :class="getUsageColor(usage.unitsUsed, maxUnitsAllowed)">
                  {{ usage.unitsUsed }} <span class="text-sm font-normal text-zinc-500">/ {{ maxUnitsAllowed }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <UIcon name="i-heroicons-users" class="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium uppercase tracking-wider text-zinc-400">Managers</p>
                <p class="text-xl font-bold" :class="getUsageColor(usage.managersUsed, subscription.plan.features.maxManagers)">
                  {{ usage.managersUsed }} <span class="text-sm font-normal text-zinc-500">/ {{ subscription.plan.features.maxManagers }}</span>
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Billing -->
      <UCard variant="elevated">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-200">Billing</h2>
        </template>

        <div class="space-y-1">
          <div class="flex items-center justify-between py-3 rounded-lg px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <span class="text-zinc-500">Billing cycle start</span>
            <span class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ new Date(subscription.billingCycleStart).toLocaleDateString() }}
            </span>
          </div>
          <div class="flex items-center justify-between py-3 rounded-lg px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <span class="text-zinc-500">Billing cycle end</span>
            <span class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ new Date(subscription.billingCycleEnd).toLocaleDateString() }}
            </span>
          </div>
          <div class="flex items-center justify-between py-3 rounded-lg px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <span class="text-zinc-500">Next billing date</span>
            <span class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ new Date(subscription.nextBillingDate).toLocaleDateString() }}
            </span>
          </div>
          <div class="flex items-center justify-between py-3 rounded-lg px-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <span class="text-zinc-500">Days remaining</span>
            <span class="font-semibold" :class="isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'">
              {{ daysRemaining }} days
            </span>
          </div>

          <div class="pt-4">
            <UButton color="primary" variant="outline" block @click="downloadInvoice">
              <UIcon name="i-heroicons-arrow-down-tray" class="mr-2 h-4 w-4" />
              Download invoice
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
