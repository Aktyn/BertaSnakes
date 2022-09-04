import type { Key, ReactNode } from 'react'
import { useState } from 'react'
import {
  RefreshRounded,
  ViewComfyAltRounded,
  ViewCompactAltRounded,
} from '@mui/icons-material'
import {
  TableContainer,
  Paper,
  TableBody,
  TableRow,
  TableCell,
  Table as MuiTable,
  Typography,
  TableHead,
  Box,
  Stack,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  TablePagination,
  TableFooter,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { typedMemo } from '../../../utils/common'

interface DataSchema {
  id: Key
}

export interface TableColumnSchema<DataType> {
  /** Unique column key */
  key: Key
  title?: ReactNode
  value: keyof DataType | ((data: DataType) => ReactNode)
  width?: number
}

interface TableProps<DataType> {
  columns: TableColumnSchema<DataType>[]
  data: DataType[]
  total?: number
  title?: ReactNode
  onRefresh?: () => void
}

enum TableViewMode {
  COMFY,
  COMPACT,
}

export const Table = typedMemo(
  <DataType extends DataSchema>({
    columns,
    data,
    total,
    title,
    onRefresh,
  }: //TODO: API request and usePagination hook
  TableProps<DataType>) => {
    const [t] = useTranslation()

    const [viewMode, setViewMode] = useState<TableViewMode>(TableViewMode.COMFY)

    return (
      <TableContainer
        component={Paper}
        elevation={8}
        sx={{ borderRadius: '8px' }}
      >
        <MuiTable
          stickyHeader
          size={viewMode === TableViewMode.COMPACT ? 'small' : 'medium'}
        >
          <TableHead>
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateRows: '100%',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    {total !== undefined && (
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {t('common:table.total')}:&nbsp;{total}
                      </Typography>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {typeof title === 'string' ? (
                      <Typography variant="h5" fontWeight="bold">
                        {title}
                      </Typography>
                    ) : (
                      title
                    )}
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifySelf: 'right', textAlign: 'right' }}
                  >
                    <Tooltip arrow title={t('common:table.toggleMode')}>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        onChange={(_, mode) => setViewMode(mode)}
                      >
                        <ToggleButton
                          value={TableViewMode.COMPACT}
                          sx={
                            viewMode === TableViewMode.COMPACT
                              ? {
                                  '&, &:hover': {
                                    backgroundColor: (theme) =>
                                      alpha(theme.palette.text.secondary, 0.2),
                                  },
                                }
                              : undefined
                          }
                        >
                          <ViewCompactAltRounded
                            sx={{
                              color: (theme) => theme.palette.text.secondary,
                            }}
                          />
                        </ToggleButton>
                        <ToggleButton
                          value={TableViewMode.COMFY}
                          sx={
                            viewMode === TableViewMode.COMFY
                              ? {
                                  '&, &:hover': {
                                    backgroundColor: (theme) =>
                                      alpha(theme.palette.text.secondary, 0.2),
                                  },
                                }
                              : undefined
                          }
                        >
                          <ViewComfyAltRounded
                            sx={{
                              color: (theme) => theme.palette.text.secondary,
                            }}
                          />
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Tooltip>
                    {onRefresh && (
                      <Tooltip arrow title={t('common:table.refresh')}>
                        <IconButton color="inherit" onClick={onRefresh}>
                          <RefreshRounded />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  style={{ width: column.width }}
                  // align={column.align} //left, center, right, justify, inherit
                >
                  {column.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                // sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} style={{ width: column.width }}>
                    {column.value instanceof Function ? (
                      column.value(row)
                    ) : (
                      <Typography variant="body2">
                        {row[column.value] as ReactNode}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                // rowsPerPageOptions={[5, 10, 25]}
                colSpan={columns.length}
                count={total ?? 0}
                rowsPerPage={2}
                page={0}
                SelectProps={{
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                }}
                onPageChange={() => void 0}
                // onRowsPerPageChange={setRowsPerPage}
                // ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </MuiTable>
      </TableContainer>
    )
  },
)
