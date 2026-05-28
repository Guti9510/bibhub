'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Gender, Laterality, SportType } from '@/types/database'

const SPORTS: { value: SportType; emoji: string; label: string }[] = [
  { value: 'running', emoji: '🏃', label: 'Running' },
  { value: 'cycling', emoji: '🚴', label: 'Cycling' },
  { value: 'swimming', emoji: '🏊', label: 'Swimming' },
]

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export default function AthleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    gender: '' as Gender | '',
    sport_types: [] as SportType[],
    laterality: '' as Laterality | '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    beneficiary_name: '',
    beneficiary_relationship: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      setForm(prev => ({
        ...prev,
        email: user.email ?? '',
        ...(data ? {
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          email: data.email ?? user.email ?? '',
          phone: data.phone ?? '',
          date_of_birth: data.date_of_birth ?? '',
          nationality: data.nationality ?? '',
          gender: (data.gender ?? '') as Gender | '',
          sport_types: (data.sport_types ?? []) as SportType[],
          laterality: (data.laterality ?? '') as Laterality | '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          beneficiary_name: data.beneficiary_name ?? '',
          beneficiary_relationship: data.beneficiary_relationship ?? '',
        } : {}),
      }))

      setFetching(false)
    }
    load()
  }, [])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleSport(sport: SportType) {
    set('sport_types', form.sport_types.includes(sport)
      ? form.sport_types.filter(s => s !== sport)
      : [...form.sport_types, sport])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth,
      nationality: form.nationality || null,
      gender: (form.gender || null) as Gender | null,
      sport_types: form.sport_types,
      laterality: (form.laterality || null) as Laterality | null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      beneficiary_name: form.beneficiary_name || null,
      beneficiary_relationship: form.beneficiary_relationship || null,
    }

    const { error: upsertError } = await supabase
      .from('athletes')
      .upsert(payload, { onConflict: 'user_id' })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/athlete" className="text-sm text-gray-400 hover:text-gray-600">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Athlete profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your profile is pre-filled when you register for a race.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal info */}
        <Card title="Personal info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <input
                required
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Ana"
                className={inp}
              />
            </Field>
            <Field label="Last name">
              <input
                required
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="González"
                className={inp}
              />
            </Field>
          </div>

          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className={inp}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" optional>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+506 8888 0000"
                className={inp}
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                required
                value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)}
                className={inp}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nationality" optional>
              <input
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
                placeholder="Costa Rican"
                className={inp}
              />
            </Field>
            <Field label="Gender" optional>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value as Gender | '')}
                className={inp}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Sports & laterality */}
        <Card title="Sports & laterality">
          <Field label="I compete in">
            <div className="flex gap-3">
              {SPORTS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSport(value)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                    form.sport_types.includes(value)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Dominant side" optional>
            <div className="flex gap-3">
              {[
                { value: 'left' as Laterality, label: 'Left' },
                { value: 'right' as Laterality, label: 'Right' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('laterality', form.laterality === opt.value ? '' : opt.value)}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                    form.laterality === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => set('laterality', '')}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                  form.laterality === ''
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                Unknown
              </button>
            </div>
          </Field>
        </Card>

        {/* Emergency contact */}
        <Card title="Emergency contact">
          <p className="text-sm text-gray-500">
            Required by most races in case of a medical emergency.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" optional>
              <input
                value={form.emergency_contact_name}
                onChange={e => set('emergency_contact_name', e.target.value)}
                placeholder="Carlos González"
                className={inp}
              />
            </Field>
            <Field label="Phone" optional>
              <input
                type="tel"
                value={form.emergency_contact_phone}
                onChange={e => set('emergency_contact_phone', e.target.value)}
                placeholder="+506 8888 0000"
                className={inp}
              />
            </Field>
          </div>
        </Card>

        {/* Beneficiary */}
        <Card title="Beneficiary">
          <p className="text-sm text-gray-500">
            Person designated to receive race-related benefits if applicable.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" optional>
              <input
                value={form.beneficiary_name}
                onChange={e => set('beneficiary_name', e.target.value)}
                placeholder="María González"
                className={inp}
              />
            </Field>
            <Field label="Relationship" optional>
              <input
                value={form.beneficiary_relationship}
                onChange={e => set('beneficiary_relationship', e.target.value)}
                placeholder="Mother"
                className={inp}
              />
            </Field>
          </div>
        </Card>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && !error && (
              <p className="flex items-center gap-1.5 text-sm text-green-600">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Profile saved
              </p>
            )}
            {!error && !saved && <span />}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="text-xs font-normal text-gray-400">optional</span>}
      </label>
      {children}
    </div>
  )
}
