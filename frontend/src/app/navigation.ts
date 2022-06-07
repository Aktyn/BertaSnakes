import type { FC, LazyExoticComponent, ReactNode } from 'react'
import { lazy } from 'react'

interface RouteSchema {
  path: string
  component: LazyExoticComponent<() => JSX.Element>
  layout?: LazyExoticComponent<
    FC<{
      children?: ReactNode
    }>
  >
}

export const Layouts = {
  DEFAULT: lazy(() => import('./layout/PageLayout')),
  PLAY: lazy(() => import('./layout/PlayLayout')),
}

const Routes = {
  DASHBOARD: {
    path: '/dashboard',
    component: lazy(() => import('./pages/dashboard/DashboardPage')),
  },
  PLAY: {
    path: '/play',
    component: lazy(() => import('./pages/play/PlayPage')),
    layout: Layouts.PLAY,
  },
}

const Navigation: Record<keyof typeof Routes | 'DEFAULT_PAGE', RouteSchema> = {
  ...Routes,
  DEFAULT_PAGE: Routes.DASHBOARD,
}

export default Navigation
