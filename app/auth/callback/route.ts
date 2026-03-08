/**
 * app/auth/callback/route.ts — OAuth Callback Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES:
 * - Uses supabaseRouteHandler() (correct client for route handlers)
 * - Sanitises `next` param to prevent open redirect to external domains
 * - Uses req.url origin rather than hardcoded NEXT_PUBLIC_APP_URL so that
 *   Vercel preview deployments (unique per-PR URLs) work without config changes
 */

import { supabaseRouteHandler } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { setupGmailProfile } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  // Sanitise the `next` param — must be a relative path on the same origin
  const rawNext = searchParams.get('next') ?? '/chat'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/chat'

  if (code) {
    const supabase = supabaseRouteHandler()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const email       = data.user.email!
      const displayName = data.user.user_metadata?.full_name
        ?? data.user.user_metadata?.name
        ?? email.split('@')[0]

      await setupGmailProfile(data.user.id, email, displayName)

      // Redirect to the intended page — using the request origin ensures
      // Vercel preview deployments don't redirect back to production.
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[Auth Callback] Session exchange failed:', error?.message)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
