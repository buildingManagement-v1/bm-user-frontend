<script setup lang="ts">
import type { BuildingOption } from '~/types/building'
import type { ApiResponse } from '~/types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
  }>(),
  { placeholder: 'Select building', disabled: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { api } = useApi()
const toast = useToast()

const options = ref<{ value: string; label: string }[]>([])
const loading = ref(false)

const selected = computed({
  get: () => options.value.find((o) => o.value === props.modelValue),
  set: (val: { value: string; label: string } | undefined) => {
    emit('update:modelValue', val?.value ?? '')
  },
})

async function fetchOptions() {
  loading.value = true
  try {
    const response = await api<ApiResponse<BuildingOption[]>>(
      '/v1/app/buildings/options'
    )
    options.value = (response.data ?? []).map((b) => ({
      value: b.id,
      label: b.name,
    }))
    if (
      options.value.length > 0 &&
      !props.modelValue &&
      selected.value === undefined
    ) {
      emit('update:modelValue', options.value[0]!.value)
    }
  } catch (error: any) {
    toast.add({
      title: 'Failed to load buildings',
      description: error.message ?? '',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOptions()
})
</script>

<template>
  <USelectMenu
    :model-value="selected"
    :items="options"
    :placeholder="placeholder"
    :loading="loading"
    :disabled="disabled"
    class="w-64"
    @update:model-value="selected = $event"
  />
</template>
