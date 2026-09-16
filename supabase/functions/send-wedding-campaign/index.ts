import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildCampaignBatch } from '../../../src/lib/campaignBatch.js';

Deno.serve(async (req) => {
  const secret = Deno.env.get('CAMPAIGN_TRIGGER_SECRET');
  if (!secret || req.headers.get('x-campaign-secret') !== secret) return new Response('Unauthorized', { status: 401 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const check = ({ data, error }: any) => { if (error) throw new Error(error.message); return data; };
  let campaign: any;
  try {
    const campaigns = check(await db.rpc('claim_due_email_campaign'));
    campaign = campaigns[0];
    if (!campaign) return Response.json({ due: 0 });
    if (!campaign.batch) {
      const rows = [];
      for (let start = 0; ; start += 1000) {
        const page = check(await db.from('rsvp').select('id,people').order('id').range(start, start + 999));
        rows.push(...page);
        if (page.length < 1000) break;
      }
      campaign.batch = buildCampaignBatch(rows, campaign.kind, Deno.env.get('RESEND_FROM_EMAIL'), Deno.env.get('RESEND_REPLY_TO') || 'casamento.franciscadaniel@gmail.com');
      check(await db.from('function_email_campaigns').update({ batch: campaign.batch }).eq('id', campaign.id));
    }
    // Persist the exact payload before calling the provider. Every retry uses the same key and body.
    if (!campaign.first_attempt_at) check(await db.from('function_email_campaigns').update({ first_attempt_at: new Date().toISOString() }).eq('id', campaign.id));
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': `wedding-batch-${campaign.id}` },
      body: JSON.stringify(campaign.batch), signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Resend HTTP ${response.status}`);
    if (result.data?.length !== campaign.batch.length || !result.data.every((item: any) => typeof item.id === 'string')) throw new Error('Resposta inválida do Resend.');
    check(await db.rpc('finish_email_campaign', { campaign: campaign.id, result }));
    return Response.json({ sent: result.data.length, kind: campaign.kind });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    if (campaign) await db.from('function_email_campaigns').update({ error: message }).eq('id', campaign.id);
    return Response.json({ error: message }, { status: 500 });
  }
});
