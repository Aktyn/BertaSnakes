export type PaginatedRequest<BaseRequest> =
  | BaseRequest
  | {
      page?: number
      pageSize?: number
    }

export type PaginatedResponse<DataType> = {
  items: DataType[]
  page: number
  pageSize: number
  total: number
}

export type OrderByRequest<KeyType = string> = {
  sortKey?: KeyType
  /** @default 'desc' */
  sortDirection?: 'asc' | 'desc'
}

export interface SuccessResponse {
  success: boolean
}
