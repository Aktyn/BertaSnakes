import { css } from '@emotion/css'
import { alpha, Box, darken, Stack, useTheme } from '@mui/material'
import { cyan, red } from '@mui/material/colors'
import { useNavigate } from 'react-router-dom'
import headerBackground from '../../img/graphics5.webp'
import { PlayButton } from '../components/PlayButton'
import Navigation from '../navigation'

export const PageHeader = ({ compact }: { compact?: boolean }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  //TODO: responsive navigation; entry redirecting to ranking page, gallery page etc

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      className={css`
        background-color: ${darken(theme.palette.background.default, 0.4)};
        background-image: url(${headerBackground});
        background-size: cover;
        background-position: center 85%;
        position: relative;
      `}
    >
      <Box
        className={css`
          position: absolute;
          left: 0;
          top: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(
            150deg,
            ${alpha(cyan[400], 0.35)} 30%,
            transparent,
            ${alpha(red[400], 0.35)} 70%
          );
        `}
      />
      <Box
        className={css`
          position: absolute;
          left: 0;
          top: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: linear-gradient(
            0deg,
            ${darken(theme.palette.background.default, 0.4)},
            transparent 75%
          );
        `}
      />
      <PlayButton
        size={compact ? 96 : 192}
        borderWidth={compact ? 12 : 24}
        onClick={() => navigate(Navigation.PLAY.path)}
      />
    </Stack>
  )
}
