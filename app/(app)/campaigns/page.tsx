import { createClient } from '@/lib/supabase/server'
import type { Campaign } from '@/lib/types'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { PageHeader } from '@/components/PageHeader'

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
      <PageHeader
        title="Campagnes"
        description={`${campaigns.length} campagne${campaigns.length !== 1 ? 's' : ''} au total — suivi de toutes les demandes d'avis envoyées.`}
        tutorial={[
          { icon: '🔍', label: 'Filtrer par statut' },
          { icon: '✓', label: "Marquer l'avis reçu manuellement" },
        ]}
      />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
        <CampaignTable initialCampaigns={campaigns} />
      </div>
    </main>
  )
}
