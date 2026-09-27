<script setup lang="ts">
import type { ApiResponse, AdvertAudience, LoginAdvert } from '~/types'

const props = defineProps<{ audience: AdvertAudience }>()
const config = useRuntimeConfig()

const adverts = ref<LoginAdvert[]>([])
const index = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  try {
    const res = await $fetch<ApiResponse<LoginAdvert[]>>(
      `${config.public.apiUrl}/v1/platform/login-adverts/public`,
      { query: { audience: props.audience } },
    )
    adverts.value = res.data
    index.value = 0
  } catch {
    // Adverts are optional decoration on the login screen
    adverts.value = []
  }
}

const current = computed(() => adverts.value[index.value])

watch(() => props.audience, load)
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (adverts.value.length > 1) index.value = (index.value + 1) % adverts.value.length
  }, 7000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div v-if="current" class="rounded-2xl bg-white/10 backdrop-blur-sm overflow-hidden text-white max-w-xl">
    <component :is="current.linkUrl ? 'a' : 'div'" :href="current.linkUrl ?? undefined" target="_blank"
      rel="noopener noreferrer" class="flex items-stretch gap-4">
      <img :src="`${config.public.apiUrl}${current.imageUrl}`" :alt="current.title" class="w-32 h-24 object-cover shrink-0">
      <div class="py-3 pr-4 min-w-0">
        <p class="font-semibold truncate">{{ current.title }}</p>
        <p v-if="current.description" class="text-sm text-primary-100 line-clamp-2">{{ current.description }}</p>
      </div>
    </component>
    <div v-if="adverts.length > 1" class="flex justify-center gap-1.5 pb-2">
      <button v-for="(a, i) in adverts" :key="a.id" type="button" :aria-label="`Show advert ${i + 1}`"
        class="w-1.5 h-1.5 rounded-full" :class="i === index ? 'bg-white' : 'bg-white/40'" @click="() => { index = i }" />
    </div>
  </div>
</template>
