// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  modules: ["@nuxt/ui", "@nuxt/image"],
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  runtimeConfig: {
    // Server-only: used for SSR in Docker (e.g. NUXT_API_URL=http://bm-backend:8000)
    apiUrl: process.env.NUXT_API_URL || "",
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "http://localhost:8000",
    },
  },
  ui: {
    colorMode: false,
    fonts: false,
  },
});