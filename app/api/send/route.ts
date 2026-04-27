import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { business_id, client_name, client_email, client_phone, platform_override } = body

  if (!business_id || !client_name || !client_email) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL non configuré' }, { status: 500 })
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id,
      client_name,
      client_email,
      client_phone: client_phone || null,
      platform_override: platform_override || null,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Erreur lors de l'envoi via n8n" }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return NextResponse.json({ success: true, campaign_id: data.campaign_id ?? null })
}
