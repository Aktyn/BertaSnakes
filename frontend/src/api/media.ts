import type {
  GalleryMedia,
  PaginatedRequest,
  PaginatedResponse,
  SearchGalleryMediaRequest,
} from 'berta-snakes-shared'
import { flattenObject } from 'berta-snakes-shared'
import { api } from '.'

export const searchGalleryMedia = (
  request: PaginatedRequest<SearchGalleryMediaRequest>,
) =>
  api.get<PaginatedResponse<GalleryMedia>>('/media', {
    params: flattenObject(request),
  })
