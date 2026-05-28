'use client'

import { createContext, useContext } from 'react'
import type { Locale } from './index'
import type { Translations } from './locales/en'
import en from './locales/en'
import es from './locales/es'

interface LocaleContextValue {
  locale: Locale
  t: Translations
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  t: en,
})

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = locale === 'es' ? es : en
  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
