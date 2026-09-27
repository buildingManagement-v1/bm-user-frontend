export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageInfo {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  has_previous: boolean;
  has_next: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: { page_info: PageInfo };
}

export interface ApiErrorBody {
  message: string | string[];
  statusCode: number;
  error?: string;
  code?: string;
  [key: string]: unknown;
}

/** Thrown by useApi: keeps the HTTP status and body for callers that branch on them. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly data?: ApiErrorBody,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
