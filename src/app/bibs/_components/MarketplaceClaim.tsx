'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'

interface SwapOption {
  id: string        // registration id
  race_id: string
  distance: number
  name: string
}

interface Props {
  transferId: string
  transferType: 'sell' | 'swap' | 'gift'
  askingPrice: number | null
  sellerName: string
  raceName: string
  raceDistance: string
  isLoggedIn: boolean
  isMyListing: boolean
  swapOptions: SwapOption[]
  locale: string
}

export default function MarketplaceClaim({
  transferId, transferType, askingPrice, sellerName,
  raceName, raceDistance, isLoggedIn, isMyListing, swapOptions, locale,
}: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const tb = t.bibTransfer

  const [state, setState] = useState<'idle' | 'confirming' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedSwapReg, setSelectedSwapReg] = useState<string>(swapOptions[0]?.id ?? '')

  const distanceLabel = (km: number) => {
    if (km === 42.2 || km === 42.195) return locale === 'es' ? 'Maratón' : 'Marathon'
    if (km === 21.1 || km === 21.0975) return locale === 'es' ? 'Media' : 'Half'
    return `${km % 1 === 0 ? km : km}K`
  }

  async function handleClaim() {
    setState('loading')
    setErrorMsg('')

    const body: Record<string, unknown> = {}
    if (transferType === 'swap' && selectedSwapReg) {
      body.my_registration_id = selectedSwapReg
    }

    const res = await fetch(`/api/bibs/${transferId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      setState('error')
      setErrorMsg(data.error ?? (locale === 'es' ? 'Algo salió mal.' : 'Something went wrong.'))
      return
    }

    setState('done')
    router.refresh()
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <a
        href="/auth/login"
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        {tb.loginToClaimBib}
      </a>
    )
  }

  // ── My own listing ───────────────────────────────────────────────────────────
  if (isMyListing) {
    return (
      <p className="text-xs text-gray-400 italic">{tb.cannotClaimOwn}</p>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {transferType === 'swap' ? tb.swapSuccess : tb.claimSuccess}
      </p>
    )
  }

  // ── Swap — no eligible registrations ────────────────────────────────────────
  if (transferType === 'swap' && swapOptions.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">{tb.noSwapRegistrations}</p>
    )
  }

  // ── Idle ─────────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    if (transferType === 'swap') {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">{tb.yourSwapBib}</p>
            <select
              value={selectedSwapReg}
              onChange={e => setSelectedSwapReg(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {swapOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {distanceLabel(opt.distance)} — {opt.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setState('confirming')}
            disabled={!selectedSwapReg}
            className="self-end rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {tb.confirmSwap}
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => setState('confirming')}
        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        {tb.claimBib}
      </button>
    )
  }

  // ── Confirming ───────────────────────────────────────────────────────────────
  if (state === 'confirming') {
    const swapRegLabel = swapOptions.find(o => o.id === selectedSwapReg)
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-indigo-900">
          {transferType === 'swap' ? tb.confirmSwap : tb.claimBibConfirm}
        </p>
        <p className="text-sm text-indigo-700">
          {transferType === 'swap'
            ? `You will swap your ${swapRegLabel ? distanceLabel(swapRegLabel.distance) : ''} bib for ${sellerName}'s ${raceDistance} bib. Both transfers are immediate.`
            : tb.claimBibDetail(sellerName)}
        </p>
        {askingPrice && transferType === 'sell' && (
          <p className="text-sm font-semibold text-indigo-800">
            💰 ${Number(askingPrice).toFixed(2)} — {locale === 'es' ? 'coordina el pago directamente con el vendedor.' : 'coordinate payment directly with the seller.'}
          </p>
        )}
        {state === 'error' as unknown && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleClaim}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {locale === 'es' ? 'Sí, confirmar' : 'Yes, confirm'}
          </button>
          <button
            onClick={() => setState('idle')}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <button disabled className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-70">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        {tb.claiming}
      </button>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-red-600">{errorMsg}</p>
      <button onClick={() => setState('idle')} className="text-xs font-medium text-gray-500 hover:text-gray-700">
        {locale === 'es' ? 'Reintentar' : 'Try again'}
      </button>
    </div>
  )
}
