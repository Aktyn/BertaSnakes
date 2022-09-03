import { useState } from 'react'
import {
  AddPhotoAlternateRounded,
  DeleteRounded,
  PublishRounded,
  TitleRounded,
} from '@mui/icons-material'
import {
  type DialogProps,
  Stack,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGalleryMedia } from '../../../api/queries/useGalleryMedia'
import { openImageFile } from '../../../utils/common'
import { useErrorSnackbar } from '../../hooks/useErrorSnackbar'
import { useMounted } from '../../hooks/useMounted'
import Navigation from '../../navigation'
import { DecisionDialog } from './DecisionDialog'

interface MediaUploadDialogProps
  extends Omit<DialogProps, 'title' | 'onClose'> {
  onClose: () => void
}

export const MediaUploadDialog = ({
  onClose,
  ...dialogProps
}: MediaUploadDialogProps) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const mounted = useMounted()
  const { enqueueErrorSnackbar } = useErrorSnackbar()
  const { isGalleryMediaSubmitting, submitGalleryMedia } = useGalleryMedia(0)

  const [mediaTitle, setMediaTitle] = useState('')
  const [fileData, setFileData] = useState<string | null>(null)

  const handleSelectImage = async () => {
    try {
      const base64 = await openImageFile()
      setFileData(base64)
    } catch (e) {
      enqueueErrorSnackbar(e, t('dialog:mediaUpload.error.selectImageError'))
    }
  }

  return (
    <DecisionDialog
      onClose={onClose}
      onConfirm={() =>
        mediaTitle.length &&
        fileData &&
        submitGalleryMedia(
          {
            title: mediaTitle,
            data: fileData.replace(/^data:image(\/[^;]+)?;base64,/i, ''),
          },
          {
            onSuccess: (res) => {
              if (!mounted || !res.data.success) {
                return
              }
              setMediaTitle('')
              setFileData(null)
              navigate(Navigation.GALLERY.path)
              onClose()
            },
          },
        )
      }
      title={t('dialog:mediaUpload.title')}
      confirmEndIcon={<PublishRounded />}
      confirmContent={t('common:upload')}
      disableConfirm={!mediaTitle.length || !fileData}
      loading={isGalleryMediaSubmitting}
      {...dialogProps}
    >
      <Stack alignItems="center" spacing={2} padding={1}>
        <TextField
          value={mediaTitle}
          onChange={(event) => setMediaTitle(event.target.value)}
          variant="outlined"
          label={t('dialog:mediaUpload.titleLabel')}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TitleRounded />
              </InputAdornment>
            ),
          }}
          disabled={isGalleryMediaSubmitting}
        />
        <Box
          sx={{
            height: '128px',
            overflow: 'hidden',
          }}
        >
          {fileData ? (
            <Box
              sx={{
                height: '100%',
                display: 'inline-grid',
                gridTemplateColumns: '1fr auto 1fr',
                gridTemplateRows: '100%',
                columnGap: '8px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box />
              <img
                src={fileData}
                style={{
                  maxWidth: '256px',
                  maxHeight: '100%',
                  height: 'auto',
                  width: 'auto',
                }}
              />
              <Tooltip arrow title={t('dialog:mediaUpload.clearImage')}>
                <IconButton
                  color="inherit"
                  onClick={() => setFileData(null)}
                  disabled={isGalleryMediaSubmitting}
                >
                  <DeleteRounded />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <IconButton
              color="inherit"
              component="label"
              onClick={handleSelectImage}
              sx={{ padding: 0 }}
              disabled={isGalleryMediaSubmitting}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: '128px',
                  height: '128px',
                }}
              >
                <Typography variant="body1" fontWeight="bold">
                  {t('dialog:mediaUpload.selectImage')}
                </Typography>
                <AddPhotoAlternateRounded sx={{ fontSize: '48px' }} />
              </Stack>
            </IconButton>
          )}
        </Box>
      </Stack>
    </DecisionDialog>
  )
}
