import { Stack } from '@mui/material'

const PlayLayout: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  return <Stack height="100vh">{children}</Stack>
}

export default PlayLayout
