import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { AddPhotoAlternateRounded } from '@mui/icons-material'
import { Box, Button, Grow } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { smoothBezier } from '../../utils/common'
import { MediaUploadDialog } from '../components/dialog/MediaUploadDialog'
import Navigation from '../navigation'

enum RouteActionDialog {
  MEDIA_UPLOAD,
}

const RouteActionsButtons = ({
  setOpenDialog,
}: {
  setOpenDialog: Dispatch<SetStateAction<RouteActionDialog | null>>
}) => {
  const [t] = useTranslation()
  const location = useLocation()

  switch (location.pathname) {
    case Navigation.GALLERY.path:
      return (
        //TODO: visible only to logged in users
        <Grow in easing={smoothBezier}>
          <Button
            variant="outlined"
            startIcon={<AddPhotoAlternateRounded />}
            onClick={() => setOpenDialog(RouteActionDialog.MEDIA_UPLOAD)}
          >
            {t('gallery:action.uploadMedia')}
          </Button>
        </Grow>
      )
    default:
      return <Box />
  }
}

export const RouteActions = () => {
  const [openDialog, setOpenDialog] = useState<RouteActionDialog | null>(null)

  return (
    <>
      <RouteActionsButtons setOpenDialog={setOpenDialog} />
      <MediaUploadDialog
        open={openDialog === RouteActionDialog.MEDIA_UPLOAD}
        onClose={() => setOpenDialog(null)}
      />
    </>
  )
}
