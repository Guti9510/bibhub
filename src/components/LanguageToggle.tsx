'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { LOCALE_COOKIE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

export default function LanguageToggle() {
  const { locale } = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className={`flex items-center gap-0.5 rounded-full border border-white/30 bg-white/10 p-0.5 backdrop-blur-sm text-xs font-semibold ${isPending ? 'opacity-60' : ''}`}>
      <button
        onClick={() => switchTo('en')}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'en'
            ? 'bg-white text-gray-800'
            : 'text-white/70 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchTo('es')}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'es'
            ? 'bg-white text-gray-800'
            : 'text-white/70 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  )
}

/** A variant with dark styling for use on white backgrounds (sidebar, dashboards). */
export function LanguageToggleDark() {
  const { locale } = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className={`flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-100 p-0.5 text-xs font-semibold ${isPending ? 'opacity-60' : ''}`}>
      <button
        onClick={() => switchTo('en')}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'en'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchTo('es')}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === 'es'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-400 hover:text-gray-700'
        }`}
      >
        ES
      </button>
    </div>
  )
}
