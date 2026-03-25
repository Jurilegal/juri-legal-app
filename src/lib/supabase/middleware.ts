import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const protectedRoutes = ['/dashboard', '/anwalt', '/mandant', '/admin']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    const isAdmin = role === 'admin' || role === 'super_admin'

    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'anwalt' ? '/anwalt/dashboard' : '/mandant/dashboard'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/anwalt') && role !== 'anwalt' && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/admin/dashboard' : '/mandant/dashboard'
      return NextResponse.redirect(url)
    }
    if (pathname.startsWith('/mandant') && role !== 'mandant' && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'anwalt' ? '/anwalt/dashboard' : '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
