import { memo } from 'react'
import { css } from '@emotion/css'
import { HomeRounded } from '@mui/icons-material'
import {
  Box,
  darken,
  Grow,
  IconButton,
  Stack,
  Tooltip,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import Navigation from '../navigation'

export const InfoBar = memo(() => {
  const [t] = useTranslation()
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box
      className={css`
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        justify-content: space-between;

        padding: 4px 8px;
        background-color: ${darken(theme.palette.background.default, 0.4)};
        box-shadow: 0 0 4px #0006;
        z-index: 5;
      `}
    >
      <Stack direction="row" spacing={2}>
        <Grow in={location.pathname !== Navigation.DASHBOARD.path}>
          <Tooltip title={t('common:homepage')}>
            <IconButton
              color="inherit"
              onClick={() => navigate(Navigation.DASHBOARD.path)}
            >
              <HomeRounded />
            </IconButton>
          </Tooltip>
        </Grow>
      </Stack>
    </Box>
  )
})
