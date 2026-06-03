import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { getLocale } from '@/lib/i18n/server'
import { LocaleProvider } from '@/lib/i18n/context'
import DevNav from '@/components/DevNav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'BibHub — Race Registration Platform',
  description: 'The B2B platform for race organizers and athletes.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">
        <LocaleProvider locale={locale}>
          {children}
          <DevNav />
        </LocaleProvider>
      </body>
    </html>
  )
}
