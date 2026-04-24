'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/lib/types'

export default function SendPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [form, setForm] = useState({ business_id: '', client_name: '', client_email: '', client_phone: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('businesses').select('id, name').order('name').then(({ data }) => {
      if (data) setBusinesses(data as Business[])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, message: `Email envoyé ✅ — Campagne : ${data.campaign_id ?? 'créée'}` })
        setForm(f => ({ ...f, client_name: '', client_email: '', client_phone: '' }))
      } else {
        setResult({ success: false, message: data.error ?? 'Erreur inconnue' })
      }
    } catch {
      setResult({ success: false, message: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">⭐ Avis Google — Dashboard</h1>
        <div className="flex gap-6 text-sm">
          <a href="/" className="text-gray-500 hover:text-gray-900">Aperçu</a>
          <a href="/campaigns" className="text-gray-500 hover:text-gray-900">Campagnes</a>
          <a href="/send" className="font-medium text-blue-600">Envoyer</a>
          <a href="/settings" className="text-gray-500 hover:text-gray-900">Paramètres</a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Envoyer une demande d&apos;avis</h2>
          <p className="text-gray-500 mt-1">Déclenche immédiatement un email via n8n</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Établissement</label>
              <select
                required
                value={form.business_id}
                onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un établissement…</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du client</label>
              <input
                required
                type="text"
                placeholder="Marie Dupont"
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  )
}
