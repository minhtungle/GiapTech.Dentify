export interface PagedResultDto<T> {
  totalCount: number
  items: T[]
}

export interface PagedAndSortedRequest {
  sorting?: string
  skipCount?: number
  maxResultCount?: number
}
