export interface UserPublic {
  id: string
  name: string
  created: number
}

export interface UserPrivate extends UserPublic {
  email: string
  confirmed: boolean
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}
