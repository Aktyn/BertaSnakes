import React, { Suspense, useState } from 'react'
import {
  CssBaseline,
  GlobalStyles,
  lighten,
  ThemeProvider,
} from '@mui/material'
import ReactDOM from 'react-dom/client'
import { PageLoader } from './app/components/loaders/PageLoader'
import { defaultTheme } from './app/themes/default'
import { i18nConfig } from './configs/i18n.config'
import i18n, { initializeI18n } from './i18n'

import '@fontsource/roboto/100.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/luckiest-guy'

initializeI18n(i18nConfig).then(
  (_t) => {
    // Initialize other functionality with loaded translations
  },
  (error: Error | string) => {
    // eslint-disable-next-line no-console
    console.error(error)
  },
)

const LocaleAppProvider = React.memo(() => {
  const [initialized, setInitialized] = useState(false)
  i18n.on('initialized', () => {
    setInitialized(true)
  })

  const App = React.lazy(() => import('./app/App'))

  if (initialized) {
    return (
      <React.StrictMode>
        <ThemeProvider theme={defaultTheme}>
          <CssBaseline />
          <GlobalStyles
            styles={{
              body: {
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              },
              // Hack for disabling error overlay
              iframe: {
                display:
                  process.env.NODE_ENV === 'development' ? 'none' : 'initial',
              },

              // Scrollbars sizes
              '::-webkit-scrollbar': {
                width: 8,
                height: 6,
              },
              // Scrollbars track
              '::-webkit-scrollbar-track': {
                backgroundColor: defaultTheme.palette.background.default,
              },
              // Scrollbars handle
              '::-webkit-scrollbar-thumb': {
                backgroundColor: lighten(
                  defaultTheme.palette.background.default,
                  0.25,
                ),
                borderRadius: 8,
              },
              // Scrollbars handle on hover
              '::-webkit-scrollbar-thumb:hover': {
                backgroundColor: lighten(
                  defaultTheme.palette.background.default,
                  0.5,
                ),
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <App />
          </Suspense>
        </ThemeProvider>
      </React.StrictMode>
    )
  }
  return null
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<LocaleAppProvider />)
