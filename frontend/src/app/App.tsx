import { Suspense, useEffect } from 'react'
import { CircularProgress, Stack } from '@mui/material'
import type { SnackbarOrigin } from 'notistack'
import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { basename } from '../configs/common.config'
import websocketService from '../services/websocket.service'
import { AuthProvider } from './auth/AuthProvider'
import Navigation, { Layouts } from './navigation'
import { UnknownRoute } from './pages/UnknownRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

const navigationRoutes = Object.values(Navigation)
const snackbarOrigin: SnackbarOrigin = { vertical: 'top', horizontal: 'center' }

export const App = () => {
  useEffect(() => {
    if (!location.pathname.startsWith(basename)) {
      location.pathname = basename
    }

    websocketService.connect()

    return () => {
      websocketService.disconnect()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={24} anchorOrigin={snackbarOrigin}>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route
                path="*"
                element={
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to={Navigation.DEFAULT_PAGE.path} />}
                    />
                    {navigationRoutes.map((route) => {
                      const Layout = route.layout ?? Layouts.DEFAULT

                      return (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={
                            <Layout key={route.path}>
                              <Suspense
                                fallback={
                                  <Stack
                                    key={route.path}
                                    p={4}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ width: '100%', height: '100%' }}
                                  >
                                    <CircularProgress color="inherit" />
                                  </Stack>
                                }
                              >
                                <route.component key={route.path} />
                              </Suspense>
                            </Layout>
                          }
                        />
                      )
                    })}
                    <Route path="*" element={<UnknownRoute />} />
                  </Routes>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  )
}

export default App
