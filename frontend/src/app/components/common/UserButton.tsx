import { useEffect, useState } from 'react'
import { AccountCircleRounded, ChevronRightRounded } from '@mui/icons-material'
import {
  Avatar,
  darken,
  lighten,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { lightBlue } from '@mui/material/colors'
import { useTranslation } from 'react-i18next'
import { smoothBezier } from '../../../utils/common'
import type { UserPanelProps } from '../panels/UserPanel'
import { UserPanel } from '../panels/UserPanel'

type UserButtonProps = UserPanelProps & {
  /** @default 'contained' */
  variant?: 'contained' | 'text'
}

export const UserButton = ({
  variant = 'contained',
  isUserPrivate,
  user,
}: UserButtonProps) => {
  const [t] = useTranslation()
  const theme = useTheme()

  const [accountPanelOpen, setAccountPanelOpen] = useState(false)

  useEffect(() => {
    if (accountPanelOpen && !user) {
      setAccountPanelOpen(false)
    }
  }, [accountPanelOpen, user])

  return (
    <>
      <Tooltip arrow title={t('user:userButton.tooltip')}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            display: 'inline-flex',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            boxShadow: variant === 'contained' ? '0 2px 4px #0008' : 'none',
            backgroundColor:
              variant === 'contained'
                ? darken(theme.palette.background.default, 0.1)
                : '#fff0',
            transition: `background-color 0.4s ${smoothBezier}`,
            '&:hover': {
              backgroundColor:
                variant === 'contained'
                  ? lighten(theme.palette.background.default, 0.1)
                  : '#fff1',
            },
            '& > *': {
              pointerEvents: 'none',
            },
            overflow: 'hidden',
          }}
          onClick={() => setAccountPanelOpen(true)}
        >
          <Avatar
            sx={{
              bgcolor: 'transparent',
              color: lightBlue[200],
              height: '24px',
              width: '24px',
            }}
          >
            {user.avatar ? (
              <img
                src={'data:image;base64,' + user.avatar}
                alt="account-avatar"
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <AccountCircleRounded
                color="inherit"
                sx={{ height: '100%', width: '100%' }}
              />
            )}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexGrow: 1,
            }}
          >
            {user.name}
          </Typography>
          <ChevronRightRounded color="inherit" />
        </Stack>
      </Tooltip>
      <UserPanel
        isUserPrivate={isUserPrivate as false}
        user={user}
        open={accountPanelOpen}
        onOpen={!user ? () => void 0 : () => setAccountPanelOpen(true)}
        onClose={() => setAccountPanelOpen(false)}
      />
    </>
  )
}
