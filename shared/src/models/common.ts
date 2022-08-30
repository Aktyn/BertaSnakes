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

export interface SuccessResponse {
  success: boolean
}
