'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const WAVE_PRESETS = ['Elite', 'Wave A', 'Wave B', 'Wave C', 'Wave D', 'Open']

const SPORTS = [
  { value: 'running', label: 'Running', emoji: '🏃', desc: 'Road, trail, track' },
  { value: 'cycling', label: 'Cycling', emoji: '🚴', desc: 'Road, MTB, gravel' },
  { value: 'swimming', label: 'Swimming', emoji: '🏊', desc: 'Open water, pool' },
] as const

type SportValue = typeof SPORTS[number]['value']

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function NewRacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waveInput, setWaveInput] = useState('')

  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '07:00',
    location: '',
    sport_type: 'running' as SportValue,
    distance: '',
    price: '',
    max_participants: '',
    has_waves: false,
    wave_options: [] as string[],
    has_shirt_sizes: false,
    shirt_sizes: [] as string[],
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  // ── Waves ───────────────────────────────────────────────────────────────────

  function toggleWavePreset(name: string) {
    set('wave_options', form.wave_options.includes(name)
      ? form.wave_options.filter(w => w !== name)
      : [...form.wave_options, name])
  }

  function addCustomWave() {
    const v = waveInput.trim()
    if (v && !form.wave_options.includes(v)) {
      set('wave_options', [...form.wave_options, v])
      setWaveInput('')
    }
  }

  function removeWave(name: string) {
    set('wave_options', form.wave_options.filter(w => w !== name))
  }

  // ── Sizes ───────────────────────────────────────────────────────────────────

  function toggleSize(size: string) {
    set('shirt_sizes', form.shirt_sizes.includes(size)
      ? form.shirt_sizes.filter(s => s !== size)
      : [...form.shirt_sizes, size])
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submit(status: 'draft' | 'published') {
    if (!form.name.trim() || !form.date || !form.location.trim() || !form.distance || !form.max_participants) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.has_shirt_sizes && form.shirt_sizes.length === 0) {
      setError('Select at least one shirt size, or disable the shirt sizes option.')
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: organizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    // Combine date + time into an ISO string the DB accepts as timestamptz
    const datetime = `${form.date}T${form.time || '00:00'}:00`

    const { error: insertError } = await supabase.from('races').insert({
      organizer_id: organizer!.id,
      name: form.name.trim(),
      date: datetime,
      location: form.location.trim(),
      sport_type: form.sport_type,
      distance: parseFloat(form.distance),
      price: parseFloat(form.price) || 0,
      max_participants: parseInt(form.max_participants, 10),
      has_waves: form.has_waves,
      wave_options: form.has_waves ? form.wave_options : [],
      shirt_sizes: form.has_shirt_sizes ? form.shirt_sizes : [],
      status,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/organizer')
    router.refresh()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    // Extra bottom padding so content isn't hidden behind the sticky footer
    <div className="pb-24">
      {/* Breadcrumb header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard/organizer" className="text-gray-400 hover:text-gray-600">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/organizer/races" className="text-gray-400 hover:text-gray-600">Races</Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700">New race</span>
        </nav>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-8 py-8">
        {/* ── Section 1: Race details ── */}
        <Card title="Race details" desc="Basic information about your event">
          <Field label="Race name" required>
            <input
              type="text"
              required
              placeholder="e.g. San José Trail Half Marathon"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inp}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Start time" required>
              <input
                type="time"
                required
                value={form.time}
                onChange={e => set('time', e.target.value)}
                className={inp}
              />
            </Field>
          </div>

          <Field label="Location" required>
            <input
              type="text"
              required
              placeholder="e.g. Parque La Sabana, San José"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className={inp}
            />
          </Field>

          <Field label="Sport type" required>
            <div className="grid grid-cols-3 gap-3">
              {SPORTS.map(sport => (
                <button
                  key={sport.value}
                  type="button"
                  onClick={() => set('sport_type', sport.value)}
                  className={`flex flex-col items-center rounded-xl border-2 px-4 py-3 text-center transition-all ${
                    form.sport_type === sport.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl leading-none">{sport.emoji}</span>
                  <span className={`mt-1.5 text-sm font-semibold ${
                    form.sport_type === sport.value ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    {sport.label}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-400">{sport.desc}</span>
                </button>
              ))}
            </div>
          </Field>
        </Card>

        {/* ── Section 2: Registration ── */}
        <Card title="Registration" desc="Capacity and pricing for this event">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Distance (km)" required>
              <input
                type="number"
                min="0"
                step="0.1"
                required
                placeholder="21.1"
                value={form.distance}
                onChange={e => set('distance', e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Price (USD)">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className={inp + ' pl-7'}
                />
              </div>
            </Field>
            <Field label="Max participants" required>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="500"
                value={form.max_participants}
                onChange={e => set('max_participants', e.target.value)}
                className={inp}
              />
            </Field>
          </div>
        </Card>

        {/* ── Section 3: Start waves ── */}
        <Card
          title="Start waves"
          desc="Divide athletes into time-separated corrals"
          toggle={
            <Toggle
              checked={form.has_waves}
              onChange={v => set('has_waves', v)}
              label={form.has_waves ? 'Enabled' : 'Disabled'}
            />
          }
        >
          {form.has_waves && (
            <div className="space-y-4">
              {/* Preset chips */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {WAVE_PRESETS.map(preset => {
                    const active = form.wave_options.includes(preset)
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => toggleWavePreset(preset)}
                        className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                          active
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{preset}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom wave input */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Custom name</p>
                <div className="flex gap-2">
                  <input
                    value={waveInput}
                    onChange={e => setWaveInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addCustomWave() }
                    }}
                    placeholder="e.g. Junior Elite"
                    className={inp + ' flex-1'}
                  />
                  <button
                    type="button"
                    onClick={addCustomWave}
                    className="rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Wave order */}
              {form.wave_options.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Wave order ({form.wave_options.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {form.wave_options.map((wave, i) => (
                      <span
                        key={wave}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-3 pr-2 text-sm font-medium text-indigo-700"
                      >
                        <span className="text-xs font-normal text-indigo-400">{i + 1}.</span>
                        {wave}
                        <button
                          type="button"
                          onClick={() => removeWave(wave)}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-indigo-300 hover:bg-indigo-200 hover:text-indigo-700 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.wave_options.length === 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Add at least one wave above.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* ── Section 4: Shirt sizes ── */}
        <Card
          title="Shirt sizes"
          desc="Collect shirt size preference at registration"
          toggle={
            <Toggle
              checked={form.has_shirt_sizes}
              onChange={v => set('has_shirt_sizes', v)}
              label={form.has_shirt_sizes ? 'Enabled' : 'Disabled'}
            />
          }
        >
          {form.has_shirt_sizes && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Select the sizes you&apos;ll offer.</p>
              <div className="flex flex-wrap gap-2">
                {SHIRT_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`h-11 w-16 rounded-lg border-2 text-sm font-bold transition-all ${
                      form.shirt_sizes.includes(size)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {form.shirt_sizes.length === 0 && (
                <p className="text-xs text-amber-600">Select at least one size.</p>
              )}
            </div>
          )}
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* ── Sticky action footer ── */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/dashboard/organizer/races"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => submit('draft')}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Save as draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => submit('published')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                'Saving…'
              ) : (
                <>
                  Publish race
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function Card({
  title, desc, toggle, children,
}: {
  title: string
  desc?: string
  toggle?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-gray-400">{desc}</p>}
        </div>
        {toggle}
      </div>
      {children && <div className="space-y-5 px-6 py-5">{children}</div>}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2"
      aria-pressed={checked}
    >
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
    </button>
  )
}

// ─── Shared input style ──────────────────────────────────────────────────────────

const inp =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
