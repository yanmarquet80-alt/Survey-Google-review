'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/', label: 'Aperçu', icon: '📊' },
  { href: '/campaigns', label: 'Campagnes', icon: '📋' },
  { href: '/responses', label: 'Réponses', icon: '💬' },
  { href: '/send', label: 'Envoyer', icon: '📨' },
  { href: '/settings', label: 'Paramètres', icon: '⚙️' },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-10">
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="text-base font-bold text-white">⭐ Review Manager</div>
        <div className="text-xs text-gray-400 mt-0.5">Google · TripAdvisor · TrustPilot</div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-700">
        <div className="text-xs text-gray-600">v2.0 — Multi-plateforme</div>
      </div>
    </aside>
  )
}
