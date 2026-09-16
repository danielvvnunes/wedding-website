begin;
create table if not exists public.function_email_campaigns (
 id uuid primary key default gen_random_uuid(),
 kind text not null unique check (kind in ('wedding_reminder','table_assignment')),
 scheduled_at timestamptz not null,
 status text not null default 'pending' check (status in ('pending','processing','sent','canceled','failed')),
 batch jsonb,
 first_attempt_at timestamptz,
 lease_until timestamptz,
 error text,
 sent_at timestamptz,
 provider_result jsonb
);
alter table public.function_email_campaigns enable row level security;
revoke all on public.function_email_campaigns from anon, authenticated;
grant all on public.function_email_campaigns to service_role;
-- Old test sends must not prevent the real campaign to the same address.
drop index if exists public.table_email_jobs_active_kind_email;
create unique index if not exists table_email_jobs_campaign_email on public.table_email_jobs(campaign_id,email);
create or replace function public.claim_due_email_campaign()
returns setof public.function_email_campaigns language sql security definer set search_path=public as $$
 update function_email_campaigns set status='processing',lease_until=now()+interval '2 minutes'
 where id=(select id from function_email_campaigns
 where status in ('pending','processing') and scheduled_at<=now()
 and scheduled_at>now()-interval '1 hour'
 and (lease_until is null or lease_until<now())
 order by scheduled_at for update skip locked limit 1)
 returning *;
$$;
create or replace function public.finish_email_campaign(campaign uuid, result jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare c function_email_campaigns; item jsonb; n integer:=0;
begin
 select * into c from function_email_campaigns where id=campaign for update;
 if c.status='sent' then return; end if;
 if c.status<>'processing' or jsonb_array_length(c.batch)<>jsonb_array_length(result->'data') then raise exception 'Invalid batch result'; end if;
 for item in select value from jsonb_array_elements(c.batch) loop
 insert into table_email_jobs(campaign_id,kind,email,payload,scheduled_at,status,resend_id,first_attempt_at)
 values(c.id::text,c.kind,item->'to'->>0,item,c.scheduled_at,'sent',result->'data'->n->>'id',c.first_attempt_at);
 n:=n+1;
 end loop;
 update function_email_campaigns set status='sent',sent_at=now(),provider_result=result,error=null,lease_until=null where id=campaign;
end $$;
revoke all on function public.claim_due_email_campaign() from public,anon,authenticated;
revoke all on function public.finish_email_campaign(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.claim_due_email_campaign() to service_role;
grant execute on function public.finish_email_campaign(uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
