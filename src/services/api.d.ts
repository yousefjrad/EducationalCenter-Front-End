/* eslint-disable @typescript-eslint/no-explicit-any */
export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, message: string, body?: any)
}
export const getAccessToken: () => string | null
export function setSession(data: any): void
export function clearSession(): void
export function getActiveBranchId(): number | null
export function setActiveBranchId(id: number | null): void
export const api: {
  get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T>
  post<T = any>(endpoint: string, body?: any): Promise<T>
  put<T = any>(endpoint: string, body?: any): Promise<T>
  patch<T = any>(endpoint: string, body?: any): Promise<T>
  delete<T = any>(endpoint: string): Promise<T>
  download(endpoint: string, params?: Record<string, any>): Promise<Blob>
}
export default api