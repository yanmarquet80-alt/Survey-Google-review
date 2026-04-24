import { createClient } from '@/lib/supabase/server'
import type { Campaign } from '@/lib/types'
import { CampaignTable } from '@/components/campaigns/CampaignTable'

async function getCampaigns(): Promise<Campaign[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('review_campaigns')
    .select('*, clients:review_clients(name, email)')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data as Campaign[]) ?? []
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">⭐ Avis Google — Dashboard</h1>
        <div className="flex gap-6 text-sm">
          <a href="/" className="text-gray-500 hover:text-gray-900">Aperçu</a>
          <a href="/campaigns" className="font-medium text-blue-600">Campagnes</a>
          <a href="/send" className="text-gray-500 hover:text-gray-900">Envoyer</a>
          <a href="/settings" className="text-gray-500 hover:text-gray-900">Paramètres</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Campagnes</h2>
          <p className="text-gray-500 mt-1">{campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''} au total</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <CampaignTable initialCampaigns={campaigns} />
        </div>
      </main>
    </div>
  )
}
