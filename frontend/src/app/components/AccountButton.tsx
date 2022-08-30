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
import { smoothBezier } from '../../utils/common'
import { useAuth } from '../auth/AuthProvider'
import { AccountPanel } from './panels/AccountPanel'

export const AccountButton = () => {
  const [t] = useTranslation()
  const theme = useTheme()
  const { user } = useAuth()

  const [accountPanelOpen, setAccountPanelOpen] = useState(false)

  useEffect(() => {
    if (accountPanelOpen && !user) {
      setAccountPanelOpen(false)
    }
  }, [accountPanelOpen, user])

  if (!user) {
    return null
  }

  return (
    <>
      <Tooltip arrow title={t('account:accountButton.tooltip')}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px #0008',
            backgroundColor: darken(theme.palette.background.default, 0.1),
            transition: `background-color 0.4s ${smoothBezier}`,
            '&:hover': {
              backgroundColor: lighten(theme.palette.background.default, 0.1),
            },
            '& > *': {
              pointerEvents: 'none',
            },
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
                src={user.avatar}
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
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {user.name}
          </Typography>
          <ChevronRightRounded color="inherit" />
        </Stack>
      </Tooltip>
      <AccountPanel
        open={accountPanelOpen}
        onOpen={!user ? () => void 0 : () => setAccountPanelOpen(true)}
        onClose={() => setAccountPanelOpen(false)}
      />
    </>
  )
}
