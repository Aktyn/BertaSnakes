import { Zoom } from '@mui/material'
import { smoothBezier } from '../../../utils/common'

export const ZoomEnter: React.FC<{
  delay?: number
  duration?: number
  children: React.ReactElement
}> = ({ children, duration = 500, delay = 0 }) => {
  return (
    <Zoom
      in
      appear
      easing={smoothBezier}
      timeout={duration}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Zoom>
  )
}
