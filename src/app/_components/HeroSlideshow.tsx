'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const slides = [
  {
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1920&q=80',
    sport: 'Running',
  },
  {
    url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1920&q=80',
    sport: 'Cycling',
  },
  {
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1920&q=80',
    sport: 'Swimming',
  },
]

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (current + 1) % slides.length
      setNext(nextIndex)
      setTransitioning(true)

      setTimeout(() => {
        setCurrent(nextIndex)
        setNext(null)
        setTransitioning(false)
      }, 1000) // fade duration
    }, 15000)

    return () => clearInterval(interval)
  }, [current])

  return (
    <div className="relative flex min-h-[600px] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">

      {/* Background slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.url}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${slide.url})`,
            opacity: i === current && !transitioning
              ? 1
              : i === next && transitioning
                ? 1
                : i === current && transitioning
                  ? 0
                  : 0,
            zIndex: i === next ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 2 }} />

      {/* Sport label */}
      <div className="relative mb-4" style={{ zIndex: 3 }}>
        <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur-sm">
          {slides[current].sport}
        </span>
      </div>

      {/* Hero text */}
      <div className="relative max-w-3xl" style={{ zIndex: 3 }}>
        <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl">
          Race registration,{' '}
          <span className="text-indigo-300">simplified.</span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-lg text-white/80">
          BibHub connects race organizers with athletes. Publish events, manage waves,
          collect payments, and track registrations — all in one place.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/signup"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
          >
            I&apos;m an organizer
          </Link>
          <Link
            href="/auth/athlete/signup"
            className="rounded-xl border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            I&apos;m an athlete
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="relative mt-10 flex gap-2" style={{ zIndex: 3 }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
