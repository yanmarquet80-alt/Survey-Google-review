'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ResponseCard } from '@/components/responses/ResponseCard'
import type { ReviewResponse, Platform, ResponseStatus } from '@/lib/types'

const PLATFORM_FILTERS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes les plateformes' },
  { value: 'google', label: '🔵 Google' },
  { value: 'tripadvisor', label: '🟢 TripAdvisor' },
  { value: 'trustpilot', label: '✅ TrustPilot' },
]

const STATUS_TABS: { value: ResponseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'published', label: 'Publiés' },
  { value: 'dismissed', label: 'Ignorés' },
]

export default function ResponsesPage() {
  const [responses, setResponses] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<ResponseStatus | 'all'>('pending')
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all')
  const [activeBusiness, setActiveBusiness] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('review_responses')
      .select('*, businesses:review_businesses(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setResponses(data as ReviewResponse[])
        setLoading(false)
      })
  }, [])

  function handleStatusChange(id: string, status: 'published' | 'dismissed' | 'pending') {
    setResponses(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status, published_at: status === 'published' ? new Date().toISOString() : r.published_at }
          : r
      )
    )
  }

  const businesses = Array.from(
    new Map(
      responses
        .filter(r => r.businesses?.name)
        .map(r => [r.business_id, r.businesses!.name])
    ).entries()
  )

  const filtered = responses.filter(r => {
    if (activeStatus !== 'all' && r.status !== activeStatus) return false
    if (activePlatform !== 'all' && r.platform !== activePlatform) return false
    if (activeBusiness !== 'all' && r.business_id !== activeBusiness) return false
    return true
  })

  const pendingCount = responses.filter(r => r.status === 'pending').length
  const crisisCount = responses.filter(r => r.sentiment === 'crisis' && r.status === 'pending').length

  return (
    <main className="px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Réponses aux avis</h2>
          {pendingCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
        <p className="text-gray-500 mt-1">Propositions de réponse générées par l&apos;IA — Google, TripAdvisor, TrustPilot</p>
      </div>

      {/* Alerte crise globale */}
      {crisisCount > 0 && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {crisisCount} avis de crise en attente de traitement
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Ces avis nécessitent une attention immédiate — ne pas répondre sans consultation préalable.
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Tabs statut */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeStatus === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.value === 'pending' && pendingCount > 0 && (
                <span className={`ml-1.5 text-xs font-bold ${activeStatus === 'pending' ? 'text-blue-200' : 'text-blue-600'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtre plateforme */}
        <select
          value={activePlatform}
          onChange={e => setActivePlatform(e.target.value as Platform | 'all')}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PLATFORM_FILTERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Filtre établissement */}
        {businesses.length > 1 && (
          <select
            value={activeBusiness}
            onChange={e => setActiveBusiness(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les établissements</option>
            {businesses.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste des réponses */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-500 font-medium">Aucune réponse</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeStatus === 'pending'
              ? 'Toutes les réponses ont été traitées 🎉'
              : 'Aucune réponse ne correspond aux filtres sélectionnés'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(response => (
            <ResponseCard
              key={response.id}
              response={response}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </main>
  )
}
