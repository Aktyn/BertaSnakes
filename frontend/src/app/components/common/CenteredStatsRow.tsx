import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface CenteredStatsRowProps {
  label: ReactNode
  value: ReactNode
}

export const CenteredStatsRow = ({ label, value }: CenteredStatsRowProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 1,
        '& > *': {
          width: '50%',
          whiteSpace: 'nowrap',
        },
      }}
    >
      <Typography
        variant="body2"
        sx={{
          textAlign: 'right',
          justifySelf: 'flex-end',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight="bold"
        sx={{
          textAlign: 'left',
          justifySelf: 'flex-start',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}
