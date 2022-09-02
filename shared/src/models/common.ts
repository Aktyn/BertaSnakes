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
  key: KeyType
  /** @default 'desc' */
  direction?: 'asc' | 'desc'
}

export interface SuccessResponse {
  success: boolean
}
