import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-indigo-600">BibHub</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-gray-900">
          Race registration,{' '}
          <span className="text-indigo-600">simplified.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-500">
          BibHub connects race organizers with athletes. Publish events, manage waves, collect
          payments, and track registrations — all in one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/auth/signup?role=organizer"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            I&apos;m an organizer
          </Link>
          <Link
            href="/auth/signup?role=athlete"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            I&apos;m an athlete
          </Link>
        </div>
      </main>

      {/* Feature grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything you need to run a race
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
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
        &copy; {new Date().getFullYear()} BibHub
      </footer>
    </div>
  )
}

const features = [
  { icon: '🏁', title: 'Multi-sport support', description: 'Running, cycling, and swimming events in one dashboard.' },
  { icon: '🌊', title: 'Wave management', description: 'Define custom start waves and assign athletes automatically.' },
  { icon: '👕', title: 'Shirt sizing', description: 'Configure shirt sizes per race and collect selections at registration.' },
  { icon: '💳', title: 'Stripe payments', description: 'Integrated payment processing with refund support.' },
  { icon: '🔒', title: 'Secure by default', description: 'Row-level security ensures data is scoped to the right user.' },
  { icon: '📊', title: 'Live dashboards', description: 'Track registrations, revenue, and capacity in real time.' },
]
