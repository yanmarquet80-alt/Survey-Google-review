import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const { status, action } = body as { status?: string; action?: string }

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // ────────────────────────────────────────────────────────────────
  // Action: 'publish' → publication directe sur Google Business Profile
  // via le webhook n8n. Réservé aux avis Google avec gbp_review_name.
  // ────────────────────────────────────────────────────────────────
  if (action === 'publish') {
    const { data: resp, error: fetchErr } = await supabase
      .from('review_responses')
      .select('gbp_review_name, reply_text, platform, status')
      .eq('id', id)
      .single()

    if (fetchErr || !resp) {
      return NextResponse.json({ error: 'Réponse introuvable' }, { status: 404 })
    }
    if (resp.platform !== 'google') {
      return NextResponse.json({ error: 'Publication GBP réservée aux avis Google' }, { status: 400 })
    }
    if (!resp.gbp_review_name) {
      return NextResponse.json({ error: 'gbp_review_name manquant pour cet avis' }, { status: 400 })
    }
    if (!resp.reply_text) {
      return NextResponse.json({ error: 'reply_text vide' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_GBP_PUBLISH_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_GBP_PUBLISH_WEBHOOK_URL non configuré' }, { status: 500 })
    }

    let webhookResult: { success: boolean; error?: string; updateTime?: string }
    try {
      const r = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gbp_review_name: resp.gbp_review_name,
          reply_text: resp.reply_text,
          response_id: id,
        }),
      })
      webhookResult = await r.json()
    } catch (e) {
      return NextResponse.json(
        { error: `Webhook GBP injoignable : ${e instanceof Error ? e.message : String(e)}` },
        { status: 502 }
      )
    }

    if (!webhookResult.success) {
      return NextResponse.json(
        { error: webhookResult.error || 'Échec de la publication GBP' },
        { status: 502 }
      )
    }

    const { error: updateErr } = await supabase
      .from('review_responses')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, gbp_update_time: webhookResult.updateTime })
  }

  // ────────────────────────────────────────────────────────────────
  // Action par défaut : mise à jour du statut (published / dismissed / pending)
  // Pour plateformes ≠ Google ou pour marquer manuellement.
  // ────────────────────────────────────────────────────────────────
  if (!status || !['published', 'dismissed', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'published') {
    update.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('review_responses')
    .update(update)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
