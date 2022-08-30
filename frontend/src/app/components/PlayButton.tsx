import type { MouseEventHandler } from 'react'
import { useMemo, useCallback, useState } from 'react'
import { css, keyframes } from '@emotion/css'
import { HexagonRounded, PlayArrowRounded } from '@mui/icons-material'
import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import { common, lightBlue, red } from '@mui/material/colors'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { smoothBezier } from '../../utils/common'
import { useMounted } from '../hooks/useMounted'

interface PlayButtonProps {
  onClick: () => void
  size?: number
  borderWidth?: number
  transitionDuration?: number
}

export const PlayButton = ({
  onClick,
  size = 192,
  borderWidth = 24,
  transitionDuration = 1000,
}: PlayButtonProps) => {
  const [t] = useTranslation()
  const theme = useTheme()

  const [clickPosition, setClickPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const mounted = useMounted()

  const zoomKeyframes = useMemo(
    () => keyframes`
      from {
        transform: translate(-50%, -50%) scale(0);
        background-color: ${lightBlue[900]};
      }
      to {
        transform: translate(-50%, -50%) scale(1);
        background-color: ${theme.palette.background.default};
      }
    `,
    [theme.palette.background.default],
  )

  const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (clickPosition) {
        return
      }
      setClickPosition({
        x: event.clientX,
        y: event.clientY,
      })

      setTimeout(() => {
        if (!mounted) {
          return
        }
        onClick()
      }, transitionDuration)
    },
    [clickPosition, mounted, onClick, transitionDuration],
  )

  const showText = size >= 128

  return (
    <Tooltip
      arrow
      title={t('common:play')}
      open={showTooltip}
      onClose={() => setShowTooltip(false)}
      onOpen={() => setShowTooltip(!showText)}
    >
      <Stack
        onClick={handleClick}
        alignItems="center"
        justifyContent="center"
        className={css`
          grid-area: play-button;
          cursor: pointer;
          align-items: center;
          position: relative;
          margin: auto;
          overflow: hidden;

          height: ${size}px;
          width: ${size}px;

          transition: height 0.4s ${smoothBezier}, width 0.6s ${smoothBezier} !important;

          &:hover .outer-hexagon,
          &:hover .inner-text,
          &:hover .inner-arrow {
            color: ${red[400]};
          }
          &:hover .inner-hexagon {
            transform: scale(${1 - borderWidth / size});
          }
          .inner-hexagon,
          .outer-hexagon {
            height: 100%;
            width: 100%;
          }
        `}
      >
        <HexagonRounded
          className={clsx(
            'outer-hexagon',
            css`
              z-index: 1;
              position: absolute;
              top: 0;
              bottom: 0;
              margin: auto;
              filter: drop-shadow(0 4px 4px #0006);
              color: ${lightBlue[400]};
              transition: color 0.4s ${smoothBezier},
                height 0.4s ${smoothBezier}, width 0.4s ${smoothBezier} !important;
            `,
          )}
        />
        <HexagonRounded
          className={clsx(
            'inner-hexagon',
            css`
              z-index: 2;
              position: absolute;
              top: 0;
              bottom: 0;
              margin: auto;
              color: ${common.white};
              transform: scale(0);
              transition: transform 0.4s ${smoothBezier} !important;
            `,
          )}
        />
        <Box
          sx={{
            overflow: 'hidden',
            zIndex: 3,
            userSelect: 'none',
            width: '66.6%',
            height: '100%',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Typography
            variant="h4"
            className="inner-text"
            sx={{
              width: 'auto',
              position: 'absolute',
              left: '50%',
              top: '50%',
              overflow: 'hidden',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              fontFamily: '"Luckiest Guy", Roboto',
              fontSize: '38px',
              textShadow: '0 2px 4px #0006',
              color: common.white,
              transform: `translate(${showText ? -50 : -150}%, -50%)`,
              opacity: showText ? 1 : 0,
              transition: `color 0.4s ${smoothBezier},
                  transform 0.4s ${smoothBezier}, opacity 0.4s ${smoothBezier}`,
            }}
          >
            {t('common:play')}
          </Typography>
          <PlayArrowRounded
            className="inner-arrow"
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              margin: 'auto',
              filter: 'drop-shadow(0 2px 2px #0006)',
              color: common.white,
              fontSize: '58px',
              transform: `translate(${showText ? 50 : -50}%, -50%)`,
              opacity: showText ? 0 : 1,
              transition: `color 0.4s ${smoothBezier}, transform 0.4s ${smoothBezier}, opacity 0.4s ${smoothBezier}`,
            }}
          />
        </Box>
        {clickPosition && (
          <Box
            sx={{
              position: 'fixed',
              left: `${clickPosition.x}px`,
              top: `${clickPosition.y}px`,
              zIndex: 99,
              width: 'max(282vh, 282vw)',
              height: 'max(282vh, 282vw)',
              borderRadius: '100%',
              transform: 'translate(-50%, -50%) scale(0)',
              animation: `${zoomKeyframes} ${transitionDuration}ms ease-in
                forwards`,
            }}
          />
        )}
      </Stack>
    </Tooltip>
  )
}
