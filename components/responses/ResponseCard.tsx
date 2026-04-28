'use client'

import { useState } from 'react'
import type { ReviewResponse, Platform, ReviewSentiment } from '@/lib/types'

const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; badgeClass: string; linkLabel: string }> = {
  google: {
    label: 'Google',
    icon: '🔵',
    badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200',
    linkLabel: 'Ouvrir Google Business',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    icon: '🟢',
    badgeClass: 'bg-teal-100 text-teal-700 border border-teal-200',
    linkLabel: 'Ouvrir TripAdvisor',
  },
  trustpilot: {
    label: 'TrustPilot',
    icon: '✅',
    badgeClass: 'bg-green-100 text-green-700 border border-green-200',
    linkLabel: 'Ouvrir TrustPilot',
  },
  yelp: {
    label: 'Yelp',
    icon: '🔴',
    badgeClass: 'bg-red-100 text-red-700 border border-red-200',
    linkLabel: 'Ouvrir Yelp Biz',
  },
  thefork: {
    label: 'TheFork',
    icon: '🍴',
    badgeClass: 'bg-orange-100 text-orange-700 border border-orange-200',
    linkLabel: 'Ouvrir TheFork Manager',
  },
}

const SENTIMENT_CONFIG: Record<ReviewSentiment, { label: string; badgeClass: string; leftBorder: string }> = {
  positive: {
    label: 'Positif',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    leftBorder: 'border-l-emerald-400',
  },
  mixed: {
    label: 'Mixte',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    leftBorder: 'border-l-amber-400',
  },
  neutral: {
    label: 'Neutre',
    badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
    leftBorder: 'border-l-gray-300',
  },
  negative: {
    label: 'Négatif',
    badgeClass: 'bg-orange-100 text-orange-700 border border-orange-200',
    leftBorder: 'border-l-orange-400',
  },
  crisis: {
    label: 'CRISE',
    badgeClass: 'bg-red-100 text-red-700 border border-red-300',
    leftBorder: 'border-l-red-500',
  },
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <span className="text-sm text-amber-400 tracking-tight">
      {'★'.repeat(rating)}
      <span className="text-gray-200">{'★'.repeat(5 - rating)}</span>
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

  async function handleCopyAndOpen(url: string) {
    if (response.reply_text) {
      try {
        await navigator.clipboard.writeText(response.reply_text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // clipboard may fail silently — still open the portal
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer')
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

  const formattedDate = response.review_date
    ? new Date(response.review_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : response.created_at
    ? new Date(response.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Base card style: white with colored left border by sentiment
  const opacity = isPublished || isDismissed ? 'opacity-70' : ''
  const cardBase = `bg-white rounded-xl border border-gray-200 border-l-4 ${sentiment.leftBorder} shadow-md transition-all ${opacity}`

  return (
    <div className={cardBase}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${platform.badgeClass}`}>
            {platform.icon} {platform.label}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sentiment.badgeClass}`}>
            {sentiment.label}
          </span>
          <StarRating rating={response.reviewer_rating} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPublished && (
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✅ Publié</span>
          )}
          {isDismissed && (
            <span className="text-xs text-gray-400 font-semibold bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">🚫 Ignoré</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-2.5 flex items-center gap-2 text-xs text-gray-500 bg-gray-50/60 border-b border-gray-100">
        {response.businesses?.name && (
          <span className="font-semibold text-gray-700">{response.businesses.name}</span>
        )}
        {response.businesses?.name && <span className="text-gray-300">·</span>}
        <span>{response.reviewer_name ?? 'Anonyme'}</span>
        {formattedDate && (
          <>
            <span className="text-gray-300">·</span>
            <span>{formattedDate}</span>
          </>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Alerte crise */}
        {isCrisis && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 font-medium flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>Avis de crise détecté — Ne pas répondre publiquement sans consultation préalable. Gérer directement avec l&apos;équipe.</span>
          </div>
        )}

        {/* Review text */}
        {response.review_text && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Avis client</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 italic">
              &ldquo;{response.review_text}&rdquo;
            </p>
          </div>
        )}

        {/* Reply */}
        {!isCrisis && response.reply_text && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">✍️ Réponse suggérée</p>
            <div className="relative">
              <div className="text-sm text-gray-800 leading-relaxed bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm pr-12 whitespace-pre-wrap">
                {response.reply_text}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                title="Copier la réponse"
              >
                {copied ? '✅' : '📋'}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-600 font-medium mt-1.5 ml-1">Copié dans le presse-papier !</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/40 rounded-b-xl">
        {!isCrisis && !isPublished && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition-all shadow-sm"
          >
            {copied ? '✅ Copié !' : '📋 Copier la réponse'}
          </button>
        )}

        {response.manage_url && (
          <button
            onClick={() => handleCopyAndOpen(response.manage_url!)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all shadow-sm border ${platform.badgeClass} hover:opacity-80`}
            title={response.reply_text ? 'Copie la réponse + ouvre la plateforme' : 'Ouvrir la plateforme'}
          >
            {response.reply_text ? '📋🔗' : '🔗'} {platform.linkLabel}
          </button>
        )}

        <div className="flex-1" />

        {!isPublished && !isDismissed && !isCrisis && (
          <button
            onClick={() => handleStatus('published')}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            ✅ Marquer comme publié
          </button>
        )}

        {!isDismissed && !isPublished && (
          <button
            onClick={() => handleStatus('dismissed')}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 transition-all disabled:opacity-50 shadow-sm"
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
