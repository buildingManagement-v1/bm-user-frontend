<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import type { Announcement, AnnouncementPriority, ApiResponse, PageInfo, PaginatedResponse } from '~/types'
import { announcementSchema, type AnnouncementSchema } from '~/schemas/announcement'
import { errorMessage } from '~/types/api'

const { buildingApi } = useApi()
const toast = useToast()
const { selectedBuildingId } = useSelectedBuilding()

const announcements = ref<Announcement[]>([])
const loading = ref(false)
const saving = ref(false)
const pageInfo = ref<PageInfo | null>(null)
const limit = ref(20)
const currentPage = ref(1)

const modalOpen = ref(false)
const editing = ref<Announcement | null>(null)
const publishNow = ref(true)
const state = reactive<AnnouncementSchema>({ title: '', content: '', priority: 'normal', expiresAt: '' })

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent (highlighted to tenants)' },
]
const priorityColor: Record<AnnouncementPriority, 'neutral' | 'warning' | 'error'> = {
  normal: 'neutral',
  important: 'warning',
  urgent: 'error',
}

const columns: TableColumn<Announcement>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'priority', header: 'Priority' },
  { accessorKey: 'publishedAt', header: 'Status' },
  { accessorKey: 'expiresAt', header: 'Expires' },
  { accessorKey: 'createdByName', header: 'By' },
  { id: 'actions', header: '' },
]

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const isExpired = (a: Announcement) => !!a.expiresAt && a.expiresAt.slice(0, 10) < new Date().toISOString().slice(0, 10)

async function fetchAnnouncements() {
  if (!selectedBuildingId.value) return
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * limit.value
    const res = await buildingApi<PaginatedResponse<Announcement[]>>(
      selectedBuildingId.value,
      `/v1/app/announcements?limit=${limit.value}&offset=${offset}`
    )
    announcements.value = res.data
    pageInfo.value = res.meta.page_info
  } catch (error) {
    toast.add({ title: 'Failed to load announcements', description: errorMessage(error), color: 'error' })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  publishNow.value = true
  Object.assign(state, { title: '', content: '', priority: 'normal', expiresAt: '' })
  modalOpen.value = true
}

