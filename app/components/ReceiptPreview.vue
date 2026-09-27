<script setup lang="ts">
/** Shows an uploaded receipt blob: images inline, PDFs in a viewer with a download link. */
defineProps<{ url: string; isPdf: boolean }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <iframe v-if="isPdf" :src="url" title="Receipt" class="w-full h-[70vh] rounded border border-gray-200" />
    <img v-else :src="url" alt="Receipt" class="max-w-full max-h-[70vh] object-contain">
    <UButton :to="url" target="_blank" size="xs" variant="ghost" icon="i-heroicons-arrow-top-right-on-square">
      Open in new tab
    </UButton>
  </div>
</template>
