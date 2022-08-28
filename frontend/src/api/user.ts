import type {
  CreateUserRequest,
  SearchUserRequest,
  UserPrivate,
  PaginatedRequest,
  PaginatedResponse,
  UserPublic,
  LoginUserRequest,
  UserSessionData,
} from 'berta-snakes-shared'
import { api } from '.'

export const login = (request: LoginUserRequest) =>
  api.post<UserSessionData>('/users/login', request)

export const getMe = () => api.get<UserPrivate>('/users/me')

export const register = (request: CreateUserRequest) =>
  api.post<UserPrivate>('/users', request)

export const searchUsers = (request: PaginatedRequest<SearchUserRequest>) =>
  api.get<PaginatedResponse<UserPublic>>('/users', { params: request })

export const confirmEmail = (confirmationCode: string) =>
  api.put<UserSessionData>('/users/confirm-email', {
    confirmationCode,
  })
