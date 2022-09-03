import { useCallback } from 'react'
import { Masonry } from '@mui/lab'
import type { Theme } from '@mui/material'
import { CircularProgress, Stack, useMediaQuery } from '@mui/material'
import { useGalleryMedia } from '../../../api/queries/useGalleryMedia'
import { Pagination } from '../../components/common/Pagination'
import { MediaItem } from './MediaItem'

const ITEM_WIDTH = 256

const GalleryPage = () => {
  const { searchGalleryMedia, galleryMedia, isGalleryMediaFetching } =
    useGalleryMedia()

  const belowLG = useMediaQuery<Theme>((theme) => theme.breakpoints.down('lg'))
  const belowMD = useMediaQuery<Theme>((theme) => theme.breakpoints.down('md'))
  const columns = belowMD ? 1 : belowLG ? 2 : 3

  const search = useCallback(
    (page: number) =>
      searchGalleryMedia({
        page,
        sortKey: 'created',
        sortDirection: 'desc',
      }),
    [searchGalleryMedia],
  )

  return (
    <Stack
      alignItems="center"
      justifyContent="space-between"
      p={4}
      spacing={2}
      minHeight="100%"
    >
      {isGalleryMediaFetching ? (
        <CircularProgress color="inherit" />
      ) : (
        <Masonry
          columns={columns}
          spacing={2}
          sx={{ maxWidth: `${ITEM_WIDTH * (columns + 1)}px` }}
        >
          {(galleryMedia?.items ?? []).map((media) => (
            <MediaItem key={media.id} media={media} width={ITEM_WIDTH} />
          ))}
        </Masonry>
      )}
      <Pagination
        pages={
          galleryMedia
            ? Math.ceil(galleryMedia.total / Math.max(1, galleryMedia.pageSize))
            : 0
        }
        onChange={search}
      />
    </Stack>
  )
}

export default GalleryPage
