'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Gender, Laterality, SportType } from '@/types/database'
import { useLocale } from '@/lib/i18n/context'

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export default function AthleteProfilePage() {
  const router = useRouter()
  const { t } = useLocale()
  const tp = t.athleteProfile

  const SPORTS: { value: SportType; emoji: string; label: string }[] = [
    { value: 'running', emoji: '🏃', label: tp.sports.running },
    { value: 'cycling', emoji: '🚴', label: tp.sports.cycling },
    { value: 'swimming', emoji: '🏊', label: tp.sports.swimming },
  ]

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
    height_cm: '',
    weight_kg: '',
    team: '',
    sport_years: {} as Record<string, string>,
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
          height_cm: data.height_cm != null ? String(data.height_cm) : '',
          weight_kg: data.weight_kg != null ? String(data.weight_kg) : '',
          team: data.team ?? '',
          sport_years: Object.fromEntries(
            Object.entries((data.sport_years ?? {}) as Record<string, number>)
              .map(([k, v]) => [k, v != null ? String(v) : ''])
          ) as Record<string, string>,
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
    const isSelected = form.sport_types.includes(sport)
    set('sport_types', isSelected
      ? form.sport_types.filter(s => s !== sport)
      : [...form.sport_types, sport])
    if (isSelected) {
      const updated = { ...form.sport_years }
      delete updated[sport]
      set('sport_years', updated)
    }
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
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      team: form.team || null,
      sport_years: Object.fromEntries(
        form.sport_types
          .map(s => [s, form.sport_years[s] ? parseInt(form.sport_years[s], 10) : null])
          .filter(([, v]) => v !== null)
      ) as Record<string, number>,
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
    <div className="mx-auto max-w-2xl pb-24 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/athlete" className="text-sm text-gray-400 hover:text-gray-600">
          {tp.backToDashboard}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">{tp.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{tp.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Personal info */}
        <Card title={tp.personalInfo}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={tp.firstName}>
              <input
                required
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="Ana"
                className={inp}
              />
            </Field>
            <Field label={tp.lastName}>
              <input
                required
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="González"
                className={inp}
              />
            </Field>
          </div>

          <Field label={t.common.email}>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className={inp}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={tp.phone} optional>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+506 8888 0000"
                className={inp}
              />
            </Field>
            <Field label={tp.dateOfBirth}>
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
            <Field label={tp.nationality} optional>
              <input
                value={form.nationality}
                onChange={e => set('nationality', e.target.value)}
                placeholder="Costa Rican"
                className={inp}
              />
            </Field>
            <Field label={tp.gender} optional>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value as Gender | '')}
                className={inp}
              >
                <option value="">{tp.genderOptions.preferNotToSay}</option>
                <option value="male">{tp.genderOptions.male}</option>
                <option value="female">{tp.genderOptions.female}</option>
                <option value="non_binary">{tp.genderOptions.nonBinary}</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Body metrics */}
        <Card title={tp.bodyMetrics} desc={tp.bodyMetricsDesc}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={tp.heightCm} optional>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  placeholder={tp.heightPlaceholder}
                  value={form.height_cm}
                  onChange={e => set('height_cm', e.target.value)}
                  className={inp}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">cm</span>
              </div>
            </Field>
            <Field label={tp.weightKg} optional>
              <div className="relative">
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  placeholder={tp.weightPlaceholder}
                  value={form.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)}
                  className={inp}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">kg</span>
              </div>
            </Field>
          </div>
        </Card>

        {/* Team */}
        <Card title={tp.team}>
          <Field label={tp.team} optional>
            <input
              type="text"
              placeholder={tp.teamPlaceholder}
              value={form.team}
              onChange={e => set('team', e.target.value)}
              className={inp}
            />
          </Field>
        </Card>

        {/* Sports & laterality */}
        <Card title={tp.sportsLaterality}>
          <Field label={tp.iCompeteIn}>
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
            {form.sport_types.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{tp.yearsPracticing}</p>
                <div className="grid grid-cols-1 gap-2">
                  {SPORTS.filter(s => form.sport_types.includes(s.value)).map(({ value, emoji, label }) => (
                    <div key={value} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-600">{emoji} {label}</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          placeholder={tp.yearsPlaceholder}
                          value={form.sport_years[value] ?? ''}
                          onChange={e => set('sport_years', { ...form.sport_years, [value]: e.target.value })}
                          className={inp + ' bg-white pr-10'}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">yrs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Field>

          <Field label={tp.dominantSide} optional>
            <div className="flex gap-3">
              {[
                { value: 'left' as Laterality, label: tp.left },
                { value: 'right' as Laterality, label: tp.right },
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
                {tp.unknown}
              </button>
            </div>
          </Field>
        </Card>

        {/* Emergency contact */}
        <Card title={tp.emergencyContact}>
          <p className="text-sm text-gray-500">{tp.emergencyContactDesc}</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.common.name} optional>
              <input
                value={form.emergency_contact_name}
                onChange={e => set('emergency_contact_name', e.target.value)}
                placeholder="Carlos González"
                className={inp}
              />
            </Field>
            <Field label={tp.phone} optional>
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
        <Card title={tp.beneficiary}>
          <p className="text-sm text-gray-500">{tp.beneficiaryDesc}</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.common.name} optional>
              <input
                value={form.beneficiary_name}
                onChange={e => set('beneficiary_name', e.target.value)}
                placeholder="María González"
                className={inp}
              />
            </Field>
            <Field label={tp.relationship} optional>
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
                {tp.profileSaved}
              </p>
            )}
            {!error && !saved && <span />}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? t.common.saving : tp.saveProfile}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      {desc && <p className="mt-1 mb-5 text-xs text-gray-400">{desc}</p>}
      {!desc && <div className="mb-5" />}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  const { t } = useLocale()
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {optional && <span className="text-xs font-normal text-gray-400">{t.common.optional}</span>}
      </label>
      {children}
    </div>
  )
}
