import type { FC, LazyExoticComponent, ReactNode } from 'react'
import { lazy } from 'react'

export type RoutePath = typeof Routes[keyof typeof Routes]['path']

interface RouteSchema {
  path: RoutePath
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
  REGISTER: {
    path: '/register',
    component: lazy(() => import('./pages/register/RegisterPage')),
  },
  REGISTER_SUCCESS: {
    path: '/register-success',
    component: lazy(() => import('./pages/register/RegisterSuccessPage')),
  },
  CONFIRM_EMAIL: {
    path: '/confirm-email',
    component: lazy(
      () => import('./pages/emailConfirmation/EmailConfirmationPage'),
    ),
  },
  PLAY: {
    path: '/play',
    component: lazy(() => import('./pages/play/PlayPage')),
    layout: Layouts.PLAY,
  },
  PLAYERS: {
    path: '/players',
    component: lazy(() => import('./pages/players/PlayersPage')),
  },
  GALLERY: {
    path: '/gallery',
    component: lazy(() => import('./pages/gallery/GalleryPage')),
  },
} as const

const Navigation: Record<keyof typeof Routes | 'DEFAULT_PAGE', RouteSchema> = {
  ...Routes,
  DEFAULT_PAGE: Routes.DASHBOARD,
}

export default Navigation
