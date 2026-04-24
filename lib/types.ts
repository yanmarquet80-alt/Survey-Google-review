export type BusinessType = 'restaurant' | 'hotel' | 'health' | 'beauty' | 'retail' | 'other'

export type CampaignStatus = 'pending' | 'sent' | 'reminder_sent' | 'reviewed' | 'expired'

export interface BusinessConfig {
  smtp_from?: string
  reminder_delay_days?: number
  email_subject?: string
  email_template?: string
  reminder_subject?: string
  reminder_template?: string
}

export interface Business {
  id: string
  name: string
  type: BusinessType
  google_review_url: string
  owner_email: string
  config: BusinessConfig
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  business_id: string
  name: string
  email: string
  phone: string | null
  created_at: string
}

export interface Campaign {
  id: string
  client_id: string
  business_id: string
  status: CampaignStatus
  sent_at: string | null
  reminder_at: string | null
  reminder_sent_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  clients?: Pick<Client, 'name' | 'email'>
}

export interface DashboardStats {
  total: number
  sent: number
  reminder_sent: number
  reviewed: number
  conversion_rate: number
  weekly: { week: string; count: number }[]
}
