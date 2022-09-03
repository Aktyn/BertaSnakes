import { useRef, useState } from 'react'
import {
  DeleteRounded,
  FullscreenRounded,
  MoreVertRounded,
} from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Backdrop,
  Box,
  IconButton,
  lighten,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GalleryMedia } from 'berta-snakes-shared'
import { parseTimestamp } from 'berta-snakes-shared'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useGalleryMedia } from '../../../api/queries/useGalleryMedia'
import { smoothBezier } from '../../../utils/common'
import { UserButton } from '../../components/common/UserButton'
import { RootPortal } from '../../components/portals/RootPortal'
import { useMounted } from '../../hooks/useMounted'
import Navigation from '../../navigation'

interface MediaItemProps {
  media: GalleryMedia
  width: number
}

export const MediaItem = ({ media, width }: MediaItemProps) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const mounted = useMounted()
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const { deleteGalleryMedia, isGalleryMediaDeleting } = useGalleryMedia(0)

  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <Stack
        alignItems="center"
        spacing={2}
        padding={1}
        sx={{
          width: `${width}px`,
          backgroundColor: (theme) =>
            lighten(theme.palette.background.default, 0.1),
          border: (theme) =>
            `1px solid ${lighten(theme.palette.background.default, 0.2)}`,
          borderRadius: 2,
          boxShadow: '0 2px 4px #0006',
          overflow: 'hidden',
        }}
      >
        <Stack alignItems="center" spacing={1} width="100%">
          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              justifyContent: 'space-between',
              columnGap: '8px',
            }}
          >
            <Box />
            <Typography
              variant="body1"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {media.title}
            </Typography>
            {/* TODO: make it visible only to specific user roles */}
            <Tooltip arrow title={t('common:more')}>
              <IconButton
                ref={moreButtonRef}
                color="inherit"
                sx={{ justifySelf: 'flex-end' }}
                onClick={() => setShowMore(true)}
              >
                <MoreVertRounded />
              </IconButton>
            </Tooltip>
            <Popover
              open={showMore}
              anchorEl={moreButtonRef.current}
              onClose={() => setShowMore(false)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <LoadingButton
                variant="contained"
                color="primary"
                startIcon={<DeleteRounded />}
                onClick={() =>
                  deleteGalleryMedia(media.id, {
                    onSuccess: (res) => {
                      if (!mounted || !res.data.success) {
                        return
                      }
                      navigate(Navigation.GALLERY.path)
                    },
                  })
                }
                loading={isGalleryMediaDeleting}
                loadingPosition="start"
              >
                {t('common:delete')}
              </LoadingButton>
            </Popover>
          </Box>
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
        <Box sx={{ width: '100%', position: 'relative' }}>
          <img
            src={'data:image;base64,' + media.data}
            style={{
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              display: 'block',
              width: '100%',
              minWidth: '96px',
              minHeight: '96px',
            }}
          />
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              backgroundColor: '#0004',
              transition: `opacity 0.4s ${smoothBezier}`,
              '& > button': {
                transform: 'scale(0)',
                transition: `transform 0.4s ${smoothBezier}`,
              },
              '&:hover': {
                opacity: 1,
                '& > button': {
                  transform: 'scale(1)',
                },
              },
            }}
          >
            <IconButton
              color="inherit"
              sx={{
                margin: 'auto',
                width: '96px',
                height: '96px',
              }}
              onClick={() => setShowFullscreen(true)}
            >
              <FullscreenRounded sx={{ fontSize: '48px' }} />
            </IconButton>
          </Stack>
        </Box>
      </Stack>
      <RootPortal>
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            padding: 2,
            boxSizing: 'border-box',
          }}
          open={showFullscreen}
          onClick={() => setShowFullscreen(false)}
        >
          <img
            src={'data:image;base64,' + media.data}
            style={{
              minWidth: '96px',
              minHeight: '96px',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
            }}
          />
        </Backdrop>
      </RootPortal>
    </>
  )
}
