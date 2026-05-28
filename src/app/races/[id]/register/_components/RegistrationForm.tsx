'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SPORT_META: Record<string, { emoji: string; label: string }> = {
  running:  { emoji: '🏃', label: 'Running' },
  cycling:  { emoji: '🚴', label: 'Cycling' },
  swimming: { emoji: '🏊', label: 'Swimming' },
}

interface Props {
  raceId: string
  raceName: string
  raceDate: string
  raceLocation: string
  raceDistance: number
  raceSportType: string
  racePrice: number
  hasWaves: boolean
  waveOptions: string[]
  shirtSizes: string[]
  athleteName: string
  athleteEmail: string
  athletePhone: string
}

export default function RegistrationForm({
  raceId,
  raceName,
  raceDate,
  raceLocation,
  raceDistance,
  raceSportType,
  racePrice,
  hasWaves,
  waveOptions,
  shirtSizes,
  athleteName,
  athleteEmail,
  athletePhone,
}: Props) {
  const router = useRouter()
  const [wave, setWave] = useState('')
  const [shirtSize, setShirtSize] = useState('')
  const [finishTime, setFinishTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = SPORT_META[raceSportType] ?? { emoji: '🏁', label: raceSportType }
  const raceDateTime = new Date(raceDate)
  const isFree = racePrice === 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isFree) {
      const res = await fetch('/api/register/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          race_id: raceId,
          wave: wave || null,
          shirt_size: shirtSize || null,
          expected_finish_time: finishTime || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/races/${raceId}/register/success?rid=${data.id}`)
      return
    }

    // Paid race → Stripe Checkout
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: raceId,
        wave: wave || null,
        shirt_size: shirtSize || null,
        expected_finish_time: finishTime || null,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error ?? 'Could not start checkout. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = data.url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">BibHub</Link>
          <Link href={`/races/${raceId}`} className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to race
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <span className="text-sm text-gray-400">{meta.emoji} {meta.label}</span>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{raceName}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {raceDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}
            {raceLocation}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── Left: form fields ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Athlete info (read-only) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Your info</h2>
                  <Link href="/dashboard/athlete/profile" className="text-xs text-indigo-600 hover:underline">
                    Edit profile
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Name" value={athleteName} />
                  <ReadOnlyField label="Email" value={athleteEmail} />
                  {athletePhone && <ReadOnlyField label="Phone" value={athletePhone} />}
                </div>
              </div>

              {/* Wave selection */}
              {hasWaves && waveOptions.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Start wave</h2>
                  <div className="flex flex-wrap gap-2">
                    {waveOptions.map((w, i) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWave(wave === w ? '' : w)}
                        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                          wave === w
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                          {i + 1}
                        </span>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shirt size */}
              {shirtSizes.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Shirt size</h2>
                  <div className="flex flex-wrap gap-2">
                    {shirtSizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setShirtSize(shirtSize === size ? '' : size)}
                        className={`flex h-11 w-14 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                          shirtSize === size
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected finish time */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Expected finish time
                  <span className="ml-2 text-xs font-normal normal-case text-gray-400">optional</span>
                </h2>
                <input
                  type="text"
                  value={finishTime}
                  onChange={e => setFinishTime(e.target.value)}
                  placeholder="e.g. 2:30:00"
                  pattern="^\d+:[0-5]\d:[0-5]\d$"
                  title="Format: H:MM:SS (e.g. 2:30:00)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
                />
                <p className="mt-1.5 text-xs text-gray-400">Format: H:MM:SS</p>
              </div>
            </div>

            {/* ── Right: order summary ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Order summary</h2>

                <div className="space-y-3 text-sm">
                  <SummaryRow label={raceName} value={isFree ? 'Free' : `$${racePrice.toFixed(2)}`} bold />
                  <SummaryRow label="Distance" value={`${raceDistance} km`} />
                  <SummaryRow
                    label="Date"
                    value={raceDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  />
                  {wave && <SummaryRow label="Wave" value={wave} />}
                  {shirtSize && <SummaryRow label="Shirt" value={shirtSize} />}
                </div>

                <div className="my-4 border-t border-gray-100" />

                <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                  <span>Total</span>
                  <span>{isFree ? 'Free' : `$${racePrice.toFixed(2)}`}</span>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? 'Please wait…'
                    : isFree
                      ? 'Complete registration'
                      : `Pay $${racePrice.toFixed(2)}`}
                </button>

                <p className="mt-3 text-center text-xs text-gray-400">
                  {isFree
                    ? 'No payment required'
                    : 'Secure payment via Stripe'}
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-2 ${bold ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}
