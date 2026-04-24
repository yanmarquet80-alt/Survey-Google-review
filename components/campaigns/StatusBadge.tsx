import type { CampaignStatus } from '@/lib/types'

const config: Record<CampaignStatus, { label: string; classes: string }> = {
  pending: { label: 'En attente', classes: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Envoyé', classes: 'bg-blue-100 text-blue-700' },
  reminder_sent: { label: 'Relancé', classes: 'bg-yellow-100 text-yellow-700' },
  reviewed: { label: 'Avis laissé ✓', classes: 'bg-green-100 text-green-700' },
  expired: { label: 'Expiré', classes: 'bg-red-100 text-red-600' },
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, classes } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}
