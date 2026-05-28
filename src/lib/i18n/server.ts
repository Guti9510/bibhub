// Server-only i18n helper. Only import this in Server Components.
import { cookies } from 'next/headers'
import type { Locale } from './index'
import { DEFAULT_LOCALE, LOCALE_COOKIE } from './index'

/** Read the current locale from the cookie (Server Components only). */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE)?.value
  return (value === 'es' || value === 'en') ? value : DEFAULT_LOCALE
}
