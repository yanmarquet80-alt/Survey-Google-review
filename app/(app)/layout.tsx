import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = (user.app_metadata?.role === 'admin') as boolean

  return (
    <>
      <Sidebar userEmail={user.email!} isAdmin={isAdmin} />
      <div className="ml-56 min-h-screen bg-slate-100">{children}</div>
    </>
  )
}
