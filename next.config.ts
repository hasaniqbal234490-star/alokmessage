/**
 * next.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXED BUG #4: serverActions.allowedOrigins only contained 'localhost:3000'.
 * On Vercel production, Server Actions use CSRF origin validation. Any origin
 * not in this list receives a 403 and the action silently fails.
 *
 * The production Vercel domain is read from NEXT_PUBLIC_APP_URL at build time.
 */

import type { NextConfig } from 'next'

// Extract hostname from the APP_URL env var (e.g. "alok-message.vercel.app")
function getAllowedOrigins(): string[] {
  const origins = ['localhost:3000', 'localhost:3001']

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      const { host } = new URL(appUrl)
      if (host && !origins.includes(host)) {
        origins.push(host)
      }
    } catch {
      // Malformed URL — skip
    }
  }

  // Also allow Vercel preview deployments (*.vercel.app)
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl && !origins.includes(vercelUrl)) {
    origins.push(vercelUrl)
  }

  return origins
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
}

export default nextConfig
