import { css } from '@emotion/css'
import { alpha, Box, darken, Stack, Typography, useTheme } from '@mui/material'
import { cyan, red } from '@mui/material/colors'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import parallaxImage from '../../../img/graphics3.jpg'
import articleBackgroundGraphic from '../../../img/graphics4.webp'
import cashIcon from '../../../img/icons/money.png'
import podiumIcon from '../../../img/icons/podium.svg'
import socialIcon from '../../../img/icons/social.svg'
import { FeatureCard } from './FeatureCard'

const sectionClass = css`
  min-height: 256px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  z-index: 0;
  box-shadow: 0 4px 8px #0006;
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

  return (
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
            background-color: ${darken(theme.palette.background.default, 0.3)};
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
          <Typography
            variant="h3"
            sx={{ fontFamily: "'Luckiest Guy', Roboto;'" }}
          >
            {t('global:projectName')}
          </Typography>
          <Typography variant="body1">
            {t('dashboard:sections.gameInfo.line1')}
          </Typography>
          <Typography variant="body1">
            {t('dashboard:sections.gameInfo.line2')}
          </Typography>
          <Typography variant="body1">
            {t('dashboard:sections.gameInfo.line3')}
          </Typography>
          <Typography variant="body1">
            {t('dashboard:sections.gameInfo.line4')}
          </Typography>
          {/* TODO {!this.state.account && (
            <>
              <label>Log in now to get access to all features</label>
              <button
                style={offsetTop}
                onClick={() => {
                  this.setState({ show_login_panel: true })
                }}
              >
                LOG IN
              </button>
            </>
          )} */}
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
        <FeatureCard
          title={t('dashboard:sections.features.shop.title').toUpperCase()}
          content={t('dashboard:sections.features.shop.content')}
          iconUrl={cashIcon}
        />
        <FeatureCard
          title={t(
            'dashboard:sections.features.socialChat.title',
          ).toUpperCase()}
          content={t('dashboard:sections.features.socialChat.content')}
          iconUrl={socialIcon}
        />
        <FeatureCard
          title={t('dashboard:sections.features.rankings.title').toUpperCase()}
          content={t('dashboard:sections.features.rankings.content')}
          iconUrl={podiumIcon}
        />
      </Stack>
    </Stack>
  )
}

export default DashboardPage
