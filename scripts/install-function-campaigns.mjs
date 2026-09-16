import { loadEnv } from 'vite';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const env = loadEnv('development', process.cwd(), '');
const ref = new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
if (ref !== (await readFile('supabase/.temp/project-ref','utf8')).trim()) throw new Error('Projeto incorreto.');
const cli = (args) => execFileSync('/opt/homebrew/bin/supabase', args, { encoding:'utf8', stdio: ['ignore','pipe','pipe'] });
const secret = randomBytes(32).toString('hex');
const envFile = '.email-campaigns.local/function-secrets.env';
const sqlFile = '.email-campaigns.local/function-cron.sql';
try {
  await writeFile(envFile, ['RESEND_API_KEY','RESEND_FROM_EMAIL','RESEND_REPLY_TO'].map(key => `${key}=${env[key] || ''}`).concat(`CAMPAIGN_TRIGGER_SECRET=${secret}`).join('\n'), {mode:0o600});
  cli(['db','query','--linked','--file','supabase/function_email_campaigns.sql']);
  cli(['secrets','set','--project-ref',ref,'--env-file',envFile]);
  console.log(cli(['functions','deploy','send-wedding-campaign','--project-ref',ref,'--use-api','--no-verify-jwt']));
  const sql = `
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
do $$ begin
 if exists(select 1 from vault.secrets where name='wedding_campaign_trigger') then
 perform vault.update_secret((select id from vault.secrets where name='wedding_campaign_trigger'),'${secret}');
 else perform vault.create_secret('${secret}','wedding_campaign_trigger'); end if;
end $$;
select cron.schedule('wedding-email-function','* * * * *', $cron$
select net.http_post(
 url := 'https://${ref}.supabase.co/functions/v1/send-wedding-campaign',
 headers := jsonb_build_object('Content-Type','application/json','x-campaign-secret',(select decrypted_secret from vault.decrypted_secrets where name='wedding_campaign_trigger')),
 body := '{}'::jsonb, timeout_milliseconds := 60000
) where exists(select 1 from public.function_email_campaigns where status in ('pending','processing') and scheduled_at<=now() and scheduled_at>now()-interval '1 hour' and (lease_until is null or lease_until<now()));
$cron$);
insert into public.function_email_campaigns(kind,scheduled_at) values
 ('wedding_reminder','2026-09-19T18:04:00Z'),
 ('table_assignment','2026-09-26T13:30:00Z')
on conflict(kind) do nothing;
select kind,scheduled_at,status from public.function_email_campaigns;
`;
  await writeFile(sqlFile,sql,{mode:0o600});
  // Do not print SQL or CLI errors which might include the secret.
  cli(['db','query','--linked','--file',sqlFile]);
  const response = await fetch(`https://${ref}.supabase.co/functions/v1/send-wedding-campaign`, {method:'POST',headers:{'x-campaign-secret':secret,'Content-Type':'application/json'},body:'{}'});
  const result=await response.json();
  if(!response.ok || result.due!==0) throw new Error('Verificar função: resposta inesperada.');
  console.log('Função publicada; cron ativo; campanhas futuras configuradas. Verificação: zero campanhas vencidas, zero emails enviados.');
} catch {
  console.error('Configuração incompleta. Consultar estado do Supabase antes de repetir.');
  process.exitCode=1;
} finally {
  await unlink(envFile).catch(()=>{}); await unlink(sqlFile).catch(()=>{});
}
