import { supabaseRouteHandler } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = supabaseRouteHandler()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!))
}
