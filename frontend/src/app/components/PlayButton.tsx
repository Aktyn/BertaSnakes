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
          cursor: pointer;
          align-items: center;
          position: relative;

          height: ${size}px;
          width: ${size}px;

          transition: height 0.4s ${smoothBezier} !important;

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
            height: ${size}px;
            width: ${size}px;
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
              transition: color 0.4s ${smoothBezier} !important;
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
        <Typography
          variant="h4"
          className={clsx(
            'inner-text',
            css`
              z-index: 3;
              margin: auto;
              overflow: hidden;
              user-select: none;
              text-align: center;
              white-space: nowrap;
              font-family: 'Luckiest Guy', Roboto !important;
              font-size: 38px !important;
              text-shadow: 0 2px 4px #0006;
              color: ${common.white};
              opacity: ${showText ? 1 : 0};
              transition: color 0.4s ${smoothBezier},
                opacity 0.4s ${smoothBezier} !important;
            `,
          )}
        >
          {t('common:play')}
        </Typography>
        <PlayArrowRounded
          className={clsx(
            'inner-arrow',
            css`
              z-index: 3;
              position: absolute;
              top: 0;
              bottom: 0;
              margin: auto;
              user-select: none;
              filter: drop-shadow(0 2px 2px #0006);
              font-size: ${Math.round(size * 0.618)}px !important;
              color: ${common.white};
              opacity: ${!showText ? 1 : 0};
              transition: color 0.4s ${smoothBezier},
                opacity 0.4s ${smoothBezier} !important;
            `,
          )}
        />
        {clickPosition && (
          <Box
            className={css`
              position: fixed;
              left: ${clickPosition.x}px;
              top: ${clickPosition.y}px;
              z-index: 99;
              width: max(282vh, 282vw);
              height: max(282vh, 282vw);
              border-radius: 100%;
              transform: translate(-50%, -50%) scale(0);

              animation: ${zoomKeyframes} ${transitionDuration}ms ease-in
                forwards;
            `}
          />
        )}
      </Stack>
    </Tooltip>
  )
}
