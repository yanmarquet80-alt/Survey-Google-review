import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('status, created_at')

  if (!campaigns) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const total = campaigns.length
  const sent = campaigns.filter(c => c.status === 'sent').length
  const reminder_sent = campaigns.filter(c => c.status === 'reminder_sent').length
  const reviewed = campaigns.filter(c => c.status === 'reviewed').length
  const conversion_rate = total > 0 ? Math.round((reviewed / total) * 100) : 0

  // Group by week (last 8 weeks)
  const weekMap: Record<string, number> = {}
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const key = `S${getWeek(d)}`
    weekMap[key] = 0
  }
  campaigns.forEach(c => {
    const d = new Date(c.created_at)
    const key = `S${getWeek(d)}`
    if (key in weekMap) weekMap[key]++
  })
  const weekly = Object.entries(weekMap).map(([week, count]) => ({ week, count }))

  return NextResponse.json({ total, sent, reminder_sent, reviewed, conversion_rate, weekly })
}

function getWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
