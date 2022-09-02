import { useTranslation } from 'react-i18next'
import { useErrorSnackbar } from '../../app/hooks/useErrorSnackbar'
import { searchGalleryMedia } from '../media'
import { useApiMutation } from './useApiMutation'

export function useGalleryMedia() {
  const [t] = useTranslation()

  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const fetchGalleryMediaMutation = useApiMutation(
    searchGalleryMedia,
    undefined,
    (err) => {
      enqueueErrorSnackbar(err, t('gallery:error.cannotFetchGalleryMedia'))
    },
  )

  return {
    isGalleryMediaFetching: fetchGalleryMediaMutation.isLoading,
    galleryMedia: fetchGalleryMediaMutation.data?.data,
    searchGalleryMedia: fetchGalleryMediaMutation.mutate,
  }
}
