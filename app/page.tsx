import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'


export default async function RootPage() {
  const supabase = supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/chat')
  } else {
    redirect('/auth/login')
  }
}
