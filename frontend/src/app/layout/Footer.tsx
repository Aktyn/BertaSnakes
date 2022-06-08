import { css } from '@emotion/css'
import { CheckCircleRounded, ErrorRounded } from '@mui/icons-material'
import {
  Box,
  darken,
  Link,
  Stack,
  Typography,
  typographyClasses,
  useTheme,
} from '@mui/material'
import { lightGreen, red } from '@mui/material/colors'
import { useTranslation } from 'react-i18next'
import aktynLogo from '../../img/icons/aktyn.png'
import { useWebsocket } from '../hooks/useWebsocket'

export const Footer = () => {
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
        color: ${darken(theme.palette.text.primary, 0.4)};
        background-color: ${darken(theme.palette.background.default, 0.4)};
        box-shadow: 0 0 8px #0006;

        & .${typographyClasses.root} {
          display: flex;
          align-items: center;
          font-size: 10px;
          font-weight: 400;
        }
      `}
    >
      <Stack direction="row" spacing={2}>
        <Typography>
          {t('common:version')}:&nbsp;{process.env.REACT_APP_VERSION}
        </Typography>
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
          <Typography>
            {t(
              `common:serverConnection.${
                websocket.connected ? 'connected' : 'disconnected'
              }`,
            )}
          </Typography>
        </Stack>
      </Stack>
      <Typography>
        {t('global:copyright')}&nbsp;
        <img style={{ height: 16 }} alt="author logo" src={aktynLogo} />
        &nbsp;- {t('global:allRightsReserved')}
      </Typography>
      <Stack direction="row" gap={2} justifyContent="flex-end">
        <Typography>
          {process.env.REACT_APP_PAYPAL_DONATE_URL && (
            <Link
              href={process.env.REACT_APP_PAYPAL_DONATE_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('common:paypal.donate')}
            </Link>
          )}
        </Typography>
        {process.env.REACT_APP_AUTHOR_URL && (
          <Typography>
            <Link
              href={process.env.REACT_APP_AUTHOR_URL}
              target="_blank"
              rel="noreferrer"
            >
              {process.env.REACT_APP_AUTHOR_URL}
            </Link>
          </Typography>
        )}
      </Stack>
    </Box>
  )
}
