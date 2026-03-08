# Alok Message — Vercel Deployment Guide

## Pre-Deployment Checklist (run in order)

### 1. Supabase Auth Settings
Go to: **Supabase Dashboard → Authentication → URL Configuration**

```
Site URL:              https://YOUR-APP.vercel.app
Redirect URLs (add):   https://YOUR-APP.vercel.app/auth/callback
                       http://localhost:3000/auth/callback
```

> ⚠️ Mismatch here is the #1 cause of OAuth loops. The callback URL must
> exactly match what `lib/auth.ts` sends in `signInWithGoogle()`.

### 2. Vercel Environment Variables
Set all of these in: **Vercel Dashboard → Project → Settings → Environment Variables**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `GEMINI_API_KEY` | Google AI Studio key |
| `GEMINI_3_KEY` | Same as above (or separate quota key) |
| `DAILY_API_KEY` | Daily.co API key |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` |
| `AI_NUMBER` | `+8801643435122` |
| `NEXT_PUBLIC_AI_NUMBER` | `+8801643435122` |

### 3. Google OAuth Configuration
In **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0**:

```
Authorised redirect URIs:
  https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback
```

### 4. Run Schema
In **Supabase → SQL Editor** run: `supabase/schema.sql`

### 5. npm install
```bash
npm install   # @supabase/ssr is now the auth client
```

### 6. Deploy
```bash
git push   # Vercel auto-deploys on push
```

## Bug Fixes Applied in V6

| # | Bug | Fix |
|---|---|---|
| 1 | `createMiddlewareClient` deprecated — ERR_EMPTY_RESPONSE on Vercel Edge | Replaced with `@supabase/ssr` `createServerClient` |
| 2 | API routes `/api/*` hit auth middleware — beacon POST returned 302 HTML | Added `/api/` to bypass list in matcher |
| 3 | OAuth session race on Vercel edge nodes — `getSession()` returned stale cache | Switched to `getUser()` (network-validated) |
| 4 | `serverActions.allowedOrigins: ['localhost:3000']` — CSRF error on prod | Now reads from `NEXT_PUBLIC_APP_URL` + `VERCEL_URL` |
| 5 | API routes used `createServerComponentClient` (wrong context) | All API routes now use `supabaseRouteHandler()` |
| 6 | `/assets/*` not excluded from middleware — every logo request auth-checked | Added to matcher exclusion regex |
