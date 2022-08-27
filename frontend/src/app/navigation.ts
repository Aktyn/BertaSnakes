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
}

const Navigation: Record<keyof typeof Routes | 'DEFAULT_PAGE', RouteSchema> = {
  ...Routes,
  DEFAULT_PAGE: Routes.DASHBOARD,
}

export default Navigation
