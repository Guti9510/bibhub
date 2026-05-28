'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/lib/i18n/context'
import { LanguageToggleDark } from '@/components/LanguageToggle'

type Step = 'form' | 'confirm'

export default function SignupPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [step, setStep] = useState<Step>('form')

  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'organizer', org_name: orgName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      const { error: insertError } = await supabase.from('organizers').insert({
        user_id: data.user!.id,
        name: orgName,
        email,
      })

      if (insertError && insertError.code !== '23505') {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard/organizer')
      router.refresh()
      return
    }

    setStep('confirm')
    setLoading(false)
  }

  if (step === 'confirm') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t.common.checkYourInbox}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {t.common.confirmationSentTo}{' '}
            <span className="font-medium text-gray-700">{email}</span>.{' '}
            {t.common.clickToActivateAndAccess}
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            {t.common.backToSignIn}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-indigo-600 p-12">
        <span className="text-2xl font-bold text-white">{t.common.bibhub}</span>
        <div>
          <h2 className="text-3xl font-bold text-white">{t.auth.organizerSignup.panelTitle}</h2>
          <ul className="mt-6 space-y-3">
            {t.auth.organizerSignup.benefits.map(b => (
              <li key={b} className="flex items-center gap-3 text-sm text-indigo-100">
                <svg className="h-5 w-5 shrink-0 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-indigo-300">{t.common.copyright(new Date().getFullYear())}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between lg:hidden">
            <span className="text-xl font-bold text-indigo-600">{t.common.bibhub}</span>
            <LanguageToggleDark />
          </div>
          <div className="mb-6 hidden lg:flex justify-end">
            <LanguageToggleDark />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{t.auth.organizerSignup.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {t.common.alreadyHaveAccount}{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
              {t.common.signIn}
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t.auth.organizerSignup.orgName}
              </label>
              <input
                type="text"
                required
                autoComplete="organization"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder={t.auth.organizerSignup.orgNamePlaceholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t.auth.organizerSignup.workEmail}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@organization.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t.common.password}
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.auth.organizerSignup.passwordPlaceholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              {loading ? t.common.creatingAccount : t.common.createAccount}
            </button>

            <p className="text-center text-xs text-gray-400">
              {t.common.bySigningUp}{' '}
              <span className="underline cursor-pointer">{t.common.termsOfService}</span>{' '}
              {t.common.and}{' '}
              <span className="underline cursor-pointer">{t.common.privacyPolicy}</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
