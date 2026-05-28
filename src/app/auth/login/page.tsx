'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-indigo-600 p-12">
        <div>
          <span className="text-2xl font-bold text-white">BibHub</span>
        </div>
        <div>
          <blockquote className="text-xl font-medium leading-relaxed text-indigo-100">
            "The fastest way to go from race idea to sold-out registrations."
          </blockquote>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {features.map(f => (
              <div key={f.label} className="rounded-xl bg-indigo-500/40 p-4">
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="mt-1 text-xs text-indigo-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-indigo-300">&copy; {new Date().getFullYear()} BibHub</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-2 lg:hidden">
            <span className="text-xl font-bold text-indigo-600">BibHub</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Sign in to BibHub</h1>
          <p className="mt-2 text-sm text-gray-500">
            New athlete?{' '}
            <Link href="/auth/athlete/signup" className="font-medium text-indigo-600 hover:underline">
              Create a free account
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="you@organization.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

const features = [
  { label: 'Wave management', desc: 'Define custom start waves per event' },
  { label: 'Live registrations', desc: 'Track sign-ups and capacity in real time' },
  { label: 'Stripe payments', desc: 'Collect entry fees with automatic payouts' },
  { label: 'Multi-sport', desc: 'Run, cycle, swim — one platform' },
]
