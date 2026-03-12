// src/app/models/api-response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
}