import { useState } from 'react'
import { css, keyframes } from '@emotion/css'
import { LoginRounded, PersonAddAlt1Rounded } from '@mui/icons-material'
import {
  alpha,
  Box,
  Button,
  darken,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import Grid2 from '@mui/material/Unstable_Grid2'
import { cyan, red } from '@mui/material/colors'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import parallaxImage from '../../../img/graphics3.jpg'
import articleBackgroundGraphic from '../../../img/graphics4.webp'
import cashIcon from '../../../img/icons/money.png'
import podiumIcon from '../../../img/icons/podium.svg'
import socialIcon from '../../../img/icons/social.svg'
import { smoothBezier, zoomDelay } from '../../../utils/common'
import { useAuth } from '../../auth/AuthProvider'
import { LoginDialog } from '../../components/dialog/LoginDialog'
import { ZoomEnter } from '../../components/transition/ZoomEnter'
import Navigation from '../../navigation'
import { FeatureCard } from './FeatureCard'

const backgroundZoomIn = keyframes`
  from {
    background-size: auto 150%;
  }

  to {
    background-size: auto 100%;
  }
`

const sectionClass = css`
  min-height: 256px;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  z-index: 0;
  box-shadow: 0 4px 8px #0006;

  background-size: auto 150%;
  animation: ${backgroundZoomIn} 1000ms ${smoothBezier} forwards;
`

const sectionGradientClass = css`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: linear-gradient(
    90deg,
    ${alpha(cyan[400], 0.35)},
    transparent 40%,
    transparent 60%,
    ${alpha(red[400], 0.35)}
  );
`

const parallaxImageClass = css`
  display: block;
  width: 100%;
  height: 256px;
  overflow: hidden;

  transform-style: preserve-3d;
  overflow: visible;

  & > div {
    position: relative;
    z-index: -1;

    height: 200%;
    width: 100%;
    background-size: cover;
    background-repeat: repeat-y;
    background-position: center;

    transform: translateZ(-6px) scale(1.75);
    transform-origin: bottom;

    // animation: fade-in-opacity 1.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
`

const DashboardPage = () => {
  const [t] = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const auth = useAuth()

  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  return (
    <>
      <Stack
        className={css`
          transform-style: preserve-3d;
        `}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          className={clsx(
            sectionClass,
            css`
              background-color: ${darken(
                theme.palette.background.default,
                0.3,
              )};
              background-image: url(${articleBackgroundGraphic});
            `,
          )}
        >
          <Box className={sectionGradientClass} />
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%' }}
          >
            <ZoomEnter>
              <Typography
                variant="h3"
                textAlign="center"
                sx={{ fontFamily: "'Luckiest Guy', Roboto;'" }}
              >
                {t('global:projectName')}
              </Typography>
            </ZoomEnter>
            {(['line1', 'line2', 'line3', 'line4'] as const).map(
              (line, index) => (
                <ZoomEnter key={line} delay={(index + 1) * zoomDelay}>
                  <Typography variant="body1" textAlign="center">
                    {t(`dashboard:sections.gameInfo.${line}`)}
                  </Typography>
                </ZoomEnter>
              ),
            )}
            {!auth.user && (
              <Stack mt={2} spacing={1} alignItems="center">
                <ZoomEnter delay={zoomDelay * 5}>
                  <Typography variant="body2">
                    {t('dashboard:logInInvitation')}
                  </Typography>
                </ZoomEnter>
                <ZoomEnter delay={zoomDelay * 6}>
                  <Grid2 container spacing={1} width="100%">
                    <Grid2 xs={6}>
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<LoginRounded />}
                        onClick={() => setLoginDialogOpen(true)}
                        fullWidth
                      >
                        {t('common:logIn').toUpperCase()}
                      </Button>
                    </Grid2>
                    <Grid2 xs={6}>
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        startIcon={<PersonAddAlt1Rounded />}
                        onClick={() => navigate(Navigation.REGISTER.path)}
                        fullWidth
                      >
                        {t('common:register').toUpperCase()}
                      </Button>
                    </Grid2>
                  </Grid2>
                </ZoomEnter>
              </Stack>
            )}
          </Stack>
        </Stack>
        <Box
          className={clsx(
            parallaxImageClass,
            css`
              background-image: linear-gradient(
                90deg,
                ${theme.palette.background.default} 0%,
                transparent,
                ${theme.palette.background.default} 100%
              );
            `,
          )}
        >
          <Box sx={{ backgroundImage: `url(${parallaxImage})` }} />
        </Box>
        <Stack
          className={sectionClass}
          sx={{
            backgroundColor: darken(theme.palette.background.default, 0.3),
          }}
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="center"
          p={4}
          gap={4}
        >
          <ZoomEnter delay={zoomDelay * 7}>
            <Box>
              <FeatureCard
                title={t(
                  'dashboard:sections.features.shop.title',
                ).toUpperCase()}
                content={t('dashboard:sections.features.shop.content')}
                iconUrl={cashIcon}
              ></FeatureCard>
            </Box>
          </ZoomEnter>
          <ZoomEnter delay={zoomDelay * 8}>
            <Box>
              <FeatureCard
                title={t(
                  'dashboard:sections.features.socialChat.title',
                ).toUpperCase()}
                content={t('dashboard:sections.features.socialChat.content')}
                iconUrl={socialIcon}
              />
            </Box>
          </ZoomEnter>
          <ZoomEnter delay={zoomDelay * 9}>
            <Box>
              <FeatureCard
                title={t(
                  'dashboard:sections.features.rankings.title',
                ).toUpperCase()}
                content={t('dashboard:sections.features.rankings.content')}
                iconUrl={podiumIcon}
              />
            </Box>
          </ZoomEnter>
        </Stack>
      </Stack>
      <LoginDialog
        open={loginDialogOpen && !auth.user}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  )
}

export default DashboardPage
