<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-1">Welcome back, {{ user?.name }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Buildings</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Units</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-squares-2x2" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Managers</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-users" class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>