import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const user = session.user
  const meta = user.user_metadata as { role?: string; org_name?: string } | undefined

  if (meta?.role === 'organizer') {
    await supabase.from('organizers').upsert(
      {
        user_id: user.id,
        name: meta.org_name ?? user.email ?? 'Unnamed Organizer',
        email: user.email ?? '',
      },
      { onConflict: 'user_id' }
    )
    const destination = next === '/dashboard' ? '/dashboard/organizer' : next
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (meta?.role === 'athlete') {
    const destination = next === '/dashboard' ? '/dashboard/athlete' : next
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
