import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/pricing', '/auth/callback', '/auth/reset-password', '/forgot-password']
const AUTH_PATHS   = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // Pattern chuẩn của @supabase/ssr: cập nhật cookie cho CẢ request lẫn response
        // để server component trong cùng request đọc đúng phiên đã refresh.
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Làm mới token + đồng bộ cookie
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages (giữ cookie đã refresh)
  if (user && AUTH_PATHS.some((p) => path === p)) {
    const redirect = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  // Protect all non-public routes
  if (!user && !PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
