'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'

const NAV = [
  { href: '/', label: 'Aperçu', icon: '📊' },
  { href: '/campaigns', label: 'Campagnes', icon: '📋' },
  { href: '/responses', label: 'Réponses', icon: '💬' },
  { href: '/send', label: 'Envoyer', icon: '📨' },
  { href: '/settings', label: 'Paramètres', icon: '⚙️' },
]

interface SidebarProps {
  userEmail: string
  isAdmin: boolean
}

export function Sidebar({ userEmail, isAdmin }: SidebarProps) {
  const path = usePathname()
  const [pendingResponses, setPendingResponses] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('review_responses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => {
        if (count && count > 0) setPendingResponses(count)
      })
  }, [])

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-10 shadow-xl">
      <div className="px-5 py-5 border-b border-gray-700/60">
        <div className="text-base font-bold text-white tracking-tight">⭐ Review Manager</div>
        <div className="text-xs text-gray-400 mt-0.5">Google · TripAdvisor · TrustPilot</div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href
          const isPending = href === '/responses' && pendingResponses > 0

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="flex-1">{label}</span>
              {isPending && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {pendingResponses > 99 ? '99+' : pendingResponses}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-4 py-4 border-t border-gray-700/60 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-300 truncate">{userEmail}</p>
            {isAdmin && (
              <p className="text-xs text-amber-400 font-semibold">Admin</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
          >
            Déconnexion →
          </button>
        </form>
      </div>
    </aside>
  )
}
