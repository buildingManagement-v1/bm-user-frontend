<script setup lang="ts">
import type { ApiResponse, SubscriptionPlan } from '~/types'
import { errorMessage } from '~/types/api'

const { api } = useApi()
const toast = useToast()
const router = useRouter()
const { subscriptionState, checkSubscription } = useSubscription()

const plans = ref<SubscriptionPlan[]>([])
const loading = ref(false)
const startingTrial = ref(false)
const cancelling = ref(false)
const requestPlan = ref<SubscriptionPlan | null>(null)
const requestOpen = ref(false)

const billing = computed(() => subscriptionState.value?.billing ?? null)
const current = computed(() => subscriptionState.value?.data ?? null)
const pending = computed(() => billing.value?.pendingRequest ?? null)
const canStartTrial = computed(() => !current.value && billing.value?.trialUsed === false)

async function load() {
  loading.value = true
  try {
    const [response] = await Promise.all([
      api<ApiResponse<SubscriptionPlan[]>>('/v1/app/subscriptions/available-plans'),
      checkSubscription(),
    ])
    plans.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch plans', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

function actionLabel(plan: SubscriptionPlan) {
  if (!current.value || billing.value?.isTrial) return 'Choose plan'
  if (plan.isCurrent) return 'Renew'
  return Number(plan.price) > Number(current.value.plan.price) ? 'Upgrade' : 'Switch'
}

function choose(plan: SubscriptionPlan) {
  requestPlan.value = plan
  requestOpen.value = true
}

async function startTrial() {
  startingTrial.value = true
  try {
    await api('/v1/app/subscriptions/subscribe-free', { method: 'POST' })
    toast.add({ title: 'Your free trial has started', color: 'success' })
    await checkSubscription()
    router.push('/dashboard')
  } catch (error) {
    toast.add({ title: 'Could not start the trial', description: errorMessage(error), color: 'error' })
  } finally {
    startingTrial.value = false
  }
}

async function cancelPending() {
  if (!pending.value) return
  cancelling.value = true
  try {
    await api(`/v1/app/subscriptions/requests/${pending.value.id}/cancel`, { method: 'POST' })
    toast.add({ title: 'Request cancelled', color: 'success' })
    await checkSubscription()
  } catch (error) {
    toast.add({ title: 'Could not cancel', description: errorMessage(error), color: 'error' })
  } finally {
    cancelling.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Plans</h1>
        <p class="text-gray-600 mt-1">
          Plans are billed yearly. Pay by bank transfer and upload the receipt; we activate the plan once it's verified.
        </p>
      </div>
      <UButton color="primary" variant="outline" to="/dashboard/subscriptions">
        My subscription
      </UButton>
    </div>

    <UAlert v-if="pending" color="info" variant="subtle" icon="i-heroicons-clock"
      :title="`Your ${pending.plan.name} request is being reviewed`"
      :description="`Submitted ${new Date(pending.createdAt).toLocaleDateString()} for ETB ${Number(pending.amount).toLocaleString()}. You can submit a different request after cancelling this one.`"
      :actions="[{ label: 'Cancel request', color: 'neutral', variant: 'outline', loading: cancelling, onClick: cancelPending }]" />

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else class="grid md:grid-cols-3 gap-6">
      <UCard v-for="plan in plans" :key="plan.id" variant="elevated"
        :class="plan.isCurrent ? 'border-2 border-primary-500' : ''">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">{{ plan.name }}</h2>
            <UBadge v-if="plan.isCurrent" color="primary">Current</UBadge>
            <UBadge v-else-if="!plan.purchasable" color="neutral" variant="subtle">One-time trial</UBadge>
            <UBadge v-else-if="plan.type === 'custom'" color="primary" variant="subtle">Custom</UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <div class="flex items-baseline gap-2">
            <template v-if="plan.purchasable">
              <span class="text-4xl font-bold text-gray-900">ETB {{ Number(plan.price).toLocaleString() }}</span>
              <span class="text-gray-600">/year</span>
            </template>
            <span v-else class="text-4xl font-bold text-gray-900">Free</span>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ plan.features.maxBuildings }} building{{ plan.features.maxBuildings === 1 ? '' : 's' }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ plan.features.maxUnits }} active units per building</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ plan.features.maxManagers }} manager{{ plan.features.maxManagers === 1 ? '' : 's' }}</span>
            </div>
            <div v-if="plan.features.premiumFeatures?.length" class="pt-2 border-t">
              <p class="text-xs font-medium text-gray-700 mb-2">Premium Features:</p>
              <div v-for="feature in plan.features.premiumFeatures" :key="feature"
                class="flex items-center gap-2 text-xs text-gray-600">
                <UIcon name="i-heroicons-star" class="w-4 h-4 text-yellow-500" />
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <template v-if="!plan.purchasable">
              <UButton v-if="canStartTrial" color="primary" block size="lg" :loading="startingTrial" @click="startTrial">
                Start free trial
              </UButton>
              <p v-else class="text-center text-sm text-gray-500">
                {{ plan.isCurrent ? 'You are on the free trial' : 'The free trial has been used' }}
              </p>
            </template>
            <UButton v-else color="primary" :variant="plan.isCurrent ? 'solid' : 'outline'" block size="lg"
              :disabled="!!pending" @click="choose(plan)">
              {{ actionLabel(plan) }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <PlanRequestModal v-if="requestPlan" v-model:open="requestOpen" :plan="requestPlan" @submitted="load" />
  </div>
</template>
