import type {
  GalleryMedia,
  PaginatedRequest,
  PaginatedResponse,
  SearchGalleryMediaRequest,
  SubmitGalleryMediaRequest,
  SuccessResponse,
} from 'berta-snakes-shared'
import { api } from '.'

export const searchGalleryMedia = (
  request: PaginatedRequest<SearchGalleryMediaRequest>,
) =>
  api.get<PaginatedResponse<GalleryMedia>>('/media', {
    params: request,
  })

export const submitGalleryMedia = (request: SubmitGalleryMediaRequest) =>
  api.post<SuccessResponse>('/media', request)

export const deleteGalleryMedia = (mediaId: GalleryMedia['id']) =>
  api.delete<SuccessResponse>('/media', { params: { id: mediaId } })
