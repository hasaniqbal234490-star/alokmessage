/**
 * middleware.ts — Alok Message Auth Gate
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXED BUGS:
 *
 * BUG #1 — Replaced deprecated `createMiddlewareClient` (@supabase/auth-helpers-nextjs v0.9)
 *   with `createServerClient` from `@supabase/ssr`. The old client silently failed to
 *   propagate Set-Cookie headers on Vercel Edge runtime, causing ERR_EMPTY_RESPONSE
 *   and broken session refresh cycles.
 *
 * BUG #2 — API routes and static assets now excluded from auth checks.
 *   Previously /api/* beacon routes received 302 redirects on expired sessions,
 *   killing navigator.sendBeacon calls and causing Vercel 499/ERR_EMPTY_RESPONSE.
 *
 * BUG #3 — Session race condition on OAuth callback resolved.
 *   After /auth/callback sets the session cookie, Vercel's edge CDN sometimes
 *   serves the next request from a node that hasn't received the cookie yet.
 *   We now use getUser() (network-validated) instead of getSession() (local cache).
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ─── Route Classification ─────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/banned',
]

const ADMIN_PATHS = ['/admin']

const BYPASS_PREFIXES = [
  '/_next/',
  '/api/',
  '/assets/',
  '/icons/',
  '/og-image',
  '/favicon',
]

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Fast bypass for non-HTML paths
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Build mutable response — CRITICAL: must be passed through all branches
  // so that Set-Cookie headers from token refresh are preserved.
  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  // @supabase/ssr client (replaces deprecated createMiddlewareClient)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getUser() validates via Supabase Auth server — more reliable than
  // getSession() which only reads the local cookie (stale on edge nodes).
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAdminPath  = ADMIN_PATHS.some((p)  => pathname.startsWith(p))

  // Redirect logged-in users away from auth pages
  if (user && isPublicPath && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // Allow unauthenticated access to public paths
  if (isPublicPath) {
    return res
  }

  // Require auth for all protected routes
  if (!user) {
    const loginUrl = new URL('/auth/login', req.url)
    if (!pathname.startsWith('/auth')) {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Admin route guard
  if (isAdminPath) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role ?? '')) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
  }

  return res
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/|assets/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
}
