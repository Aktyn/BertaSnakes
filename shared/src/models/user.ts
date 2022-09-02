// Value cannot not be longer than 16 characters since database column for role is of type varchar(16)
export enum UserRole {
  REGULAR = 'regular',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface UserPublic {
  id: number
  name: string
  created: number
  lastLogin: number
  role: UserRole
  /** Base64 image data or null */
  avatar: string | null
}

export interface UserPrivate extends UserPublic {
  email: string
  /** True if `confirmed` field in database is `null` */
  confirmed: boolean
}

export interface UserSessionData {
  accessToken: string
  user: UserPrivate
  expires: number
}

export interface LoginUserRequest {
  usernameOrEmail: string
  password: string
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

export interface EmailConfirmationRequest {
  /** Base64 confirmation code */
  confirmationCode: string
}

export interface SetAvatarRequest {
  /** Base64 image data or null */
  base64: string | null
}
