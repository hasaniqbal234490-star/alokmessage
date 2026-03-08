import { supabaseServer } from '@/lib/supabase'

import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: user } = await supabase
    .from('users')
    .select('*, businessProfile(*)')
    .eq('id', session!.user.id)
    .single()

  return <SettingsClient user={user} />
}
