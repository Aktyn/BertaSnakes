import type { InitOptions } from 'i18next'

export const i18nConfig: InitOptions = {
  fallbackLng: 'en',
  ns: ['global', 'error', 'common', 'dashboard'],
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
