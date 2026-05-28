// Shared i18n utilities — safe to import in both Server and Client Components.
// Do NOT import 'next/headers' here.
import en from './locales/en'
import es from './locales/es'
import type { Translations } from './locales/en'

export type Locale = 'en' | 'es'
export const LOCALES: Locale[] = ['en', 'es']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'bibhub_locale'

/** Return the translation dictionary for the given locale. */
export function getT(locale: Locale): Translations {
  return locale === 'es' ? es : en
}

export type { Translations }
