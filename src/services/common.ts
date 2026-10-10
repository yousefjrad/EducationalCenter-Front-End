export interface Paged<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}