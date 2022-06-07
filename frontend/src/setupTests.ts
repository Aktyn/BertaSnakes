import '@testing-library/jest-dom'
import type { TypedTFunction } from './i18n'

jest.mock('i18next', () => {
  return {
    __esModule: true,
    default: {
      t: (str: string) => str,
    },
  }
})

jest.mock('react-i18next', () => {
  const t: TypedTFunction = (str: string) => str

  return {
    __esModule: true,
    useTranslation: () => {
      return [
        t,
        {
          changeLanguage: () => new Promise(() => void 0),
        },
      ]
    },
    default: {
      t,
    },
  }
})
