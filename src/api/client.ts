import { CapacitorHttp } from '@capacitor/core';
import { useAuthStore } from '@/stores/auth';

const BASE_URL = import.meta.env.VITE_API_BASE;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const auth = useAuthStore();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }

  const response = await CapacitorHttp.request({
    method,
    url: `${BASE_URL}${path}`,
    headers,
    data: body,
  });

  if (response.status >= 400) {
    throw new ApiError(
      response.status,
      response.data,
      `API ${method} ${path} failed with ${response.status}`,
    );
  }

  return response.data as T;
}
