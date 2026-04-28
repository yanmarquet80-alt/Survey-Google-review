import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/PageHeader'
import type { DashboardStats, Platform } from '@/lib/types'

export const dynamic = 'force-dynamic'

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

async function getStats(): Promise<DashboardStats | null> {
  try {
    const supabase = createClient()
    const { data: campaigns, error } = await supabase
      .from('review_campaigns')
      .select('status, created_at, platform')

    if (error || !campaigns) return null

    const total = campaigns.length
    const sent = campaigns.filter(c => c.status === 'sent').length
    const reminder_sent = campaigns.filter(c => c.status === 'reminder_sent').length
    const reviewed = campaigns.filter(c => c.status === 'reviewed').length
    const conversion_rate = total > 0 ? Math.round((reviewed / total) * 100) : 0

    const weekMap: Record<string, number> = {}
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      weekMap[`S${getWeek(d)}`] = 0
    }
    campaigns.forEach(c => {
      const d = new Date(c.created_at)
      const key = `S${getWeek(d)}`
      if (key in weekMap) weekMap[key]++
    })
    const weekly = Object.entries(weekMap).map(([week, count]) => ({ week, count }))

    const platforms: Platform[] = ['google', 'tripadvisor', 'trustpilot']
    const by_platform = Object.fromEntries(
      platforms.map(p => {
        const pc = campaigns.filter(c => (c.platform ?? 'google') === p)
        const pTotal = pc.length
        const pReviewed = pc.filter(c => c.status === 'reviewed').length
        return [p, {
          total: pTotal,
          reviewed: pReviewed,
          conversion_rate: pTotal > 0 ? Math.round((pReviewed / pTotal) * 100) : 0,
        }]
      })
    ) as DashboardStats['by_platform']

    return { total, sent, reminder_sent, reviewed, conversion_rate, weekly, by_platform }
  } catch {
    return null
  }
}

const StatCard = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 border-t-4 ${accent} p-6 shadow-md`}>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

const PLATFORM_CONFIG = {
  google: {
    label: 'Google',
    icon: '🔵',
    accent: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    icon: '🟢',
    accent: 'border-teal-200 bg-teal-50',
    badge: 'bg-teal-100 text-teal-700',
  },
  trustpilot: {
    label: 'TrustPilot',
    icon: '✅',
    accent: 'border-green-200 bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },
} as const

export default async function OverviewPage() {
  const stats = await getStats()

  return (
    <main className="px-8 py-10">
      <PageHeader
        title="Vue d'ensemble"
        description="Toutes plateformes · Google, TripAdvisor, TrustPilot"
        tutorial={[
          { icon: '📊', label: 'Suivre le taux de conversion' },
          { icon: '🏪', label: 'Analyser par plateforme' },
          { icon: '📅', label: 'Identifier les semaines creuses' },
        ]}
      />

      {!stats ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 text-sm">
          ⚠️ Impossible de charger les statistiques. Vérifiez votre configuration Supabase dans <code className="bg-yellow-100 px-1 rounded">.env.local</code>.
        </div>
      ) : (
        <>
          {/* Stats globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total envois" value={stats.total} accent="border-t-blue-500" />
            <StatCard
              label="En attente de réponse"
              value={stats.sent + stats.reminder_sent}
              sub={`dont ${stats.reminder_sent} relancés`}
              accent="border-t-amber-500"
            />
            <StatCard label="Avis obtenus" value={stats.reviewed} accent="border-t-emerald-500" />
            <StatCard label="Taux de conversion" value={`${stats.conversion_rate}%`} accent="border-t-violet-500" />
          </div>

          {/* Stats par plateforme */}
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Par plateforme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {(['google', 'tripadvisor', 'trustpilot'] as Platform[]).map(p => {
              const cfg = PLATFORM_CONFIG[p]
              const ps = stats.by_platform[p]
              return (
                <div key={p} className={`rounded-2xl border-2 p-5 shadow-sm ${cfg.accent}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{cfg.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">{cfg.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{ps.reviewed}</p>
                      <p className="text-xs text-gray-500 mt-0.5">avis obtenus</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-700">{ps.conversion_rate}%</p>
                      <p className="text-xs text-gray-500">conversion</p>
                    </div>
                  </div>
                  {ps.total > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-white rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-current opacity-60"
                          style={{ width: `${ps.conversion_rate}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{ps.total} envois au total</p>
                    </div>
                  )}
                  {ps.total === 0 && (
                    <p className="text-xs text-gray-400 mt-3">Aucun envoi sur cette plateforme</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Graphique hebdomadaire */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-6">Envois par semaine (toutes plateformes)</h3>
            {stats.weekly.every(w => w.count === 0) ? (
              <p className="text-gray-400 text-sm">Aucune donnée pour les 8 dernières semaines</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {stats.weekly.map(({ week, count }) => {
                  const max = Math.max(...stats.weekly.map(w => w.count), 1)
                  const pct = Math.round((count / max) * 100)
                  return (
                    <div key={week} className="flex flex-col items-center flex-1 gap-1">
                      <span className="text-xs text-gray-500">{count > 0 ? count : ''}</span>
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${pct}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                      <span className="text-xs text-gray-400">{week}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
