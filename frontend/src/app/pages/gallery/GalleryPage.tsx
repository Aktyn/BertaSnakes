import { useEffect, useState } from 'react'
import { Masonry } from '@mui/lab'
import type { Theme } from '@mui/material'
import { CircularProgress, Stack, useMediaQuery } from '@mui/material'
import { useMedia } from '../../../api/queries/useMedia'
import { Pagination } from '../../components/common/Pagination'
import { MediaItem } from './MediaItem'

const ITEM_WIDTH = 256

const GalleryPage = () => {
  const belowLG = useMediaQuery<Theme>((theme) => theme.breakpoints.down('lg'))
  const belowMD = useMediaQuery<Theme>((theme) => theme.breakpoints.down('md'))
  const columns = belowMD ? 1 : belowLG ? 2 : 3

  const [page, setPage] = useState<number | null>(null)
  const [pages, setPages] = useState(0)

  const { galleryMedia, isGalleryMediaFetching, searchGalleryMedia } = useMedia(
    page ?? undefined,
  )

  useEffect(() => {
    if (galleryMedia) {
      setPages(
        Math.ceil(galleryMedia.total / Math.max(1, galleryMedia.pageSize)),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!galleryMedia])

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
            <MediaItem
              key={media.id}
              media={media}
              width={ITEM_WIDTH}
              onDelete={searchGalleryMedia}
            />
          ))}
        </Masonry>
      )}
      <Pagination pages={pages} onChange={setPage} />
    </Stack>
  )
}

export default GalleryPage
