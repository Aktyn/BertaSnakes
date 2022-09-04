import { useMemo } from 'react'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { useErrorSnackbar } from '../../app/hooks/useErrorSnackbar'
import {
  deleteGalleryMedia,
  searchGalleryMedia,
  submitGalleryMedia,
} from '../media'
import { useApiMutation } from './useApiMutation'

export function useMedia(page?: number) {
  const [t] = useTranslation()

  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const request = useMemo(
    () => ({
      page,
      sortKey: 'created',
      sortDirection: 'desc',
      pageSize: 6,
    }),
    [page],
  )

  const galleryMediaQuery = useQuery(
    `/media?page=${page ?? '-'}`,
    () =>
      typeof page === 'number'
        ? searchGalleryMedia(request)
        : Promise.resolve(null),
    {
      onError: (err) => {
        enqueueErrorSnackbar(err, t('gallery:error.cannotFetchGalleryMedia'))
      },
    },
  )

  const submitGalleryMediaMutation = useApiMutation(
    submitGalleryMedia,
    (result) => {
      if (result.data.success) {
        enqueueSnackbar(t('gallery:success.galleryMediaSubmitted'), {
          variant: 'success',
        })
        galleryMediaQuery.refetch()
      }
    },
    (err) => {
      enqueueErrorSnackbar(err, t('gallery:error.cannotSubmitGalleryMedia'))
    },
  )

  const deleteGalleryMediaMutation = useApiMutation(
    deleteGalleryMedia,
    (result) => {
      if (result.data.success) {
        enqueueSnackbar(t('gallery:success.galleryMediaDeleted'), {
          variant: 'success',
        })
        galleryMediaQuery.refetch()
      }
    },
    (err) => {
      enqueueErrorSnackbar(err, t('gallery:error.cannotDeleteGalleryMedia'))
    },
  )

  return {
    galleryMedia: galleryMediaQuery.data?.data,

    searchGalleryMedia: galleryMediaQuery.refetch,
    isGalleryMediaFetching:
      galleryMediaQuery.isLoading || galleryMediaQuery.isFetching,

    submitGalleryMedia: submitGalleryMediaMutation.mutate,
    isGalleryMediaSubmitting: submitGalleryMediaMutation.isLoading,

    deleteGalleryMedia: deleteGalleryMediaMutation.mutate,
    isGalleryMediaDeleting: deleteGalleryMediaMutation.isLoading,
  }
}
