import type { InitOptions } from 'i18next'

export const i18nConfig: InitOptions = {
  fallbackLng: 'en',
  ns: [
    'global',
    'error',
    'validation',
    'common',
    'dialog',
    'dashboard',
    'register',
    'emailConfirmation',
  ],
  defaultNS: 'global',
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  detection: {
    order: [
      'querystring',
      'path',
      'subdomain',
      'localStorage',
      'sessionStorage',
      'cookie',
      'navigator',
      'htmlTag',
    ],
    caches: [],
  },
}
