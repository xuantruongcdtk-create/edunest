import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/pricing', '/auth/callback', '/auth/reset-password', '/forgot-password']
const AUTH_PATHS   = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (pairs) =>
          pairs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some((p) => path === p)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect all non-public routes
  if (!user && !PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
