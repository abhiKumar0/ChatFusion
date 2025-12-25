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
          console.log('🍪 [MIDDLEWARE] Setting cookies:', cookiesToSet.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            hasOptions: !!c.options
          })))
          
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
  
  console.log('🔐 [MIDDLEWARE] Auth check:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    error: error?.message,
    cookies: request.cookies.getAll().map(c => c.name)
  })

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