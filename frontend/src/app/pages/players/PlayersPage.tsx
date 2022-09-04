import { useMemo, useState } from 'react'
import { ChevronRightRounded } from '@mui/icons-material'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import type { UserPublic } from 'berta-snakes-shared'
import { parseTimestamp } from 'berta-snakes-shared'
import { useTranslation } from 'react-i18next'
import { useUsers } from '../../../api/queries/useUsers'
import { UserPanel } from '../../components/panels/UserPanel'
import type { TableColumnSchema } from '../../components/table/Table'
import { Table } from '../../components/table/Table'
import { UserAvatar } from '../../components/user/UserAvatar'
import { UserRoleChip } from '../../components/user/UserRoleChip'

const PlayersPage = () => {
  const [t] = useTranslation()

  const { users, refetchUsers } = useUsers({})

  const [focusUser, setFocusUser] = useState<UserPublic | null>(null)
  const [openUserPanel, setOpenUserPanel] = useState(false)

  const columns = useMemo<TableColumnSchema<UserPublic>[]>(
    () => [
      {
        key: 'name',
        title: t('user:table.name'),
        value: (row) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <UserAvatar user={row} />
            <Typography variant="body2">{row.name}</Typography>
          </Stack>
        ),
      },
      {
        key: 'created',
        title: t('user:table.created'),
        value: (user) => parseTimestamp(user.created),
      },
      {
        key: 'lastLogin',
        title: t('user:table.lastLogin'),
        value: (user) => parseTimestamp(user.lastLogin),
      },
      {
        key: 'role',
        title: t('user:table.role'),
        value: (user) => <UserRoleChip user={user} />,
      },
      {
        key: 'actions',
        width: 48,
        value: (user) => (
          <Tooltip arrow title={t('user:userButton.tooltip')}>
            <IconButton
              color="inherit"
              onClick={() => {
                setFocusUser(user)
                setOpenUserPanel(true)
              }}
            >
              <ChevronRightRounded color="inherit" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [t],
  )

  return (
    <>
      <Stack
        alignItems="center"
        p={2}
        maxWidth="lg"
        m="auto"
        height="100%"
        sx={{ overflow: 'hidden' }}
      >
        <Table
          columns={columns}
          data={users?.items ?? []}
          total={users?.total}
          title={t('user:table.tableTitle')}
          onRefresh={refetchUsers}
        />
      </Stack>
      {focusUser && (
        <UserPanel
          user={focusUser}
          open={openUserPanel}
          onClose={() => setOpenUserPanel(false)}
        />
      )}
    </>
  )
}

export default PlayersPage
