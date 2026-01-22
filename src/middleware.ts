import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // console.log('🍪 [MIDDLEWARE] Setting cookies:', cookiesToSet.map(c => ({
          //   name: c.name,
          //   hasValue: !!c.value,
          //   hasOptions: !!c.options
          // })))
          
          // Set cookies on response with all options
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This triggers token refresh if needed
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // console.log('🔐 [MIDDLEWARE] Auth check:', {
  //   path: request.nextUrl.pathname,
  //   hasUser: !!user,
  //   error: error?.message,
  //   cookies: request.cookies.getAll().map(c => c.name)
  // })

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/auth/forgot-password', '/auth/update-password', '/api/auth', '/api/users/getUserByEmail']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Redirect to home page if user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    // console.log('🚫 [MIDDLEWARE] Redirecting unauthenticated user to home')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to chat if user is authenticated and trying to access auth pages
  if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/auth')) {
    // console.log('✅ [MIDDLEWARE] Redirecting authenticated user to chat')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/chat'
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    response.headers.set('x-user-id', user.id)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Common image/font extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
