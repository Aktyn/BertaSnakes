/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  i18n as i18nInterface,
  InitOptions,
  StringMap,
  TOptions,
} from 'i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

export interface NsTypes {
  global: typeof import('../public/locales/en/global.json')
  error: typeof import('../public/locales/en/error.json')
  common: typeof import('../public/locales/en/common.json')
  dashboard: typeof import('../public/locales/en/dashboard.json')
}

type Separator<Key, Condition> = Condition extends number
  ? '.'
  : Key extends keyof NsTypes
  ? ':'
  : '.'
type KeyofKey<T> = Exclude<keyof T, keyof any[]>
type PathImpl<T, Key extends keyof T, Condition = string> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
        | `${Key}${Separator<Key, Condition>}${PathImpl<
            T[Key],
            KeyofKey<T[Key]>,
            Key extends keyof NsTypes
              ? number
              : Condition extends number
              ? number
              : string
          > &
            string}`
        | `${Key}${Separator<Key, Condition>}${KeyofKey<T[Key]> & string}`
    : never
  : never
type PathImpl2<T> = PathImpl<T, keyof T> | keyof T
type Path<T> = PathImpl2<T> extends string | keyof T ? PathImpl2<T> : keyof T

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IgnoredNamespaces {}

type IgnoredNamespacesType = `${keyof IgnoredNamespaces}:${string}`

//@ts-ignore
export type KeyType = Path<NsTypes['global']> | Path<NsTypes>

type PathValue<T, P extends Path<T>> = P extends `${infer Key}${
  | '.'
  | ':'}${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never

//@ts-ignore
export type TranslationFrom<T extends KeyType = KeyType> = Path<
  PathValue<NsTypes & NsTypes['global'], T>
>

export function partialTranslate<PartType extends KeyType>(
  keyPart: PartType,
  separator: '.' | ':' = '.',
) {
  return (
    rest: TranslationFrom<PartType>,
    options?: string | TOptions<StringMap>,
  ) => i18n.t(`${keyPart}${separator}${String(rest)}`, options)
}

export type TypedTFunction = <T extends KeyType = KeyType>(
  key: T | IgnoredNamespacesType,
  options?: TOptions,
) => string

declare module 'react-i18next' {
  export function useTranslation(
    ns?: Namespace,
    options?: UseTranslationOptions,
  ): [TypedTFunction, i18nInterface]
}

declare module 'i18next' {
  export interface i18nInterface {
    t: TypedTFunction
  }
}

interface i18nTyped extends Omit<i18nInterface, 't'> {
  t: TypedTFunction
}

export function initializeI18n(i18nConfig: InitOptions) {
  i18n.t = i18n.t.bind(i18n)
  return i18n
    .use(initReactI18next as any)
    .use(LanguageDetector)
    .use(Backend)
    .init(i18nConfig)
}

export default i18n as i18nTyped
