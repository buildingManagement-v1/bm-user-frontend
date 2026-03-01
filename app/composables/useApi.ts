export const useApi = () => {
  const config = useRuntimeConfig();
  const { token, refresh, logout } = useAuth();

  const api = async <T = any>(url: string, options: any = {}) => {
    try {
      return await $fetch<T>(`${config.public.apiUrl}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: token.value ? `Bearer ${token.value}` : "",
        },
      });
    } catch (error: any) {
      // If 401 and we have a refresh token, try refreshing
      if (error.statusCode === 401 && !options._isRetry) {
        try {
          await refresh();
          // Retry the request with new token
          return await api<T>(url, { ...options, _isRetry: true });
        } catch (refreshError) {
          // Refresh failed, throw original error
          logout();
          throw new Error("Session expired. Please login again.");
        }
      }

      const message = error.data?.message || error.message || "Request failed";
      throw new Error(message);
    }
  };

  // API with building context (adds x-building-id header)
  const buildingApi = async <T = any>(
    buildingId: string,
    url: string,
    options: any = {}
  ) => {
    return api<T>(url, {
      ...options,
      headers: {
        ...options.headers,
        "x-building-id": buildingId,
      },
    });
  };

  return { api, buildingApi };
};
