<script setup lang="ts">
import type { ApiResponse } from '~/types/api'

interface Plan {
  id: string
  name: string
  buildingPrice: number
  managerPrice: number
  features: {
    maxBuildings: number
    maxManagers: number
    maxUnits: number
    support: string
  }
  status: string
}

const { api } = useApi()
const toast = useToast()
const router = useRouter()

const plans = ref<Plan[]>([])
const loading = ref(false)
const subscribing = ref(false)

async function fetchPlans() {
  loading.value = true
  try {
    const response = await api<ApiResponse<Plan[]>>('/v1/platform/plans/public')
    plans.value = response.data
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch plans', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

async function subscribeFreePlan() {
  subscribing.value = true
  try {
    await api('/v1/app/subscriptions/subscribe-free', { method: 'POST' })
    toast.add({ title: 'Successfully subscribed to Free plan!', color: 'success' })
    const { resetSubscription } = useSubscription()
    resetSubscription()
    router.push('/dashboard')
  } catch (error: any) {
    toast.add({ title: 'Subscription failed', description: error.message, color: 'error' })
  } finally {
    subscribing.value = false
  }
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
      <p class="text-gray-600 mt-1">Select a plan to get started with our platform</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <div v-else class="grid md:grid-cols-2 gap-6">
      <UCard v-for="plan in plans" :key="plan.id" :class="plan.name === 'Free' ? 'border-2 border-primary-500' : ''">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">{{ plan.name }}</h2>
            <UBadge v-if="plan.name === 'Free'" color="primary">Recommended</UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-bold text-gray-900">${{ plan.buildingPrice }}</span>
              <span class="text-gray-600">/building/year</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
              + ${{ plan.managerPrice }}/manager/year
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>Up to {{ plan.features.maxBuildings }} building{{ plan.features.maxBuildings > 1 ? 's' : ''
                }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>Up to {{ plan.features.maxManagers }} manager{{ plan.features.maxManagers > 1 ? 's' : '' }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>Up to {{ plan.features.maxUnits }} units</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span>{{ plan.features.support }}</span>
            </div>
          </div>

          <div class="pt-4">
            <UButton v-if="plan.name === 'Free'" color="primary" block size="lg" :loading="subscribing"
              @click="subscribeFreePlan">
              Subscribe to Free
            </UButton>
            <UButton v-else color="neutral" variant="outline" block size="lg" disabled>
              Contact Us
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>