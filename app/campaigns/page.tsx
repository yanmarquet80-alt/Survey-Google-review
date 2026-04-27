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
    <main className="px-8 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Campagnes</h2>
        <p className="text-gray-500 mt-1">{campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''} au total</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
        <CampaignTable initialCampaigns={campaigns} />
      </div>
    </main>
  )
}
