'use client'

import { useState } from 'react'
import type { Campaign, CampaignStatus } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { createClient } from '@/lib/supabase/client'

const TABS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Envoyés', value: 'sent' },
  { label: 'Relancés', value: 'reminder_sent' },
  { label: 'Avis laissés', value: 'reviewed' },
  { label: 'Expirés', value: 'expired' },
]

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
      .from('campaigns')
      .update({ status: 'reviewed', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'reviewed' as CampaignStatus, reviewed_at: new Date().toISOString() } : c))
    setMarkingId(null)
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Client</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 pr-4 font-medium">Envoyé le</th>
              <th className="pb-3 pr-4 font-medium">Relance le</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400">Aucune campagne</td>
              </tr>
            )}
            {filtered.map(campaign => (
              <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="font-medium text-gray-900">{campaign.clients?.name ?? '—'}</div>
                  <div className="text-gray-400 text-xs">{campaign.clients?.email ?? '—'}</div>
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
