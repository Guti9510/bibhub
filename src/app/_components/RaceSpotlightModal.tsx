'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type SpotlightEvent = {
  id: string
  name: string
  location: string
  finishers: number
  men: number
  women: number
}

type Props = {
  event: SpotlightEvent
  locale: string
  spotlightBadge: string
  spotlightCta: string
  spotlightDismiss: string
  men: string
  women: string
  finishersLabel: string
}

export default function RaceSpotlightModal({
  event, locale, spotlightBadge, spotlightCta, spotlightDismiss,
  men, women, finishersLabel,
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const key = `race-spotlight-dismissed-${event.id}`
    if (!sessionStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 900)
      return () => clearTimeout(t)
    }
  }, [event.id])

  const dismiss = () => {
    sessionStorage.setItem(`race-spotlight-dismissed-${event.id}`, '1')
    setOpen(false)
  }

  if (!open) return null

  const menPct   = Math.round((event.men   / event.finishers) * 100)
  const womenPct = 100 - menPct

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors"
        >
          ✕
        </button>

        {/* Header band */}
        <div className="bg-indigo-600 px-6 pb-6 pt-6 text-center">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
            🏆 {spotlightBadge}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight text-white">{event.name}</h2>
          <p className="mt-1 text-sm text-indigo-200">{event.location}</p>
        </div>

        {/* Stats preview */}
        <div className="p-6">
          {/* 3 stat boxes */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900 tabular-nums">
                {(event.finishers / 1000).toFixed(0)}K
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {finishersLabel}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-700 tabular-nums">{menPct}%</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-400">{men}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <p className="text-2xl font-extrabold text-rose-600 tabular-nums">{womenPct}%</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-400">{women}</p>
            </div>
          </div>

          {/* Gender bar */}
          <div className="overflow-hidden rounded-full">
            <div className="flex h-3">
              <div className="bg-blue-500 transition-all" style={{ width: `${menPct}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${womenPct}%` }} />
            </div>
          </div>
          <div className="mt-1.5 mb-5 flex justify-between text-xs text-gray-400">
            <span>5K · 10K · Half · Full</span>
            <span>{locale === 'es' ? '4 distancias' : '4 distances'}</span>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Link
              href={`/events/${event.id}/stats`}
              onClick={dismiss}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {spotlightCta}
            </Link>
            <button
              onClick={dismiss}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {spotlightDismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
