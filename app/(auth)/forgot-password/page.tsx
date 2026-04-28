'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // Toujours afficher le succès — ne pas révéler si le compte existe
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-3xl mb-4">📧</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
        <p className="text-sm text-gray-500 mb-6">
          Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation a été envoyé. Vérifie tes spams.
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline font-medium">
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
      <p className="text-sm text-gray-500 mb-6">Saisis ton email — on t&apos;enverra un lien de réinitialisation.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@example.com"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-400">
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          ← Retour à la connexion
        </Link>
      </p>
    </>
  )
}
