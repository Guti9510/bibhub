import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavItem } from './_components/NavItem'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'
import { LanguageToggleDark } from '@/components/LanguageToggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name, email')
    .eq('user_id', user.id)
    .maybeSingle()

  const isOrganizer = !!organizer
  const locale = await getLocale()
  const t = getT(locale)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-100 px-5">
          <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight">
            {t.common.bibhub}
          </Link>
        </div>

        {/* Profile */}
        {organizer && (
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {organizer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{organizer.name}</p>
                <p className="truncate text-xs text-gray-400">{organizer.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {isOrganizer ? (
            <>
              <NavItem
                href="/dashboard/organizer"
                exact
                icon={<DashboardIcon />}
              >
                {t.sidebar.dashboard}
              </NavItem>
              <NavItem
                href="/dashboard/organizer/races"
                icon={<RacesIcon />}
              >
                {t.sidebar.races}
              </NavItem>
            </>
          ) : (
            <>
              <NavItem
                href="/dashboard/athlete"
                exact
                icon={<DashboardIcon />}
              >
                {t.sidebar.dashboard}
              </NavItem>
              <NavItem
                href="/dashboard/athlete/registrations"
                icon={<RacesIcon />}
              >
                {t.sidebar.myRegistrations}
              </NavItem>
              <NavItem
                href="/bibs"
                icon={<TransferIcon />}
              >
                {t.sidebar.bibMarketplace}
              </NavItem>
              <NavItem
                href="/dashboard/athlete/profile"
                icon={<ProfileIcon />}
              >
                {t.sidebar.profile}
              </NavItem>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-3 space-y-2">
          <div className="flex justify-center">
            <LanguageToggleDark />
          </div>
          <Link
            href="/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <SignOutIcon />
            {t.sidebar.signOut}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function DashboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function RacesIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function TransferIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
