import { Backdrop, CircularProgress } from '@mui/material'

export const PageLoader = () => {
  return (
    <Backdrop sx={{ color: '#fff', zIndex: 999 }} open>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}
