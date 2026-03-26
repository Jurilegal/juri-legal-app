import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from './DashboardShell'
import { CommandPalette } from '@/components/CommandPalette'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <>
      <CommandPalette />
      <DashboardShell role={profile?.role || 'mandant'} userName={`${profile?.first_name || ''} ${profile?.last_name || ''}`}>
        {children}
      </DashboardShell>
    </>
  )
}
