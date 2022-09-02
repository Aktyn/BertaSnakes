import { lighten, Stack, Typography } from '@mui/material'
import type { GalleryMedia } from 'berta-snakes-shared'
import { parseTimestamp } from 'berta-snakes-shared'
import { useTranslation } from 'react-i18next'
import { UserButton } from '../../components/common/UserButton'

interface MediaItemProps {
  media: GalleryMedia
  width: number
}

export const MediaItem = ({ media, width }: MediaItemProps) => {
  const [t] = useTranslation()

  return (
    <Stack
      alignItems="center"
      spacing={2}
      sx={{
        width: `${width}px`,
        padding: 2,
        backgroundColor: (theme) =>
          lighten(theme.palette.background.default, 0.1),
        border: (theme) =>
          `1px solid ${lighten(theme.palette.background.default, 0.2)}`,
        borderRadius: 2,
        boxShadow: '0 2px 4px #0006',
        overflow: 'hidden',
      }}
    >
      <Stack alignItems="center" spacing={1}>
        <Typography variant="body1">{media.title}</Typography>
        <Typography variant="body2">
          {t('common:created')}:&nbsp;{parseTimestamp(media.created)}
        </Typography>
        {media.author && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography component="div" variant="body2">
              {t('gallery:author')}:
            </Typography>
            <UserButton variant="text" user={media.author} />
          </Stack>
        )}
      </Stack>
      <img
        src={'data:image;base64,' + media.data}
        style={{
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          display: 'block',
          width: '100%',
        }}
      />
    </Stack>
  )
}
