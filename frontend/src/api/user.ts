import type { CreateUserRequest, UserPublic } from 'berta-snakes-shared'
import { api } from '.'

export const register = (request: CreateUserRequest) =>
  api.post<UserPublic>('/users', request)
