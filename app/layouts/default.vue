<script setup lang="ts">
const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-open="sidebarOpen" @toggle="toggleSidebar" />

    <div :class="[
      'transition-all duration-300',
      sidebarOpen ? 'ml-64' : 'ml-20'
    ]">
      <Header />

      <main class="p-8">
        <slot />
      </main>
    </div>
  </div>
</template>