import { ApiError, type ApiErrorBody } from "~/types/api";

interface FetchFailure {
  statusCode?: number;
  data?: ApiErrorBody;
  message?: string;
}

/** Turns a $fetch failure into an ApiError with a readable message. */
export function toApiError(error: unknown, fallback: string): ApiError {
  const failure = (error ?? {}) as FetchFailure;
  const raw = failure.data?.message;
  const message = Array.isArray(raw) ? raw.join(". ") : raw || failure.message || fallback;
  return new ApiError(message, failure.statusCode ?? 0, failure.data);
}

type ApiOptions = Parameters<typeof $fetch>[1] & { _isRetry?: boolean };

export const useApi = () => {
  const config = useRuntimeConfig();
  const { token, refresh, logout } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers type the response
  const api = async <T = any>(url: string, options: ApiOptions = {}): Promise<T> => {
    try {
      return await $fetch<T>(`${config.public.apiUrl}${url}`, {
        ...options,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          Authorization: token.value ? `Bearer ${token.value}` : "",
        },
      } as Parameters<typeof $fetch>[1]) as T;
    } catch (error) {
      const failure = error as FetchFailure;
      // If 401 and we have a refresh token, try refreshing once
      if (failure.statusCode === 401 && !options._isRetry) {
        try {
          await refresh();
        } catch {
          logout();
          throw new ApiError("Session expired. Please login again.", 401);
        }
        return api<T>(url, { ...options, _isRetry: true });
      }
      throw toApiError(error, "Request failed");
    }
  };

  // API with building context (adds x-building-id header)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers type the response
  const buildingApi = async <T = any>(
    buildingId: string,
    url: string,
    options: ApiOptions = {}
  ) => {
    return api<T>(url, {
      ...options,
      headers: {
        ...(options.headers as Record<string, string> | undefined),
        "x-building-id": buildingId,
      },
    });
  };

  return { api, buildingApi };
};
