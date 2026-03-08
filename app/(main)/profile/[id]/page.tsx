import { supabaseServer } from '@/lib/supabase'

import { notFound } from 'next/navigation'
import ProfilePageClient from './ProfilePageClient'

interface Props { params: { id: string } }

export default async function ProfilePage({ params }: Props) {
  const supabase = supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: targetUser } = await supabase
    .from('users')
    .select('*, businessProfile(*)')
    .eq('id', params.id)
    .single()

  if (!targetUser) notFound()

  const isOwn = session?.user.id === params.id

  return (
    <ProfilePageClient
      user={targetUser}
      isOwn={isOwn}
      currentUserId={session?.user.id ?? ''}
    />
  )
}
