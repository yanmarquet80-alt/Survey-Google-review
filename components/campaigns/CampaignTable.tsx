'use client'

import { useState } from 'react'
import type { Campaign, CampaignStatus, Platform } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { createClient } from '@/lib/supabase/client'

const TABS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Envoyés', value: 'sent' },
  { label: 'Relancés', value: 'reminder_sent' },
  { label: 'Avis laissés', value: 'reviewed' },
  { label: 'Expirés', value: 'expired' },
]

const PLATFORM_BADGE: Record<Platform, { label: string; classes: string }> = {
  google:      { label: 'Google',      classes: 'bg-blue-100 text-blue-700' },
  tripadvisor: { label: 'TripAdvisor', classes: 'bg-teal-100 text-teal-700' },
  trustpilot:  { label: 'TrustPilot',  classes: 'bg-green-100 text-green-700' },
  yelp:        { label: 'Yelp',        classes: 'bg-red-100 text-red-700' },
  thefork:     { label: 'TheFork',     classes: 'bg-orange-100 text-orange-700' },
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, classes } = PLATFORM_BADGE[platform] ?? PLATFORM_BADGE.google
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

export function CampaignTable({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [activeTab, setActiveTab] = useState<CampaignStatus | 'all'>('all')
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const filtered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab)

  async function markAsReviewed(id: string) {
    setMarkingId(id)
    const supabase = createClient()
    await supabase
      .from('review_campaigns')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'reviewed' as CampaignStatus, reviewed_at: new Date().toISOString() } : c))
    setMarkingId(null)
  }

  return (
    <div>
      <div className="flex bg-slate-100 rounded-lg border border-gray-200 p-0.5 gap-0.5 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 text-left text-gray-400 text-xs uppercase tracking-widest bg-slate-50/60">
              <th className="pb-3 pr-4 font-medium">Client</th>
              <th className="pb-3 pr-4 font-medium">Plateforme</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 pr-4 font-medium">Envoyé le</th>
              <th className="pb-3 pr-4 font-medium">Relance le</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">Aucune campagne</td>
              </tr>
            )}
            {filtered.map(campaign => (
              <tr key={campaign.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="font-medium text-gray-900">{campaign.clients?.name ?? '—'}</div>
                  <div className="text-gray-400 text-xs">{campaign.clients?.email ?? '—'}</div>
                </td>
                <td className="py-3 pr-4">
                  <PlatformBadge platform={campaign.platform ?? 'google'} />
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={campaign.status} />
                </td>
                <td className="py-3 pr-4 text-gray-600">{formatDate(campaign.sent_at)}</td>
                <td className="py-3 pr-4 text-gray-600">{formatDate(campaign.reminder_at)}</td>
                <td className="py-3">
                  {(campaign.status === 'sent' || campaign.status === 'reminder_sent') && (
                    <button
                      onClick={() => markAsReviewed(campaign.id)}
                      disabled={markingId === campaign.id}
                      className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                    >
                      {markingId === campaign.id ? '...' : '✓ Marquer avis reçu'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
