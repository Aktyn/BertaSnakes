import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { LogoutRounded } from '@mui/icons-material'
import type { SwipeableDrawerProps } from '@mui/material'
import { Box, SwipeableDrawer, Button, Stack } from '@mui/material'
import { AxiosError } from 'axios'
import { parseTimestamp } from 'berta-snakes-shared'
import type { UserPrivate, UserPublic } from 'berta-snakes-shared'
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
import { UserRoleChip } from '../user/UserRoleChip'

export type UserPanelProps =
  | {
      isUserPrivate?: true
      user: UserPrivate
    }
  | {
      isUserPrivate?: false
      user: UserPublic
    }

export const UserPanel = ({
  isUserPrivate,
  user,
  onClose,
  onOpen,
  ...drawerProps
}: UserPanelProps &
  Omit<SwipeableDrawerProps, 'onOpen'> & { onOpen?: () => void }) => {
  const [t] = useTranslation()
  const { user: selfUser, logout, updateUserData } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const { enqueueErrorSnackbar } = useErrorSnackbar()

  const isSelfUser = selfUser?.id === user.id

  const handleChangeAvatar = async (base64?: string) => {
    try {
      base64 = base64?.replace(/^data:image(\/[^;]+)?;base64,/i, '')
      const response = await setAvatar({
        base64: base64 ?? null,
      })
      if (!response.data?.success) {
        throw new Error()
      }
      updateUserData({ avatar: base64 ?? null })
      enqueueSnackbar(t('user:action.avatarSetSuccess'), {
        variant: 'success',
      })
      return true
    } catch (err) {
      enqueueErrorSnackbar(
        err instanceof AxiosError ? err : null,
        t('user:action.avatarSetError'),
      )
      return false
    }
  }

  type UserDataEntry = { label: KeyType; value: ReactNode }

  const userData = useMemo(() => {
    if (!user) {
      return [] as UserDataEntry[]
    }
    const data: UserDataEntry[] = [
      { label: 'user:userData.name', value: user.name },
      {
        label: 'user:userData.role',
        value: <UserRoleChip user={user} />,
      },
      {
        label: 'common:created',
        value: parseTimestamp(user.created),
      },
    ]

    if (isUserPrivate) {
      if (!isSelfUser) {
        data.push({
          label: 'user:userData.lastLogin',
          value: parseTimestamp(user.lastLogin),
        })
      }

      data.push(
        { label: 'user:userData.email', value: user.email },
        {
          label: 'user:userData.confirmed',
          value: <BooleanValue>{user.confirmed}</BooleanValue>,
        },
      )
    }

    return data
  }, [isSelfUser, isUserPrivate, user])

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
      onOpen={onOpen ?? (() => void 0)}
    >
      <Stack
        height="100%"
        justifyContent="space-between"
        padding={2}
        spacing={2}
      >
        <Stack spacing={2} alignItems="center">
          <ZoomEnter delay={zoomDelay}>
            <Box>
              <AvatarInput
                value={user.avatar}
                onSelect={handleChangeAvatar}
                onClear={handleChangeAvatar}
              />
            </Box>
          </ZoomEnter>
          <Stack alignItems="center" spacing={1}>
            {userData.map((row, index) => (
              <ZoomEnter key={index} delay={zoomDelay * (index + 1)}>
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
        {isSelfUser && (
          <ZoomEnter delay={zoomDelay * (userData.length + 1)}>
            <Button
              variant="contained"
              color="primary"
              endIcon={<LogoutRounded />}
              onClick={logout}
            >
              {t('user:action.logout')}
            </Button>
          </ZoomEnter>
        )}
      </Stack>
    </SwipeableDrawer>
  )
}
