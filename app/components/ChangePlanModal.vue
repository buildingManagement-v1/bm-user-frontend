<script setup lang="ts">
import type { Subscription, SubscriptionPlan } from '~/types/subscription'
import type { ApiResponse } from '~/types/api'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const loading = ref(false)
const calculating = ref(false)
const plans = ref<SubscriptionPlan[]>([])
const prorating = ref<any>(null)

const form = reactive({
  newPlanId: '',
  newBuildingCount: props.subscription.buildingCount,
  newManagerCount: props.subscription.managerCount,
})

const planOptions = computed(() =>
  plans.value
    .filter(p => p.id !== props.subscription.planId)
    .map(p => ({
      label: p.name,
      value: p.id
    }))
)

const selectedPlan = computed(() =>
  plans.value.find(p => p.id === form.newPlanId)
)

const canCalculate = computed(() =>
  form.newPlanId && form.newBuildingCount > 0
)

const isDowngrade = computed(() =>
  prorating.value && prorating.value.proratedAmount < 0
)

async function fetchPlans() {
  try {
    const response = await api<ApiResponse<SubscriptionPlan[]>>('/v1/app/subscriptions/available-plans')
    plans.value = response.data
  } catch (error) {
    toast.add({ title: 'Failed to fetch plans', color: 'error' })
  }
}

async function calculateProrating() {
  if (!canCalculate.value) return

  calculating.value = true
  prorating.value = null

  try {
    const response = await api<ApiResponse<any>>('/v1/app/subscriptions/calculate-change', {
      method: 'POST',
      body: form,
    })
    prorating.value = response.data
  } catch (error: any) {
    toast.add({
      title: 'Failed to calculate',
      description: error.message,
      color: 'error'
    })
  } finally {
    calculating.value = false
  }
}

async function confirmChange() {
  if (!prorating.value) {
    await calculateProrating()
    return
  }

  loading.value = true
  try {
    await api('/v1/app/subscriptions/change-plan', {
      method: 'POST',
      body: form,
    })
    toast.add({
      title: isDowngrade.value ? 'Plan downgraded successfully' : 'Plan upgraded successfully',
      color: 'success'
    })
    emit('success')
  } catch (error: any) {
    toast.add({
      title: 'Failed to change plan',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch([() => form.newPlanId, () => form.newBuildingCount, () => form.newManagerCount], () => {
  prorating.value = null
})

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold mb-2">Current Plan</h3>
      <div class="p-4 bg-gray-50 rounded-lg space-y-1 text-sm">
        <div><span class="font-medium">Plan:</span> {{ subscription.plan?.name }}</div>
        <div><span class="font-medium">Buildings:</span> {{ subscription.buildingCount }}</div>
        <div><span class="font-medium">Managers:</span> {{ subscription.managerCount }}</div>
        <div><span class="font-medium">Current Cost:</span> ETB {{ subscription.totalAmount }}/year</div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">New Plan *</label>
        <USelectMenu v-model="form.newPlanId" :items="planOptions" placeholder="Select new plan" size="lg"
          class="w-full" value-key="value" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Building Count *</label>
          <UInput v-model.number="form.newBuildingCount" type="number" min="1" size="lg" class="w-full" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Manager Count *</label>
          <UInput v-model.number="form.newManagerCount" type="number" min="0" size="lg" class="w-full" />
        </div>
      </div>

      <UButton v-if="!prorating" color="primary" variant="outline" block :loading="calculating"
        :disabled="!canCalculate" @click="calculateProrating">
        Calculate Amount
      </UButton>
    </div>

    <div v-if="prorating" :class="[
      'p-4 border rounded-lg space-y-3',
      isDowngrade ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
    ]">
      <h4 class="font-semibold" :class="isDowngrade ? 'text-green-900' : 'text-blue-900'">
        {{ isDowngrade ? 'Downgrade' : 'Upgrade' }} Breakdown
      </h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Days Remaining:</span>
          <span class="font-medium">{{ prorating.daysRemaining }} / {{ prorating.totalDays }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Current Plan (Unused):</span>
          <span class="font-medium text-green-600">-ETB {{ prorating.oldUnused }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">New Plan (Remaining Time):</span>
          <span class="font-medium">+ETB {{ prorating.newCost }}</span>
        </div>
        <div class="border-t pt-2 flex justify-between">
          <span class="font-semibold text-gray-900">
            {{ isDowngrade ? 'Refund Amount:' : 'Amount to Charge:' }}
          </span>
          <span class="text-xl font-bold" :class="isDowngrade ? 'text-green-600' : 'text-blue-600'">
            ETB {{ Math.abs(prorating.proratedAmount) }}
          </span>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          New yearly total: ETB {{ prorating.newTotal }}/year
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t">
      <UButton color="neutral" variant="ghost" @click="emit('cancel')" :disabled="loading">
        Cancel
      </UButton>
      <UButton :color="isDowngrade ? 'success' : 'primary'" :loading="loading" :disabled="!canCalculate"
        @click="confirmChange">
        {{ prorating ? (isDowngrade ? 'Confirm Downgrade' : 'Confirm Upgrade') : 'Calculate & Change' }}
      </UButton>
    </div>
  </div>
</template>