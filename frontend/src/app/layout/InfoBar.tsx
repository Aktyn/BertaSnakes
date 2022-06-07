import { css } from '@emotion/css'
import { CheckCircleRounded, ErrorRounded } from '@mui/icons-material'
import { Box, darken, Stack, Typography, useTheme } from '@mui/material'
import { lightGreen, red } from '@mui/material/colors'
import { useTranslation } from 'react-i18next'
import { useWebsocket } from '../hooks/useWebsocket'

export const InfoBar = () => {
  const [t] = useTranslation()
  const theme = useTheme()
  const websocket = useWebsocket()

  return (
    <Box
      className={css`
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        justify-content: space-between;

        padding: 4px 8px;
        background-color: ${darken(theme.palette.background.default, 0.4)};
        box-shadow: 0 0 8px #0006;
      `}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          color: websocket.connected ? lightGreen[200] : red[300],
        }}
      >
        {websocket.connected ? (
          <CheckCircleRounded fontSize="small" />
        ) : (
          <ErrorRounded fontSize="small" />
        )}
        <Typography variant="caption">
          {t(
            `common:serverConnection.${
              websocket.connected ? 'connected' : 'disconnected'
            }`,
          )}
        </Typography>
      </Stack>
    </Box>
  )
}
