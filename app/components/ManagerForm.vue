<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { createManagerSchema, updateManagerSchema, type CreateManagerSchema, type UpdateManagerSchema } from '~/schemas/manager'
import type { Manager, ManagerRole } from '~/types/manager'
import type { Building } from '~/types/building'
import type { ApiResponse } from '~/types'

const props = defineProps<{
  mode: 'create' | 'edit'
  manager?: Manager
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const { api } = useApi()
const toast = useToast()

const buildings = ref<Building[]>([])
const loadingBuildings = ref(false)

interface BuildingRoleAssignment {
  buildingId: string
  roles: ManagerRole[]
}

interface BuildingOption {
  value: string
  label: string
}

interface RoleOption {
  value: string
  label: string
}

const state = reactive({
  name: props.manager?.name || '',
  email: props.manager?.email || '',
  password: '',
  phone: props.manager?.phone || '',
  status: props.manager?.status || 'active',
  buildingAssignments: [] as BuildingRoleAssignment[],
})

const loading = ref(false)

const statusOptions: BuildingOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const roleOptions: RoleOption[] = [
  { value: 'tenant_manager', label: 'Tenant Manager' },
  { value: 'payment_manager', label: 'Payment Manager' },
  { value: 'maintenance_manager', label: 'Maintenance Manager' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'reports_viewer', label: 'Reports Viewer' },
]

const buildingOptions = computed<BuildingOption[]>(() =>
  buildings.value.map(b => ({ value: b.id, label: b.name }))
)

const selectedStatus = computed({
  get: () => statusOptions.find(s => s.value === state.status),
  set: (val: BuildingOption | undefined) => {
    state.status = (val?.value as 'active' | 'inactive') || 'active'
  }
})

const selectedBuilding = ref<BuildingOption>()
const selectedRolesList = ref<RoleOption[]>([])

function addBuildingAssignment() {
  if (!selectedBuilding.value || selectedRolesList.value.length === 0) {
    toast.add({ title: 'Please select a building and at least one role', color: 'error' })
    return
  }

  const exists = state.buildingAssignments.find(a => a.buildingId === selectedBuilding.value!.value)
  if (exists) {
    toast.add({ title: 'Building already assigned', color: 'error' })
    return
  }

  state.buildingAssignments.push({
    buildingId: selectedBuilding.value.value,
    roles: selectedRolesList.value.map(r => r.value as ManagerRole),
  })

  selectedBuilding.value = undefined
  selectedRolesList.value = []
}

function removeBuildingAssignment(buildingId: string) {
  state.buildingAssignments = state.buildingAssignments.filter(a => a.buildingId !== buildingId)
}

function getBuildingName(buildingId: string) {
  return buildings.value.find(b => b.id === buildingId)?.name || buildingId
}

async function fetchBuildings() {
  loadingBuildings.value = true
  try {
    const response = await api<ApiResponse<Building[]>>('/v1/app/buildings')
    buildings.value = response.data.filter(b => b.status === 'active')
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch buildings', description: error.message, color: 'error' })
  } finally {
    loadingBuildings.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<CreateManagerSchema | UpdateManagerSchema>) {
  loading.value = true
  try {
    if (props.mode === 'create') {
      await api<ApiResponse<Manager>>('/v1/app/managers', {
        method: 'POST',
        body: event.data,
      })
      toast.add({ title: 'Manager created successfully', color: 'success' })
    } else {
      await api<ApiResponse<Manager>>(`/v1/app/managers/${props.manager!.id}`, {
        method: 'PATCH',
        body: event.data,
      })
      toast.add({ title: 'Manager updated successfully', color: 'success' })
    }
    emit('success')
  } catch (error: any) {
    toast.add({
      title: props.mode === 'create' ? 'Failed to create manager' : 'Failed to update manager',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBuildings()
})
</script>

<template>
  <UForm :schema="mode === 'create' ? createManagerSchema : updateManagerSchema" :state="state" @submit="onSubmit"
    class="space-y-4">
    <UFormField label="Name" name="name" required>
      <UInput v-model="state.name" placeholder="Enter manager name" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Email" name="email" required>
      <UInput v-model="state.email" type="email" placeholder="manager@example.com" :ui="{ root: 'w-full' }"
        :disabled="mode === 'edit'" />
    </UFormField>

    <UFormField v-if="mode === 'create'" label="Password" name="password" required>
      <UInput v-model="state.password" type="password" placeholder="Min 8 characters" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField label="Phone" name="phone">
      <UInput v-model="state.phone" type="tel" placeholder="+1234567890" :ui="{ root: 'w-full' }" />
    </UFormField>

    <UFormField v-if="mode === 'edit'" label="Status" name="status">
      <USelectMenu v-model="selectedStatus" :items="statusOptions" class="w-full" />
    </UFormField>

    <div v-if="mode === 'create'" class="space-y-3">
      <UFormField label="Building Assignments" name="buildingAssignments" required>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <USelectMenu v-model="selectedBuilding" :items="buildingOptions" placeholder="Select building"
              :loading="loadingBuildings" class="w-full" />

            <USelectMenu v-model="selectedRolesList" :items="roleOptions" multiple placeholder="Select roles"
              class="w-full" />
          </div>
          <UButton type="button" size="sm" color="neutral" variant="outline" @click="addBuildingAssignment" block>
            Add Assignment
          </UButton>
        </div>
      </UFormField>

      <div v-if="state.buildingAssignments.length > 0" class="space-y-2">
        <p class="text-sm font-medium text-gray-700">Assigned Buildings:</p>
        <div v-for="assignment in state.buildingAssignments" :key="assignment.buildingId"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p class="font-medium text-sm">{{ getBuildingName(assignment.buildingId) }}</p>
            <p class="text-xs text-gray-600">{{assignment.roles.map(r => roleOptions.find(ro => ro.value ===
              r)?.label).join(', ') }}</p>
          </div>
          <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-trash"
            @click="removeBuildingAssignment(assignment.buildingId)" />
        </div>
      </div>
    </div>

    <div class="flex gap-2 justify-end pt-4">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading">
        {{ mode === 'create' ? 'Create Manager' : 'Update Manager' }}
      </UButton>
    </div>
  </UForm>
</template>