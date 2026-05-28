import Link from 'next/link'
import HeroSlideshow from './_components/HeroSlideshow'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n'

export default async function HomePage() {
  const locale = await getLocale()
  const t = getT(locale)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav — floats over the hero */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-white drop-shadow">{t.common.bibhub}</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-white/80 hover:text-white">
              {t.common.signIn}
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-white/15 border border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition-colors"
            >
              {t.common.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with slideshow */}
      <HeroSlideshow />

      {/* Feature grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            {t.home.featuresTitle}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {t.home.features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        {t.common.copyright(new Date().getFullYear())}
      </footer>
    </div>
  )
}
