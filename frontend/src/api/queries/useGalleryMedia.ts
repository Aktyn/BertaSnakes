import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { useErrorSnackbar } from '../../app/hooks/useErrorSnackbar'
import { searchGalleryMedia, submitGalleryMedia } from '../media'
import { useApiMutation } from './useApiMutation'

export function useGalleryMedia() {
  const [t] = useTranslation()

  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const fetchGalleryMediaMutation = useApiMutation(
    searchGalleryMedia,
    undefined,
    (err) => {
      enqueueErrorSnackbar(err, t('gallery:error.cannotFetchGalleryMedia'))
    },
  )

  const submitGalleryMediaMutation = useApiMutation(
    submitGalleryMedia,
    (result) => {
      if (result.data.success) {
        enqueueSnackbar(t('gallery:success.galleryMediaSubmitted'), {
          variant: 'success',
        })
      }
    },
    (err) => {
      enqueueErrorSnackbar(err, t('gallery:error.cannotSubmitGalleryMedia'))
    },
  )

  return {
    isGalleryMediaFetching: fetchGalleryMediaMutation.isLoading,
    galleryMedia: fetchGalleryMediaMutation.data?.data,
    searchGalleryMedia: fetchGalleryMediaMutation.mutate,

    isGalleryMediaSubmitting: submitGalleryMediaMutation.isLoading,
    submitGalleryMedia: submitGalleryMediaMutation.mutate,
  }
}
