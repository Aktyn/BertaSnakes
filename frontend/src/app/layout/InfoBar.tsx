import { memo } from 'react'
import { HomeRounded } from '@mui/icons-material'
import { Box, darken, Grow, IconButton, Tooltip, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { smoothBezier } from '../../utils/common'
import { useAuth } from '../auth/AuthProvider'
import { AccountButton } from '../components/AccountButton'
import Navigation from '../navigation'

export const InfoBar = memo(() => {
  const [t] = useTranslation()
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: darken(theme.palette.background.default, 0.4),
        boxShadow: '0 0 4px #0006',
        zIndex: 5,
      }}
    >
      <Grow
        in={location.pathname !== Navigation.DASHBOARD.path}
        easing={smoothBezier}
      >
        <Tooltip
          arrow
          title={t('common:homepage')}
          sx={{ justifySelf: 'flex-start' }}
        >
          <IconButton
            color="inherit"
            onClick={() => navigate(Navigation.DASHBOARD.path)}
          >
            <HomeRounded />
          </IconButton>
        </Tooltip>
      </Grow>
      <Box sx={{ display: 'inline-block' }} />
      <Grow in={!!user} easing={smoothBezier}>
        <Box sx={{ justifySelf: 'flex-end' }}>
          <AccountButton />
        </Box>
      </Grow>
    </Box>
  )
})
