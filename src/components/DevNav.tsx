'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  {
    label: 'Public',
    color: 'text-sky-600',
    routes: [
      { label: 'Home', href: '/' },
      { label: 'Race calendar', href: '/races' },
      { label: 'Bib Marketplace', href: '/bibs' },
    ],
  },
  {
    label: 'Forms — Organizer',
    color: 'text-violet-600',
    routes: [
      { label: 'Sign up (organizer)', href: '/auth/signup' },
      { label: 'Sign in', href: '/auth/login' },
      { label: 'New race form', href: '/dashboard/organizer/races/new' },
    ],
  },
  {
    label: 'Forms — Athlete',
    color: 'text-pink-600',
    routes: [
      { label: 'Sign up (athlete)', href: '/auth/athlete/signup' },
      { label: 'Complete profile', href: '/dashboard/athlete/profile' },
      { label: 'Register for a race', href: '/races' },
    ],
  },
  {
    label: 'Organizer',
    color: 'text-indigo-600',
    routes: [
      { label: 'Dashboard', href: '/dashboard/organizer' },
      { label: 'My races', href: '/dashboard/organizer/races' },
    ],
  },
  {
    label: 'Athlete',
    color: 'text-emerald-600',
    routes: [
      { label: 'Dashboard', href: '/dashboard/athlete' },
      { label: 'My registrations', href: '/dashboard/athlete/registrations' },
      { label: 'Profile', href: '/dashboard/athlete/profile' },
    ],
  },
]

export default function DevNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] select-none print:hidden">
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="mb-3 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="bg-gray-950 px-4 py-2.5">
              <p className="text-xs font-bold tracking-wide text-white">⚙ Dev Navigator</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{pathname}</p>
            </div>

            {/* Links */}
            <div className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto">
              {SECTIONS.map(section => (
                <div key={section.label} className="pb-1">
                  <p className={`px-4 pt-2.5 pb-1 text-xs font-bold ${section.color}`}>
                    {section.label}
                  </p>
                  {section.routes.map(route => {
                    const active = pathname === route.href
                    return (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2 px-5 py-1.5 text-xs transition-colors ${
                          active
                            ? 'bg-indigo-50 font-semibold text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        )}
                        {!active && <span className="h-1.5 w-1.5 shrink-0" />}
                        {route.label}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2 text-center">
              <p className="text-xs text-gray-400">Dev only — remove before launch</p>
            </div>
          </div>
        </>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Dev navigation"
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-2 ring-white transition-all ${
          open ? 'bg-gray-950 rotate-45' : 'bg-gray-950 hover:bg-gray-800'
        }`}
      >
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>
    </div>
  )
}
