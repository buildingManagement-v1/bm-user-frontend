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

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
