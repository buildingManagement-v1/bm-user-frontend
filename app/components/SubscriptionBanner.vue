<script setup lang="ts">
/** Owner-wide notice about the plan: read-only, expiring soon, or awaiting approval. */
const { userType } = useAuth()
const { subscriptionState, isReadOnly, daysLeft } = useSubscription()

const pending = computed(() => subscriptionState.value?.billing?.pendingRequest ?? null)
const isTrial = computed(() => subscriptionState.value?.billing?.isTrial ?? false)
const supportLine = computed(() => {
  const s = subscriptionState.value?.support
  const parts = [s?.email, s?.phone].filter(Boolean)
  return parts.length ? ` Questions? Contact support: ${parts.join(' · ')}.` : ''
})
</script>

<template>
  <div v-if="userType === 'user' && subscriptionState" class="mb-6">
    <UAlert v-if="isReadOnly && pending" color="info" variant="subtle" icon="i-heroicons-clock"
      title="Your plan request is being reviewed"
      :description="`We'll activate ${pending.plan.name} as soon as your payment is verified. Until then your account is read-only.`" />
    <UAlert v-else-if="isReadOnly" color="error" variant="subtle" icon="i-heroicons-lock-closed"
      title="Your account is read-only"
      :description="`Your subscription has ended. You can still view everything, but changes are disabled until you activate a plan.${supportLine}`"
      :actions="[{ label: 'Choose a plan', to: '/dashboard/plans', color: 'error' }]" />
    <UAlert v-else-if="daysLeft <= 14 && !pending" color="warning" variant="subtle" icon="i-heroicons-exclamation-triangle"
      :title="isTrial ? `Your free trial ends in ${daysLeft} day(s)` : `Your plan ends in ${daysLeft} day(s)`"
      description="Renew or choose a plan now so your account doesn't become read-only."
      :actions="[{ label: isTrial ? 'Choose a plan' : 'Renew', to: '/dashboard/plans', color: 'warning' }]" />
  </div>
</template>
