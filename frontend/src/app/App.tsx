import { useEffect } from 'react'
import { SnackbarProvider } from 'notistack'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { basename } from '../configs/common.config'
import websocketService from '../services/websocket.service'
import Navigation, { Layouts } from './navigation'
import { UnknownRoute } from './pages/UnknownRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

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
      <SnackbarProvider maxSnack={24}>
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
                  {Object.values(Navigation).map((route) => {
                    const Layout = route.layout ?? Layouts.DEFAULT

                    return (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <Layout>
                            <route.component />
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
      </SnackbarProvider>
    </QueryClientProvider>
  )
}

export default App
