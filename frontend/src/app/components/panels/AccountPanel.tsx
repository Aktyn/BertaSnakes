import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { LogoutRounded } from '@mui/icons-material'
import type { SwipeableDrawerProps } from '@mui/material'
import { Box, SwipeableDrawer, Button, Stack } from '@mui/material'
import { AxiosError } from 'axios'
import { parseTimestamp } from 'berta-snakes-shared'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { setAvatar } from '../../../api/user'
import type { KeyType } from '../../../i18n'
import { zoomDelay } from '../../../utils/common'
import { useAuth } from '../../auth/AuthProvider'
import { useErrorSnackbar } from '../../hooks/useErrorSnackbar'
import { BooleanValue } from '../common/BooleanValue'
import { CenteredStatsRow } from '../common/CenteredStatsRow'
import { AvatarInput } from '../form/AvatarInput'
import { ZoomEnter } from '../transition/ZoomEnter'

type AccountPanelProps = SwipeableDrawerProps

export const AccountPanel = ({
  onClose,
  ...drawerProps
}: AccountPanelProps) => {
  const [t] = useTranslation()
  const { user, logout, updateUserData } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const handleChangeAvatar = async (base64?: string) => {
    try {
      const response = await setAvatar({
        base64: base64 ?? null,
      })
      if (!response.data?.success) {
        throw new Error()
      }
      updateUserData({ avatar: base64 ?? null })
      enqueueSnackbar(t('account:action.avatarSetSuccess'), {
        variant: 'success',
      })
      return true
    } catch (err) {
      enqueueErrorSnackbar(
        err instanceof AxiosError ? err : null,
        t('account:action.avatarSetError'),
      )
      return false
    }
  }

  const userData = useMemo<{ label: KeyType; value: ReactNode }[]>(
    () =>
      user
        ? [
            { label: 'account:userData.name', value: user.name },
            { label: 'account:userData.email', value: user.email },
            {
              label: 'account:userData.created',
              value: parseTimestamp(user.created),
            },
            {
              label: 'account:userData.confirmed',
              value: <BooleanValue>{user.confirmed}</BooleanValue>,
            },
            {
              label: 'account:userData.role',
              value: t(`common:roleName.${user.role}`), //TODO: color coded role chips
            },
          ]
        : [],
    [t, user],
  )

  if (!user) {
    return null
  }

  return (
    <SwipeableDrawer
      anchor="right"
      onClose={onClose}
      PaperProps={{
        sx: {
          borderLeft: '4px solid #0004',
        },
      }}
      {...drawerProps}
    >
      <Stack
        height="100%"
        justifyContent="space-between"
        padding={2}
        spacing={2}
      >
        <Stack spacing={2} alignItems="center">
          <AvatarInput
            value={user.avatar}
            onSelect={handleChangeAvatar}
            onClear={handleChangeAvatar}
          />
          <Stack alignItems="center">
            {userData.map((row, index) => (
              <ZoomEnter key={index} delay={zoomDelay * index}>
                <Box
                  sx={{
                    display: 'block',
                    minWidth: 320,
                  }}
                >
                  <CenteredStatsRow
                    label={t(row.label) + ':'}
                    value={row.value}
                  />
                </Box>
              </ZoomEnter>
            ))}
          </Stack>
        </Stack>
        <ZoomEnter delay={zoomDelay * userData.length}>
          <Button
            variant="contained"
            color="primary"
            endIcon={<LogoutRounded />}
            onClick={logout}
          >
            {t('account:action.logout')}
          </Button>
        </ZoomEnter>
      </Stack>
    </SwipeableDrawer>
  )
}
