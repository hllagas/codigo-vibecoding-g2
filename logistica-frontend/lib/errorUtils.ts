import type { AxiosError } from 'axios';

export function getApiError(err: unknown): string {
  const axiosErr = err as AxiosError<Record<string, unknown>>;
  if (axiosErr?.response?.data) {
    const data = axiosErr.response.data;
    if (typeof data === 'string') return data;
    if (data.detail && typeof data.detail === 'string') return data.detail;
    const first = Object.values(data)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  }
  if (axiosErr?.message) return axiosErr.message;
  return 'Error inesperado';
}
