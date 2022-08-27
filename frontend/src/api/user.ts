import type {
  CreateUserRequest,
  SearchUserRequest,
  UserPublic,
  PaginatedRequest,
  PaginatedResponse,
} from 'berta-snakes-shared'
import { api } from '.'

export const register = (request: CreateUserRequest) =>
  api.post<UserPublic>('/users', request)

export const searchUsers = (request: PaginatedRequest<SearchUserRequest>) =>
  api.get<PaginatedResponse<UserPublic>>('/users', { params: request })

export const confirmEmail = (confirmationCode: string) =>
  api.put(`/users/confirm-email?confirmationCode=${confirmationCode}`)
