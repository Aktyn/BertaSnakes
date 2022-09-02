import type { OrderByRequest } from './common'
import type { UserPublic } from './user'

export interface GalleryMedia {
  id: number
  created: number
  title: string
  /** Base64 media data or null */
  data: string
  author: UserPublic | null
}

export interface SearchGalleryMediaRequest {
  orderBy?: OrderByRequest<'created'>
}
