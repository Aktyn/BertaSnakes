import { Stack, Container } from '@mui/material'
import { Footer } from './Footer'
import { InfoBar } from './InfoBar'
import { PageHeader } from './PageHeader'

const PageLayout: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  return (
    <Stack height="100vh">
      <PageHeader />
      <InfoBar />
      <Container
        disableGutters
        maxWidth={false}
        sx={{
          flexGrow: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
          perspective: '8px',
          perspectiveOrigin: 'center',
        }}
      >
        {children}
      </Container>
      <Footer />
    </Stack>
  )
}

export default PageLayout
