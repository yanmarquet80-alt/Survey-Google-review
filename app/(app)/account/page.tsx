'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/PageHeader'

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AccountPage() {
  const supabase = createClient()
  const [email, setEmail] = useState<string>('')
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (newPwd.length < 8) {
      setMsg({ ok: false, text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (newPwd !== confirmPwd) {
      setMsg({ ok: false, text: 'Les deux nouveaux mots de passe ne correspondent pas.' })
      return
    }
    if (newPwd === currentPwd) {
      setMsg({ ok: false, text: 'Le nouveau mot de passe doit être différent de l\'ancien.' })
      return
    }

    setLoading(true)

    // 1. Vérifier le mot de passe actuel via une re-authentification
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPwd,
    })

    if (signInErr) {
      setMsg({ ok: false, text: 'Mot de passe actuel incorrect.' })
      setLoading(false)
      return
    }

    // 2. Mettre à jour le mot de passe
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd })

    if (updateErr) {
      setMsg({ ok: false, text: updateErr.message })
      setLoading(false)
      return
    }

    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setMsg({ ok: true, text: 'Mot de passe mis à jour avec succès ✅' })
    setLoading(false)
  }

  return (
    <main className="px-8 py-10">
      <PageHeader
        title="Mon compte"
        description="Gérez votre adresse email et votre mot de passe."
        tutorial={[
          { icon: '🔐', label: 'Saisir le mot de passe actuel' },
          { icon: '🆕', label: 'Choisir le nouveau (8 caractères min)' },
          { icon: '✅', label: 'Confirmer pour appliquer' },
        ]}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Carte infos compte */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Identité</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-gray-900 break-all">{email || '…'}</p>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pour modifier votre email, contactez l&apos;administrateur Supabase.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire changement de mot de passe */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Changer mon mot de passe</h3>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="8 caractères minimum"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              {msg && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    msg.ok
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
