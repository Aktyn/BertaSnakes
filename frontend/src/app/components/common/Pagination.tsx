import type { ChangeEvent } from 'react'
import { useCallback, useEffect } from 'react'
import type { PaginationProps as MuiPaginationProps } from '@mui/material'
import { Stack, Pagination as MuiPagination } from '@mui/material'
import { int } from 'berta-snakes-shared'
import qs from 'qs'
import { useNavigate } from 'react-router-dom'
import { useQueryParams } from '../../hooks/useQueryParams'

interface PaginationProps extends Omit<MuiPaginationProps, 'onChange'> {
  pages: number
  onChange: (page: number) => void
}

export const Pagination = ({
  pages,
  onChange,
  ...muiPaginationProps
}: PaginationProps) => {
  //TODO: separate logic into usePagination hook and use it for better data refetching (in gallery page for example)
  const params = useQueryParams() as { page?: string }
  const navigate = useNavigate()

  const page = Math.max(1, int(params.page))

  useEffect(() => {
    onChange(page - 1)
  }, [onChange, page])

  const setPage = useCallback(
    (_: ChangeEvent<unknown> | null, value: number) => {
      const p = qs.parse(window.location.search, { ignoreQueryPrefix: true })
      navigate({ search: qs.stringify({ ...p, page: value }) })

      // To force page refresh:
      // window.history.replaceState(null, '', `${window.location.pathname}?${nextSearch}`);
    },
    [navigate],
  )

  useEffect(() => {
    if (pages > 0 && page > pages) {
      setPage(null, pages)
    }
  }, [page, pages, setPage])

  if (pages <= 1) {
    return null
  }

  return (
    <Stack direction="row">
      <MuiPagination
        count={pages}
        page={page}
        onChange={setPage}
        {...muiPaginationProps}
      />
    </Stack>
  )
}
