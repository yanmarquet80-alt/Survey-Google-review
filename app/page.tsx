import type { DashboardStats } from '@/lib/types'

async function getStats(): Promise<DashboardStats | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stats`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

export default async function OverviewPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">⭐ Avis Google — Dashboard</h1>
        <div className="flex gap-6 text-sm">
          <a href="/" className="font-medium text-blue-600">Aperçu</a>
          <a href="/campaigns" className="text-gray-500 hover:text-gray-900">Campagnes</a>
          <a href="/send" className="text-gray-500 hover:text-gray-900">Envoyer</a>
          <a href="/settings" className="text-gray-500 hover:text-gray-900">Paramètres</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Vue d&apos;ensemble</h2>
          <p className="text-gray-500 mt-1">Suivi des sollicitations d&apos;avis Google</p>
        </div>

        {!stats ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800 text-sm">
            ⚠️ Impossible de charger les statistiques. Vérifiez votre configuration Supabase dans <code className="bg-yellow-100 px-1 rounded">.env.local</code>.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard label="Total envois" value={stats.total} />
              <StatCard
                label="En attente de réponse"
                value={stats.sent + stats.reminder_sent}
                sub={`dont ${stats.reminder_sent} relancés`}
              />
              <StatCard label="Avis obtenus" value={stats.reviewed} />
              <StatCard label="Taux de conversion" value={`${stats.conversion_rate}%`} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-6">Envois par semaine</h3>
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
    </div>
  )
}