function openEdit(a: Announcement) {
  editing.value = a
  Object.assign(state, {
    title: a.title,
    content: a.content,
    priority: a.priority,
    expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '',
  })
  modalOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<AnnouncementSchema>) {
  if (!selectedBuildingId.value) return
  saving.value = true
  try {
    if (editing.value) {
      await buildingApi<ApiResponse<Announcement>>(selectedBuildingId.value, `/v1/app/announcements/${editing.value.id}`, {
        method: 'PATCH',
        body: { ...event.data, expiresAt: event.data.expiresAt || null },
      })
      toast.add({ title: 'Announcement updated', color: 'success' })
    } else {
      await buildingApi<ApiResponse<Announcement>>(selectedBuildingId.value, '/v1/app/announcements', {
        method: 'POST',
        body: { ...event.data, expiresAt: event.data.expiresAt || undefined, publish: publishNow.value },
      })
      toast.add({
        title: publishNow.value ? 'Announcement published' : 'Draft saved',
        description: publishNow.value ? 'Current tenants were notified.' : undefined,
        color: 'success',
      })
    }
    modalOpen.value = false
    fetchAnnouncements()
  } catch (error) {
    toast.add({ title: 'Could not save announcement', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function publish(a: Announcement) {
  if (!selectedBuildingId.value) return
  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/announcements/${a.id}/publish`, { method: 'POST' })
    toast.add({ title: 'Published', description: 'Current tenants were notified.', color: 'success' })
    fetchAnnouncements()
  } catch (error) {
    toast.add({ title: 'Could not publish', description: errorMessage(error), color: 'error' })
  }
}

async function remove(a: Announcement) {
  if (!selectedBuildingId.value || !confirm(`Delete "${a.title}"? Tenants will no longer see it.`)) return
  try {
    await buildingApi(selectedBuildingId.value, `/v1/app/announcements/${a.id}`, { method: 'DELETE' })
    toast.add({ title: 'Announcement deleted', color: 'success' })
    fetchAnnouncements()
  } catch (error) {
    toast.add({ title: 'Could not delete', description: errorMessage(error), color: 'error' })
  }
}

function goToPage(page: number) {
  currentPage.value = page
  fetchAnnouncements()
}

function onLimitChange(newLimit: number) {
  limit.value = newLimit
  currentPage.value = 1
  fetchAnnouncements()
}

watch(selectedBuildingId, () => {
  currentPage.value = 1
  fetchAnnouncements()
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Announcements</h1>
        <p class="text-gray-600 mt-1">Post notices to the tenants of this building</p>
      </div>
      <UButton color="primary" icon="i-heroicons-megaphone" :disabled="!selectedBuildingId" @click="openCreate">
        New announcement
      </UButton>
    </div>

    <UCard variant="elevated">
      <PaginationBar :page-info="pageInfo" item-label="announcements" :current-count="announcements.length"
        :limit="limit" show-limit-selector @go-to-page="goToPage" @update:limit="onLimitChange" />
      <UTable :data="announcements" :columns="columns" :loading="loading">
        <template #title-cell="{ row }">
          <div class="max-w-md">
            <p class="font-medium text-gray-900 truncate">{{ row.original.title }}</p>
            <p class="text-xs text-gray-500 truncate">{{ row.original.content }}</p>
          </div>
        </template>
        <template #priority-cell="{ row }">
          <UBadge :color="priorityColor[row.original.priority]" variant="subtle" class="capitalize">
            {{ row.original.priority }}
          </UBadge>
        </template>
        <template #publishedAt-cell="{ row }">
          <UBadge v-if="!row.original.publishedAt" color="neutral" variant="outline">Draft</UBadge>
          <UBadge v-else-if="isExpired(row.original)" color="neutral" variant="subtle">Expired</UBadge>
          <span v-else class="text-sm">Published {{ formatDate(row.original.publishedAt) }}</span>
        </template>
        <template #expiresAt-cell="{ row }">
          {{ row.original.expiresAt ? formatDate(row.original.expiresAt) : '—' }}
        </template>
        <template #createdByName-cell="{ row }">{{ row.original.createdByName ?? '—' }}</template>
        <template #actions-cell="{ row }">
          <div class="flex gap-1 justify-end">
            <UButton v-if="!row.original.publishedAt" size="xs" color="primary" variant="soft" @click="publish(row.original)">
              Publish
            </UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="openEdit(row.original)">Edit</UButton>
            <UButton size="xs" color="error" variant="ghost" @click="remove(row.original)">Delete</UButton>
          </div>
        </template>
        <template #empty>
          <p class="text-center py-8 text-gray-500">No announcements yet</p>
        </template>
      </UTable>
    </UCard>

    <UModal v-model:open="modalOpen" :title="editing ? 'Edit announcement' : 'New announcement'">
      <template #body>
        <UForm :schema="announcementSchema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Title" name="title" required>
            <UInput v-model="state.title" placeholder="e.g. Water shutdown on Saturday" :ui="{ root: 'w-full' }" />
          </UFormField>
          <UFormField label="Message" name="content" required>
            <UTextarea v-model="state.content" :rows="5" :ui="{ root: 'w-full' }" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Priority" name="priority">
              <USelectMenu v-model="state.priority" :items="priorityOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Hide after" name="expiresAt" hint="Optional">
              <UInput v-model="state.expiresAt" type="date" :ui="{ root: 'w-full' }" />
            </UFormField>
          </div>
          <UCheckbox v-if="!editing" v-model="publishNow" label="Publish now and notify current tenants"
            description="Untick to save as a draft." />
          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="() => { modalOpen = false }">Cancel</UButton>
            <UButton type="submit" color="primary" :loading="saving">
              {{ editing ? 'Save changes' : publishNow ? 'Publish' : 'Save draft' }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
