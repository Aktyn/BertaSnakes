import type { ReactNode } from 'react'
import { css } from '@emotion/css'
import {
  Card,
  darken,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'

interface FeatureCardProps {
  title: ReactNode
  content: ReactNode
  iconUrl: string
}

const featureClass = css`
  max-width: 518px;
  height: 320px;

  & img {
    width: 128px;
    height: 128px;
    max-width: 100%;
    max-height: 100%;
  }
`

export const FeatureCard = ({ title, content, iconUrl }: FeatureCardProps) => {
  const theme = useTheme()

  return (
    <Card
      className={featureClass}
      sx={{
        backgroundColor: darken(theme.palette.background.default, 0.1),
      }}
      elevation={4}
    >
      <CardContent sx={{ minHeight: '100%' }}>
        <Stack
          gap={2}
          alignItems="center"
          justifyContent="center"
          sx={{ height: '100%' }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            sx={{ fontFamily: "'Luckiest Guy', Roboto;'" }}
          >
            {title}
          </Typography>
          <Typography variant="body1" textAlign="justify">
            {content}
          </Typography>
          <img src={iconUrl} />
        </Stack>
      </CardContent>
    </Card>
  )
}
