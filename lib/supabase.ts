/**
 * lib/supabase.ts — Supabase Client Factory
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXED BUGS:
 *
 * BUG #5 — API route handlers were using `createServerComponentClient` which is
 *   only valid inside React Server Components. Route Handlers require
 *   `createRouteHandlerClient` (or `createServerClient` from @supabase/ssr).
 *   Using the wrong client causes cookie reads to silently fail in production,
 *   resulting in null sessions even when the user is authenticated.
 *
 * Migration path:
 *   - supabaseBrowser()       → Client Components  (unchanged)
 *   - supabaseServer()        → Server Components  (now uses @supabase/ssr)
 *   - supabaseRouteHandler()  → Route Handlers     (new, replaces wrong usage)
 *   - supabaseAdmin           → Service role ops   (unchanged)
 */

import { createClient }          from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies }               from 'next/headers'
import type { CookieOptions }    from '@supabase/ssr'

// ─── Environment Validation ───────────────────────────────────────────────────

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('[Alok Message] Missing Supabase environment variables.')
}

// ─── Browser Client (Client Components) ──────────────────────────────────────

export const supabaseBrowser = () =>
  createBrowserClient(supabaseUrl, supabaseAnon)

// ─── Server Client (Server Components) ───────────────────────────────────────

export const supabaseServer = () => {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// ─── Route Handler Client (API Routes) ───────────────────────────────────────
// Use this in app/api/* route handlers instead of supabaseServer().
// Route handlers require read+write cookie access for token refresh to work.

export const supabaseRouteHandler = () => {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}

// ─── Service Role Client (Admin / AI Guard) ───────────────────────────────────

export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Public Client (legacy, unauthenticated) ──────────────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  bucket: 'chat-media' | 'avatars' | 'business-assets',
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('[Supabase Storage] Upload failed:', error.message)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteMedia(
  bucket: 'chat-media' | 'avatars' | 'business-assets',
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('[Supabase Storage] Delete failed:', error.message)
    return false
  }
  return true
}

export function subscribeToChat(chatId: string, onMessage: (payload: unknown) => void) {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: `chat_id=eq.${chatId}`,
    }, onMessage)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToUserPresence(userId: string, onUpdate: (payload: unknown) => void) {
  const channel = supabase
    .channel(`presence:${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'users',
      filter: `id=eq.${userId}`,
    }, onUpdate)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
