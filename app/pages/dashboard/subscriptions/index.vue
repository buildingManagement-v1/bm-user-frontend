<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ApiResponse, SubscriptionRequest } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()
const { subscriptionState, checkSubscription, daysLeft } = useSubscription()

const loading = ref(false)
const requests = ref<SubscriptionRequest[]>([])

const subscription = computed(() => subscriptionState.value?.data ?? null)
const billing = computed(() => subscriptionState.value?.billing ?? null)
const usage = computed(() => subscriptionState.value?.usage ?? { buildingsUsed: 0, unitsUsed: 0, managersUsed: 0 })
const lastPlan = computed(() => subscription.value ?? billing.value?.expiredSubscription ?? null)
const isExpiringSoon = computed(() => !!subscription.value && daysLeft.value <= 30 && daysLeft.value > 0)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const requestColumns: TableColumn<SubscriptionRequest>[] = [
  { accessorKey: 'createdAt', header: 'Submitted' },
  { accessorKey: 'plan', header: 'Plan' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'details', header: '' },
]

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

async function load() {
  loading.value = true
  try {
    const [, reqs] = await Promise.all([
      checkSubscription(),
      api<ApiResponse<SubscriptionRequest[]>>('/v1/app/subscriptions/requests'),
    ])
    requests.value = reqs.data
  } catch (error) {
    toast.add({ title: 'Failed to load subscription', description: errorMessage(error), color: 'error' })
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
  if (!lastPlan.value) return
  try {
    const blob = await api<Blob>(`/v1/app/subscriptions/${lastPlan.value.id}/invoice`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `subscription-invoice-${lastPlan.value.id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    toast.add({ title: 'Failed to download invoice', description: errorMessage(error), color: 'error' })
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
          My Subscription
        </h1>
        <p class="mt-1.5 text-zinc-500">Your plan, usage and plan requests</p>
      </div>
      <UButton color="primary" to="/dashboard/plans" icon="i-heroicons-arrow-path-rounded-square">
        {{ subscription && !billing?.isTrial ? 'Renew or change plan' : 'Choose a plan' }}
      </UButton>
    </div>

    <div v-if="loading && !subscriptionState" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="h-10 w-10 animate-spin text-primary-500" />
    </div>

    <template v-else>
      <UAlert v-if="isExpiringSoon" color="warning" icon="i-heroicons-exclamation-triangle"
        :title="billing?.isTrial ? 'Free trial ending soon' : 'Subscription expiring soon'"
        :description="`It ends in ${daysLeft} day(s) on ${formatDate(subscription!.billingCycleEnd)}. After that your account becomes read-only until a plan is activated.`" />

      <div v-if="!lastPlan" class="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
        <UIcon name="i-heroicons-cube-transparent" class="mx-auto mb-4 h-16 w-16 text-zinc-400" />
        <h3 class="text-lg font-semibold text-zinc-900">No subscription yet</h3>
        <p class="mt-2 max-w-sm mx-auto text-zinc-500">Choose a plan to start adding buildings, units and managers.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UCard variant="elevated" class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-zinc-800">{{ subscription ? 'Current plan' : 'Last plan' }}</h2>
              <div class="flex items-center gap-2">
                <UBadge v-if="billing?.isTrial" color="neutral" variant="subtle">Free trial</UBadge>
                <UBadge v-if="lastPlan.plan?.type === 'custom'" color="primary" variant="subtle">Custom</UBadge>
                <UBadge :color="subscription ? 'success' : 'error'" variant="subtle">
                  {{ subscription ? 'Active' : 'Ended — read-only' }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-2xl font-bold text-zinc-900">{{ lastPlan.plan?.name }}</span>
              <template v-if="Number(lastPlan.totalAmount) > 0">
                <span class="text-xl font-semibold text-primary-600">
                  ETB {{ Number(lastPlan.totalAmount).toLocaleString() }}
                </span>
                <span class="text-zinc-500">/ year</span>
              </template>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm border-t border-zinc-200 pt-4">
              <div>
                <p class="text-zinc-500">Started</p>
                <p class="font-medium">{{ formatDate(lastPlan.billingCycleStart) }}</p>
              </div>
              <div>
                <p class="text-zinc-500">{{ subscription ? 'Ends' : 'Ended' }}</p>
                <p class="font-medium">{{ formatDate(lastPlan.billingCycleEnd) }}</p>
              </div>
              <div v-if="subscription">
                <p class="text-zinc-500">Days remaining</p>
                <p class="font-semibold" :class="isExpiringSoon ? 'text-amber-600' : ''">{{ daysLeft }}</p>
              </div>
            </div>

            <UButton v-if="Number(lastPlan.totalAmount) > 0" color="primary" variant="outline"
              icon="i-heroicons-arrow-down-tray" @click="downloadInvoice">
              Download invoice
            </UButton>
          </div>
        </UCard>

        <UCard v-if="lastPlan.plan" variant="elevated">
          <template #header>
            <h2 class="text-base font-semibold text-zinc-800">Usage</h2>
          </template>
          <div class="space-y-4 text-sm">
            <div class="flex justify-between">
              <span class="text-zinc-500">Buildings</span>
              <span class="font-bold" :class="getUsageColor(usage.buildingsUsed, lastPlan.plan.features.maxBuildings)">
                {{ usage.buildingsUsed }} / {{ lastPlan.plan.features.maxBuildings }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-500">Active units (all buildings)</span>
              <span class="font-bold">{{ usage.unitsUsed }}</span>
            </div>
            <p class="text-xs text-zinc-400 -mt-2">Limit: {{ lastPlan.plan.features.maxUnits }} per building</p>
            <div class="flex justify-between">
              <span class="text-zinc-500">Managers</span>
              <span class="font-bold" :class="getUsageColor(usage.managersUsed, lastPlan.plan.features.maxManagers)">
                {{ usage.managersUsed }} / {{ lastPlan.plan.features.maxManagers }}
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <UCard variant="elevated">
        <template #header>
          <h2 class="text-base font-semibold text-zinc-800">Plan requests</h2>
        </template>
        <UTable :data="requests" :columns="requestColumns" :loading="loading">
          <template #createdAt-cell="{ row }">{{ formatDate(row.original.createdAt) }}</template>
          <template #plan-cell="{ row }">{{ row.original.plan.name }}</template>
          <template #amount-cell="{ row }">ETB {{ Number(row.original.amount).toLocaleString() }}</template>
          <template #status-cell="{ row }">
            <UBadge :color="statusColor[row.original.status]" variant="subtle" class="capitalize">
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #details-cell="{ row }">
            <span v-if="row.original.status === 'rejected' && row.original.rejectionReason" class="text-sm text-red-600">
              {{ row.original.rejectionReason }}
            </span>
            <span v-else-if="row.original.paymentReference" class="text-xs text-zinc-500">
              Ref {{ row.original.paymentReference }}
            </span>
          </template>
          <template #empty>
            <p class="text-center py-6 text-zinc-500">No plan requests yet</p>
          </template>
        </UTable>
      </UCard>
    </template>
  </div>
</template>
