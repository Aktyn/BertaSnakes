import { CheckRounded, CloseRounded } from '@mui/icons-material'
import { Box } from '@mui/material'
import { lightGreen, red } from '@mui/material/colors'

export const BooleanValue = ({ children: value }: { children: boolean }) => {
  return (
    <Box component="span" sx={{ color: value ? lightGreen[300] : red[300] }}>
      {value ? (
        <CheckRounded color="inherit" />
      ) : (
        <CloseRounded color="inherit" />
      )}
    </Box>
  )
}
