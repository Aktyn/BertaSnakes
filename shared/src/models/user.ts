export interface UserPublic {
  id: number
  name: string
  created: number
}

export interface UserPrivate extends UserPublic {
  email: string
  /** True if there is a `confirmationCode` field in database document */
  confirmed: boolean
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}

export interface SearchUserRequest {
  name?: string
  nameFragment?: string
  email?: string
  emailFragment?: string
}
