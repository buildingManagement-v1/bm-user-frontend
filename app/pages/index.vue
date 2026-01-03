<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600 mt-1">Welcome back, {{ user?.name }}</p>
        </div>
        <UButton color="error" @click="logout">
          Logout
        </UButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Buildings</h3>
          </template>
          <p class="text-3xl font-bold text-primary-600">0</p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Units</h3>
          </template>
          <p class="text-3xl font-bold text-primary-600">0</p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Tenants</h3>
          </template>
          <p class="text-3xl font-bold text-primary-600">0</p>
        </UCard>
      </div>
    </div>
  </div>
</template>