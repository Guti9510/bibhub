'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'

type TransferType = 'sell' | 'swap' | 'gift'

interface Props {
  registrationId: string
  activeListing: { id: string; transfer_type: string; asking_price: number | null; message: string | null } | null
  canSwap: boolean
}

export default function BibActions({ registrationId, activeListing, canSwap }: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const tb = t.bibTransfer

  const [open, setOpen] = useState(false)
  const [transferType, setTransferType] = useState<TransferType>('gift')
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handleList(e: React.FormEvent) {
    e.preventDefault()
    if (transferType === 'sell' && (!price || parseFloat(price) <= 0)) {
      setError(tb.priceRequired)
      return
    }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/bibs/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_id: registrationId,
        transfer_type: transferType,
        asking_price: transferType === 'sell' ? parseFloat(price) : null,
        message: message || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      return
    }

    setOpen(false)
    setPrice('')
    setMessage('')
    showToast(tb.listingCreatedSuccess)
    router.refresh()
  }

  async function handleCancel() {
    if (!activeListing) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/bibs/${activeListing.id}/cancel`, {
      method: 'DELETE',
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
      return
    }

    showToast(tb.listingCancelledSuccess)
    router.refresh()
  }

  const typeOptions: { value: TransferType; label: string; desc: string; disabled?: boolean }[] = [
    { value: 'gift', label: tb.gift, desc: tb.giftDesc },
    { value: 'sell', label: tb.sell, desc: tb.sellDesc },
    { value: 'swap', label: tb.swap, desc: canSwap ? tb.swapDesc : tb.swapOnlyMultiDistance, disabled: !canSwap },
  ]

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {/* Toast */}
      {toast && (
        <div className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          {toast}
        </div>
      )}

      {/* Active listing badge */}
      {activeListing && !open && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700">{tb.listingActive}</span>
            {activeListing.asking_price && (
              <span className="text-xs text-amber-600">· ${Number(activeListing.asking_price).toFixed(2)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {loading ? tb.cancelling : tb.cancelListing}
          </button>
        </div>
      )}

      {/* List bib button */}
      {!activeListing && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {tb.transferBib}
        </button>
      )}

      {/* Listing form */}
      {open && (
        <form onSubmit={handleList} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">{tb.listYourBib}</h3>

          {/* Transfer type */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">{tb.transferType}</p>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => !opt.disabled && setTransferType(opt.value)}
                  disabled={opt.disabled}
                  className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                    opt.disabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                      : transferType === opt.value
                        ? 'border-indigo-500 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className={`text-xs font-bold ${opt.disabled ? 'text-gray-400' : transferType === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-gray-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price (sell only) */}
          {transferType === 'sell' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">{tb.askingPrice}</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={tb.askingPricePlaceholder}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">{tb.message}</label>
            <textarea
              rows={2}
              placeholder={tb.messagePlaceholder}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? tb.listing : tb.listBib}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
