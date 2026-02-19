/**
 * Returns the API base URL. In Docker, NUXT_API_URL is used for server-side (SSR) calls
 * so the container can reach the backend by service name; NUXT_PUBLIC_API_URL is used
 * in the browser (e.g. http://localhost:8000).
 */
export function useApiBaseUrl(): string {
  const config = useRuntimeConfig();
  if (import.meta.server && config.apiUrl) return config.apiUrl as string;
  return config.public.apiUrl;
}
