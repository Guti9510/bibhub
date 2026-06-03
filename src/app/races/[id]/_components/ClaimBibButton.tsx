'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'

interface Props {
  transferId: string
  sellerName: string
  isLoggedIn: boolean
  isAlreadyRegistered: boolean
  isOwnListing: boolean
  raceId: string
}

export default function ClaimBibButton({
  transferId,
  sellerName,
  isLoggedIn,
  isAlreadyRegistered,
  isOwnListing,
  raceId,
}: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const tb = t.bibTransfer

  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    return (
      <a
        href={`/auth/login?next=/races/${raceId}`}
        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
      >
        {tb.loginToClaimBib}
      </a>
    )
  }

  if (isOwnListing) {
    return (
      <span className="block w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-xs font-medium text-gray-400">
        {tb.cannotClaimOwn}
      </span>
    )
  }

  if (isAlreadyRegistered) {
    return (
      <span className="block w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-xs font-medium text-gray-400">
        {tb.alreadyRegistered}
      </span>
    )
  }

  if (done) {
    return (
      <span className="block w-full rounded-lg bg-green-100 px-4 py-2 text-center text-xs font-semibold text-green-700">
        ✓ {tb.transferComplete}
      </span>
    )
  }

  async function handleClaim() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/bibs/${transferId}/claim`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setConfirming(false)
      return
    }

    setDone(true)
    router.refresh()
    setTimeout(() => router.push('/dashboard/athlete/registrations'), 1800)
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-600">{tb.claimBibDetail(sellerName)}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? tb.claiming : tb.claimBibConfirm}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null) }}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && <p className="mb-1 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
      >
        {tb.claimBib}
      </button>
    </>
  )
}
