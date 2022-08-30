import { PersonRounded } from '@mui/icons-material'
import { alpha, Box, Stack, Typography } from '@mui/material'
import { common, lightBlue } from '@mui/material/colors'
import { useTranslation } from 'react-i18next'
import { openImageFile, smoothBezier } from '../../../utils/common'
import { useErrorSnackbar } from '../../hooks/useErrorSnackbar'

interface AvatarInputProps {
  size?: number
  /** Base64 image data */
  value?: string | null
  onSelect: (base64: string) => void
  onClear: () => void
}

export const AvatarInput = ({
  size = 64,
  value,
  onSelect,
  onClear,
}: AvatarInputProps) => {
  const [t] = useTranslation()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const handleSelectAvatar = async () => {
    try {
      const base64 = await openImageFile()
      onSelect(base64)
    } catch (e) {
      enqueueErrorSnackbar(e, t('account:action.chooseAvatarFileError'))
    }
  }

  const handleClearAvatar = () => onClear()

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fffc',
        backgroundColor: value ? lightBlue[900] : lightBlue[600],
        boxShadow: '0 2px 4px #0008',
        borderRadius: '100%',
        overflow: 'hidden',
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
      }}
    >
      {value ? (
        <img
          src={value}
          alt="avatar-image"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <PersonRounded
          color="inherit"
          sx={{
            width: '61.8%',
            height: '61.8%',
          }}
        />
      )}
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          backgroundColor: alpha(value ? common.black : lightBlue[600], 0.75),
          cursor: 'pointer',
          opacity: 0,
          transition: `opacity 0.4s ${smoothBezier}`,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={value ? handleClearAvatar : handleSelectAvatar}
      >
        <Typography variant="body2" fontWeight="bold" textAlign="center">
          {t(
            value
              ? 'account:action.clearAvatar'
              : 'account:action.chooseAvatarFile',
          )}
        </Typography>
      </Stack>
    </Box>
  )
}
