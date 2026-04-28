'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business, Platform } from '@/lib/types'
import { PageHeader } from '@/components/PageHeader'

const PLATFORM_LABELS: Record<Platform, { label: string; icon: string; color: string }> = {
  google: { label: 'Google', icon: '🔵', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  tripadvisor: { label: 'TripAdvisor', icon: '🟢', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  trustpilot: { label: 'TrustPilot', icon: '✅', color: 'bg-green-50 border-green-200 text-green-700' },
}

function getEffectivePlatform(biz: Business): Platform {
  const p = biz.platform_priority ?? 'google'
  if (p === 'tripadvisor' && biz.tripadvisor_url) return 'tripadvisor'
  if (p === 'trustpilot' && biz.trustpilot_url) return 'trustpilot'
  if (biz.google_review_url) return 'google'
  if (biz.tripadvisor_url) return 'tripadvisor'
  if (biz.trustpilot_url) return 'trustpilot'
  return 'google'
}

function getAvailablePlatforms(biz: Business): Platform[] {
  const available: Platform[] = []
  if (biz.google_review_url) available.push('google')
  if (biz.tripadvisor_url) available.push('tripadvisor')
  if (biz.trustpilot_url) available.push('trustpilot')
  return available.length > 0 ? available : ['google']
}

export default function SendPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [form, setForm] = useState({ business_id: '', client_name: '', client_email: '', client_phone: '', platform_override: '' as Platform | '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const selectedBusiness = businesses.find(b => b.id === form.business_id) ?? null
  const effectivePlatform: Platform = selectedBusiness
    ? (form.platform_override || getEffectivePlatform(selectedBusiness))
    : 'google'
  const availablePlatforms: Platform[] = selectedBusiness ? getAvailablePlatforms(selectedBusiness) : []

  useEffect(() => {
    const supabase = createClient()
    supabase.from('review_businesses').select('*').order('name').then(({ data }) => {
      if (data) setBusinesses(data as Business[])
    })
  }, [])

  // Reset override when business changes
  useEffect(() => {
    setForm(f => ({ ...f, platform_override: '' }))
  }, [form.business_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: form.business_id,
          client_name: form.client_name,
          client_email: form.client_email,
          client_phone: form.client_phone,
          platform_override: form.platform_override || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, message: `Email envoyé ✅ — Campagne : ${data.campaign_id ?? 'créée'}` })
        setForm(f => ({ ...f, client_name: '', client_email: '', client_phone: '', platform_override: '' }))
      } else {
        setResult({ success: false, message: data.error ?? 'Erreur inconnue' })
      }
    } catch {
      setResult({ success: false, message: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <main className="px-8 py-10">
      <PageHeader
        title="Envoyer une demande d'avis"
        description="Déclenche immédiatement un email via n8n"
        tutorial={[
          { icon: '🏪', label: "Choisir l'établissement" },
          { icon: '✉️', label: 'Saisir les infos client' },
          { icon: '📧', label: "Envoyer — l'email part immédiatement" },
        ]}
      />

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-8 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Établissement</label>
            <select
              required
              value={form.business_id}
              onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
              className={inputClass}
            >
              <option value="">Sélectionner un établissement…</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Plateforme cible */}
          {selectedBusiness && (
            <div className={`rounded-xl border px-4 py-3 ${PLATFORM_LABELS[effectivePlatform].color}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {PLATFORM_LABELS[effectivePlatform].icon} Plateforme cible : <strong>{PLATFORM_LABELS[effectivePlatform].label}</strong>
                </div>
                {availablePlatforms.length > 1 && (
                  <select
                    value={form.platform_override}
                    onChange={e => setForm(f => ({ ...f, platform_override: e.target.value as Platform | '' }))}
                    className="text-xs border border-current/30 rounded-lg px-2 py-1 bg-transparent focus:outline-none"
                  >
                    <option value="">Par défaut</option>
                    {availablePlatforms.map(p => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p].label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du client</label>
            <input
              required
              type="text"
              placeholder="Marie Dupont"
              value={form.client_name}
              onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email du client</label>
            <input
              required
              type="email"
              placeholder="marie@email.com"
              value={form.client_email}
              onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={form.client_phone}
              onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
              className={inputClass}
            />
          </div>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Envoi en cours…' : "📧 Envoyer la demande d'avis"}
          </button>
        </form>
      </div>
    </main>
  )
}
