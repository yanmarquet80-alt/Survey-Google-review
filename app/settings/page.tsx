'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business, BusinessType } from '@/lib/types'

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hôtel' },
  { value: 'health', label: 'Santé' },
  { value: 'beauty', label: 'Beauté' },
  { value: 'retail', label: 'Commerce' },
  { value: 'other', label: 'Autre' },
]

const emptyForm = {
  name: '',
  type: 'other' as BusinessType,
  google_review_url: '',
  owner_email: '',
  smtp_from: '',
  reminder_delay_days: 3,
  email_subject: '',
  reminder_subject: '',
}

export default function SettingsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selected, setSelected] = useState<Business | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    createClient().from('review_businesses').select('*').order('name').then(({ data }) => {
      if (data) setBusinesses(data as Business[])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectBusiness(biz: Business | null) {
    setSelected(biz)
    setMsg(null)
    if (!biz) {
      setForm(emptyForm)
    } else {
      setForm({
        name: biz.name,
        type: biz.type,
        google_review_url: biz.google_review_url,
        owner_email: biz.owner_email,
        smtp_from: biz.config.smtp_from ?? '',
        reminder_delay_days: biz.config.reminder_delay_days ?? 3,
        email_subject: biz.config.email_subject ?? '',
        reminder_subject: biz.config.reminder_subject ?? '',
      })
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const payload = {
      name: form.name,
      type: form.type,
      google_review_url: form.google_review_url,
      owner_email: form.owner_email,
      config: {
        smtp_from: form.smtp_from || undefined,
        reminder_delay_days: form.reminder_delay_days,
        email_subject: form.email_subject || undefined,
        reminder_subject: form.reminder_subject || undefined,
      },
      updated_at: new Date().toISOString(),
    }

    let error
    if (selected) {
      ;({ error } = await supabase.from('review_businesses').update(payload).eq('id', selected.id))
    } else {
      const { data, error: err } = await supabase.from('review_businesses').insert(payload).select().single()
      error = err
      if (data) {
        setBusinesses(prev => [...prev, data as Business])
        setSelected(data as Business)
      }
    }

    if (error) {
      setMsg({ ok: false, text: error.message })
    } else {
      setMsg({ ok: true, text: selected ? 'Établissement mis à jour ✅' : 'Établissement créé ✅' })
      if (selected) {
        setBusinesses(prev => prev.map(b => b.id === selected.id ? { ...b, ...payload } as Business : b))
      }
    }
    setSaving(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: field === 'reminder_delay_days' ? parseInt(e.target.value) || 3 : e.target.value }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">⭐ Avis Google — Dashboard</h1>
        <div className="flex gap-6 text-sm">
          <a href="/" className="text-gray-500 hover:text-gray-900">Aperçu</a>
          <a href="/campaigns" className="text-gray-500 hover:text-gray-900">Campagnes</a>
          <a href="/send" className="text-gray-500 hover:text-gray-900">Envoyer</a>
          <a href="/settings" className="font-medium text-blue-600">Paramètres</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-500 mt-1">Gérer les établissements clients</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Établissements</h3>
                <button
                  onClick={() => selectBusiness(null)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  + Nouveau
                </button>
              </div>
              <ul className="space-y-1">
                {businesses.map(b => (
                  <li key={b.id}>
                    <button
                      onClick={() => selectBusiness(b)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selected?.id === b.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
                {businesses.length === 0 && (
                  <li className="text-xs text-gray-400 px-3 py-2">Aucun établissement</li>
                )}
              </ul>
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-5">
                {selected ? `Modifier — ${selected.name}` : 'Nouvel établissement'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                    <input required type="text" value={form.name} onChange={f('name')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select value={form.type} onChange={f('type')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">URL Google Reviews</label>
                  <input required type="url" value={form.google_review_url} onChange={f('google_review_url')}
                    placeholder="https://g.page/r/..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email propriétaire</label>
                    <input required type="email" value={form.owner_email} onChange={f('owner_email')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email expéditeur (SMTP from)</label>
                    <input type="email" value={form.smtp_from} onChange={f('smtp_from')}
                      placeholder="noreply@etablissement.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Délai de relance (jours)
                  </label>
                  <input type="number" min={1} max={30} value={form.reminder_delay_days} onChange={f('reminder_delay_days')}
                    className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Objet email initial <span className="text-gray-400">(laissez vide pour valeur par défaut)</span></label>
                  <input type="text" value={form.email_subject} onChange={f('email_subject')}
                    placeholder="Merci pour votre visite !"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Objet email de relance <span className="text-gray-400">(laissez vide pour valeur par défaut)</span></label>
                  <input type="text" value={form.reminder_subject} onChange={f('reminder_subject')}
                    placeholder="⏰ Rappel — votre avis nous tient à cœur"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {msg && (
                  <div className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {msg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {saving ? 'Enregistrement…' : selected ? 'Mettre à jour' : "Créer l'établissement"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
