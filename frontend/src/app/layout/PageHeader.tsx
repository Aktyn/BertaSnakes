import { css } from '@emotion/css'
import type { SvgIconComponent } from '@mui/icons-material'
import { CollectionsRounded, PeopleAltRounded } from '@mui/icons-material'
import { alpha, Box, Button, darken, Stack, useTheme } from '@mui/material'
import { cyan, red } from '@mui/material/colors'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import type { KeyType } from '../../i18n'
import headerBackground from '../../img/graphics5.webp'
import { smoothBezier } from '../../utils/common'
import { PlayButton } from '../components/PlayButton'
import type { RoutePath } from '../navigation'
import Navigation from '../navigation'

interface MenuEntrySchema {
  text: KeyType
  path: RoutePath
  icon: SvgIconComponent
}

const menuEntries: MenuEntrySchema[] = [
  {
    text: 'dashboard:navigationMenu.players',
    path: Navigation.PLAYERS.path,
    icon: PeopleAltRounded,
  },
  {
    text: 'dashboard:navigationMenu.gallery',
    path: Navigation.GALLERY.path,
    icon: CollectionsRounded,
  },
]

const MenuEntry = ({ entry }: { entry: MenuEntrySchema }) => {
  const [t] = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const active = location.pathname === entry.path

  return (
    <Button
      color="primary"
      className={clsx(
        css`
          font-family: 'Luckiest Guy', Roboto !important;
          font-size: 32px !important;
          line-height: 32px !important;
          padding-top: 16px !important;
          padding-left: 16px !important;
          padding-right: 16px !important;

          color: ${alpha(theme.palette.text.primary, 0.75)} !important;
          &:hover {
            color: ${theme.palette.text.primary} !important;
          }

          z-index: 10;
          position: relative;
          &::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 2px;
            border-radius: 2px;
            background-color: ${red[100]};
            transform: scaleX(0);
            transition: transform 0.4s ${smoothBezier};
          }
        `,
        active &&
          css`
            color: ${red[100]} !important;
            &::before {
              transform: scaleX(1);
            }
          `,
      )}
      startIcon={
        <entry.icon sx={{ width: 32, height: 32, marginTop: '-16px' }} />
      }
      onClick={active ? undefined : () => navigate(entry.path)}
      disabled={active}
    >
      {t(entry.text)}
    </Button>
  )
}

export const PageHeader = ({ compact }: { compact?: boolean }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: darken(theme.palette.background.default, 0.4),
        backgroundImage: `url(${headerBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 85%',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: `linear-gradient(
            150deg,
            ${alpha(cyan[400], 0.35)} 30%,
            transparent,
            ${alpha(red[400], 0.35)} 70%
          )`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 2,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          background: `linear-gradient(
            0deg,
            ${darken(theme.palette.background.default, 0.4)},
            transparent 75%
          )`,
        }}
      />
      <Box
        sx={{
          display: 'inline-grid',
          gridTemplateColumns: { xs: 'auto', md: '1fr auto 1fr' },
          gridTemplateRows: { xs: 'repeat(3, auto)', md: 'auto' },
          columnGap: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box>
          {menuEntries.slice(0, (menuEntries.length / 2) | 0).map((entry) => (
            <MenuEntry key={entry.path} entry={entry} />
          ))}
        </Box>
        <PlayButton
          size={compact ? 96 : 192}
          borderWidth={compact ? 12 : 24}
          onClick={() => navigate(Navigation.PLAY.path)}
        />
        <Box>
          {menuEntries.slice((menuEntries.length / 2) | 0).map((entry) => (
            <MenuEntry key={entry.path} entry={entry} />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
