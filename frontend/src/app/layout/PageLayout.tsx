import { useState } from 'react'
import { Stack, Container } from '@mui/material'
import { useLocation } from 'react-router-dom'
import Navigation from '../navigation'
import { Footer } from './Footer'
import { InfoBar } from './InfoBar'
import { PageHeader } from './PageHeader'

const SCROLL_THRESHOLD = 128

const PageLayout: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const location = useLocation()

  const [compactHeader, setCompactHeader] = useState(false)

  return (
    <Stack height="100vh">
      <PageHeader
        compact={
          compactHeader || location.pathname !== Navigation.DASHBOARD.path
        }
      />
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
        onScroll={(e) => {
          if (!compactHeader) {
            setCompactHeader(e.currentTarget.scrollTop > SCROLL_THRESHOLD)
          } else if (e.currentTarget.scrollTop <= 0) {
            setCompactHeader(false)
          }
        }}
      >
        {children}
      </Container>
      <Footer />
    </Stack>
  )
}

export default PageLayout
