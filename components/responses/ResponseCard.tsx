'use client'

import { useState } from 'react'
import type { ReviewResponse, Platform, ReviewSentiment } from '@/lib/types'

const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; badgeClass: string; linkLabel: string }> = {
  google: {
    label: 'Google',
    icon: '🔵',
    badgeClass: 'bg-blue-100 text-blue-700',
    linkLabel: 'Ouvrir Google Business',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    icon: '🟢',
    badgeClass: 'bg-teal-100 text-teal-700',
    linkLabel: 'Ouvrir TripAdvisor',
  },
  trustpilot: {
    label: 'TrustPilot',
    icon: '✅',
    badgeClass: 'bg-green-100 text-green-700',
    linkLabel: 'Ouvrir TrustPilot',
  },
}

const SENTIMENT_CONFIG: Record<ReviewSentiment, { label: string; badgeClass: string }> = {
  positive: { label: 'Positif', badgeClass: 'bg-emerald-100 text-emerald-700' },
  mixed: { label: 'Mixte', badgeClass: 'bg-yellow-100 text-yellow-700' },
  neutral: { label: 'Neutre', badgeClass: 'bg-gray-100 text-gray-600' },
  negative: { label: 'Négatif', badgeClass: 'bg-orange-100 text-orange-700' },
  crisis: { label: 'CRISE', badgeClass: 'bg-red-100 text-red-700' },
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <span className="text-sm text-yellow-500">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

interface Props {
  response: ReviewResponse
  onStatusChange: (id: string, status: 'published' | 'dismissed' | 'pending') => void
}

export function ResponseCard({ response, onStatusChange }: Props) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const platform = PLATFORM_CONFIG[response.platform]
  const sentiment = SENTIMENT_CONFIG[response.sentiment]
  const isCrisis = response.sentiment === 'crisis'
  const isPublished = response.status === 'published'
  const isDismissed = response.status === 'dismissed'

  async function handleCopy() {
    if (!response.reply_text) return
    await navigator.clipboard.writeText(response.reply_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStatus(status: 'published' | 'dismissed' | 'pending') {
    setLoading(true)
    try {
      await fetch(`/api/responses/${response.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      onStatusChange(response.id, status)
    } finally {
      setLoading(false)
    }
  }

  const cardBorder = isCrisis
    ? 'border-red-200 bg-red-50/30'
    : isPublished
    ? 'border-green-200 bg-green-50/20 opacity-75'
    : isDismissed
    ? 'border-gray-200 opacity-60'
    : 'border-gray-100 bg-white'

  const formattedDate = response.review_date
    ? new Date(response.review_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : response.created_at
    ? new Date(response.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition-all ${cardBorder}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${platform.badgeClass}`}>
            {platform.icon} {platform.label}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sentiment.badgeClass}`}>
            {sentiment.label}
          </span>
          <StarRating rating={response.reviewer_rating} />
        </div>
        <div className="text-right shrink-0">
          {isPublished && (
            <span className="text-xs text-green-600 font-medium">✅ Publié</span>
          )}
          {isDismissed && (
            <span className="text-xs text-gray-400 font-medium">🚫 Ignoré</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        {response.businesses?.name && (
          <span className="font-medium text-gray-700">{response.businesses.name}</span>
        )}
        {response.businesses?.name && <span>·</span>}
        <span>{response.reviewer_name ?? 'Anonyme'}</span>
        {formattedDate && <><span>·</span><span>{formattedDate}</span></>}
      </div>

      {/* Alerte crise */}
      {isCrisis && (
        <div className="mb-4 rounded-xl bg-red-100 border border-red-200 px-4 py-3 text-sm text-red-800 font-medium">
          ⚠️ Avis de crise détecté — Ne pas répondre publiquement sans consultation préalable. Gérer directement avec l&apos;équipe.
        </div>
      )}

      {/* Review text */}
      {response.review_text && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Avis client</p>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            {response.review_text}
          </p>
        </div>
      )}

      {/* Reply */}
      {!isCrisis && response.reply_text && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">✍️ Réponse suggérée</p>
          <div className="relative">
            <p className="text-sm text-gray-800 leading-relaxed bg-white rounded-xl px-4 py-3 border border-gray-200 pr-12 whitespace-pre-wrap">
              {response.reply_text}
            </p>
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              title="Copier la réponse"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-1 ml-1">Copié dans le presse-papier !</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
        {!isCrisis && !isPublished && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {copied ? '✅ Copié !' : '📋 Copier la réponse'}
          </button>
        )}

        {response.manage_url && (
          <a
            href={response.manage_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${platform.badgeClass} hover:opacity-80`}
          >
            🔗 {platform.linkLabel}
          </a>
        )}

        <div className="flex-1" />

        {!isPublished && !isDismissed && !isCrisis && (
          <button
            onClick={() => handleStatus('published')}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
          >
            ✅ Marquer comme publié
          </button>
        )}

        {!isDismissed && !isPublished && (
          <button
            onClick={() => handleStatus('dismissed')}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors disabled:opacity-50"
          >
            🚫 Ignorer
          </button>
        )}

        {(isPublished || isDismissed) && (
          <button
            onClick={() => handleStatus('pending')}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors disabled:opacity-50"
          >
            Remettre en attente
          </button>
        )}
      </div>
    </div>
  )
}
