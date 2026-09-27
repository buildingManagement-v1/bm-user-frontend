<script setup lang="ts">
import type { ApiResponse, PlanQuote, SubscriptionPlan, SubscriptionRequest } from '~/types'
import { errorMessage } from '~/types/api'

const props = defineProps<{ plan: SubscriptionPlan }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submitted: [] }>()

const { api } = useApi()
const toast = useToast()

const quote = ref<PlanQuote | null>(null)
const loadingQuote = ref(false)
const submitting = ref(false)
const receipt = ref<File | null>(null)
const paymentReference = ref('')
const notes = ref('')

const kindText: Record<PlanQuote['kind'], string> = {
  new: 'New plan',
  renewal: 'Renewal',
  upgrade: 'Upgrade',
  downgrade: 'Change to a smaller plan',
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

async function loadQuote() {
  loadingQuote.value = true
  quote.value = null
  try {
    const res = await api<ApiResponse<PlanQuote>>('/v1/app/subscriptions/quote', {
      query: { planId: props.plan.id },
    })
    quote.value = res.data
  } catch (error) {
    toast.add({ title: 'Could not price this plan', description: errorMessage(error), color: 'error' })
    open.value = false
  } finally {
    loadingQuote.value = false
  }
}

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (file && !(file.type.startsWith('image/') || file.type === 'application/pdf')) {
    toast.add({ title: 'Upload an image or a PDF of the bank receipt', color: 'error' })
    receipt.value = null
    return
  }
  receipt.value = file
}

async function submit() {
  if (!receipt.value) {
    toast.add({ title: 'Upload your bank receipt', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    const form = new FormData()
    form.append('planId', props.plan.id)
    if (paymentReference.value.trim()) form.append('paymentReference', paymentReference.value.trim())
    if (notes.value.trim()) form.append('notes', notes.value.trim())
    form.append('receipt', receipt.value)
    await api<ApiResponse<SubscriptionRequest>>('/v1/app/subscriptions/requests', {
      method: 'POST',
      body: form,
    })
    toast.add({
      title: 'Request submitted',
      description: "We'll activate your plan once the payment is verified.",
      color: 'success',
    })
    open.value = false
    emit('submitted')
  } catch (error) {
    toast.add({ title: 'Request failed', description: errorMessage(error), color: 'error' })
  } finally {
    submitting.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    receipt.value = null
    paymentReference.value = ''
    notes.value = ''
    loadQuote()
  }
}, { immediate: true })
</script>

<template>
  <UModal v-model:open="open" :title="`${plan.name} plan`">
    <template #body>
      <div v-if="loadingQuote" class="flex justify-center py-10">
        <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
      </div>

      <div v-else-if="quote" class="space-y-5">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Change</span>
            <span class="font-medium">{{ kindText[quote.kind] }}</span>
          </div>
          <div v-if="quote.currentPlan" class="flex justify-between">
            <span class="text-gray-500">Current plan</span>
            <span>{{ quote.currentPlan.name }} (ends {{ formatDate(quote.currentPlan.billingCycleEnd) }})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Covers</span>
            <span>{{ formatDate(quote.cycleStart) }} – {{ formatDate(quote.cycleEnd) }}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-2 text-base">
            <span class="font-semibold">Amount to pay</span>
            <span class="font-bold text-primary-600">ETB {{ quote.amount.toLocaleString() }}</span>
          </div>
          <p v-if="quote.note" class="text-xs text-gray-500">{{ quote.note }}</p>
        </div>

        <UAlert v-if="quote.violations.length" color="error" variant="subtle" icon="i-heroicons-exclamation-circle"
          title="Your current usage doesn't fit this plan">
          <template #description>
            <ul class="list-disc pl-4 space-y-0.5">
              <li v-for="v in quote.violations" :key="v">{{ v }}</li>
            </ul>
          </template>
        </UAlert>

        <template v-else>
          <UAlert color="info" variant="subtle" icon="i-heroicons-building-library" title="How to pay"
            :description="quote.paymentInstructions" />

          <UFormField label="Bank receipt (image or PDF)" required>
            <UInput type="file" accept="image/*,application/pdf" :ui="{ root: 'w-full' }" @change="onFile" />
          </UFormField>
          <UFormField label="Transaction reference" hint="Optional">
            <UInput v-model="paymentReference" placeholder="e.g. FT26270ABC123" :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField label="Notes" hint="Optional">
            <UTextarea v-model="notes" :rows="2" :ui="{ root: 'w-full' }" />
          </UFormField>
        </template>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="ghost" @click="() => { open = false }">Cancel</UButton>
        <UButton color="primary" :loading="submitting" :disabled="!quote || quote.violations.length > 0 || !receipt"
          @click="submit">
          Submit for verification
        </UButton>
      </div>
    </template>
  </UModal>
</template>
