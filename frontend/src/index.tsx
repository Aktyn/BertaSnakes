import React, { Suspense, useEffect, useState } from 'react'
import type { GlobalStylesProps } from '@mui/material'
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
import { waitForFontLoad } from './utils/common'

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

const App = React.lazy(() => import('./app/App'))

const globalStyles: GlobalStylesProps['styles'] = {
  body: {
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  // Hack for disabling error overlay
  iframe: {
    display: process.env.NODE_ENV === 'development' ? 'none' : 'initial',
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
    backgroundColor: lighten(defaultTheme.palette.background.default, 0.25),
    borderRadius: 8,
  },
  // Scrollbars handle on hover
  '::-webkit-scrollbar-thumb:hover': {
    backgroundColor: lighten(defaultTheme.palette.background.default, 0.5),
  },
}

const LocaleAppProvider = React.memo(() => {
  const [initialized, setInitialized] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    i18n.on('initialized', () => {
      setInitialized(true)
    })
    const start = performance.now()
    Promise.all([waitForFontLoad('Roboto'), waitForFontLoad('Luckiest Guy')])
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err)
      })
      .finally(() => {
        // eslint-disable-next-line no-console
        console.log(`Fonts loaded in ${performance.now() - start}ms`)
        setFontLoaded(true)
      })
  }, [])

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <Suspense fallback={<PageLoader />}>
        {initialized && fontLoaded && <App key="app" />}
      </Suspense>
    </ThemeProvider>
  )
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<LocaleAppProvider />)
