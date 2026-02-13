<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Unit } from '~/types/unit'
import type { ApiResponse, PaginatedResponse, PageInfo } from '~/types'

const { api, buildingApi } = useApi()
const toast = useToast()

const units = ref<Unit[]>([])
const selectedBuildingId = ref<string>('')
const loading = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedUnit = ref<Unit | null>(null)

const columns: TableColumn<Unit>[] = [
  { accessorKey: 'unitNumber', header: 'Unit Number' },
  { accessorKey: 'floor', header: 'Floor' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'size', header: 'Size (sqm)' },
  { accessorKey: 'rentPrice', header: 'Rent Price' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Actions' },
]

async function fetchUnits() {
  if (!selectedBuildingId.value) return

  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const response = await buildingApi<PaginatedResponse<Unit[]>>(
      selectedBuildingId.value,
      `/v1/app/units?limit=${limit.value}&offset=${offset}`
    )
    units.value = response.data
    pageInfo.value = response.meta.page_info
  } catch (error: any) {
    toast.add({ title: 'Failed to fetch units', description: error.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || (pageInfo.value && page > pageInfo.value.total_pages)) return
  currentPage.value = page
  fetchUnits()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchUnits()
}

function openEditModal(unit: Unit) {
  selectedUnit.value = unit
  isEditModalOpen.value = true
}

async function deleteUnit(id: string) {
  if (!confirm('Are you sure you want to delete this unit?')) return
  if (!selectedBuildingId.value) return

  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/units/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Unit deleted successfully', color: 'success' })
    fetchUnits()
  } catch (error: any) {
    toast.add({ title: 'Failed to delete unit', description: error.message, color: 'error' })
  }
}

function handleSuccess() {
  isCreateModalOpen.value = false
  isEditModalOpen.value = false
  selectedUnit.value = null
  fetchUnits()
}

watch(selectedBuildingId, () => {
  if (selectedBuildingId.value) {
    currentPage.value = 1
    fetchUnits()
  }
})

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Units</h1>
        <p class="text-gray-600 mt-1">Manage building units and rental properties</p>
      </div>

      <div class="flex items-center gap-3">
        <BuildingSelector v-model="selectedBuildingId" />
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateModalOpen = true"
          :disabled="!selectedBuildingId">
          Add Unit
        </UButton>
      </div>
    </div>

    <UCard>
      <PaginationBar
        :page-info="pageInfo"
        item-label="units"
        :current-count="units.length"
        :limit="limit"
        show-limit-selector
        @go-to-page="goToPage"
        @update:limit="onLimitChange"
      />
      <UTable :data="units" :columns="columns" :loading="loading">
        <template #floor-cell="{ row }">
          <span v-if="row.original.floor !== null && row.original.floor !== undefined">{{ row.original.floor }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #type-cell="{ row }">
          <span v-if="row.original.type" class="capitalize">{{ row.original.type }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #size-cell="{ row }">
          <span v-if="row.original.size">{{ row.original.size }} m²</span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #rentPrice-cell="{ row }">
          <span>${{ row.original.rentPrice.toLocaleString() }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'vacant' ? 'warning' : row.original.status === 'occupied' ? 'success' : 'neutral'"
            variant="subtle" class="capitalize">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex gap-2">
            <UButton size="xs" color="neutral" variant="ghost" @click="openEditModal(row.original)">
              Edit
            </UButton>
            <UButton size="xs" color="error" variant="ghost" @click="deleteUnit(row.original.id)">
              Delete
            </UButton>
          </div>
        </template>

        <template #empty>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-squares-2x2" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-900 font-medium mb-2">No units yet</p>
            <p class="text-gray-500 mb-4">
              {{ selectedBuildingId ? 'Get started by adding your first unit' : 'Select a building to manage units' }}
            </p>
            <UButton v-if="selectedBuildingId" color="primary" @click="isCreateModalOpen = true">
              Add Unit
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="isCreateModalOpen" title="Add New Unit">
      <template #body>
        <UnitForm v-if="selectedBuildingId" mode="create" :building-id="selectedBuildingId" @success="handleSuccess"
          @cancel="isCreateModalOpen = false" />
      </template>
    </UModal>

    <UModal v-model:open="isEditModalOpen" title="Edit Unit">
      <template #body>
        <UnitForm v-if="selectedUnit && selectedBuildingId" mode="edit" :building-id="selectedBuildingId"
          :unit="selectedUnit" @success="handleSuccess" @cancel="isEditModalOpen = false" />
      </template>
    </UModal>
  </div>
</template>