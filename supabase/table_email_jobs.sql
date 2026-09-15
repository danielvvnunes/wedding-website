-- Idempotent migration: retains all existing jobs and Resend identifiers.
begin;
-- The service role is server-only. Browser/anon clients cannot access this outbox.
create table if not exists public.table_email_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  email text not null,
  payload jsonb not null,
  scheduled_at timestamptz not null,
  status text not null default 'ready' check (status in ('ready', 'processing', 'scheduled', 'sent', 'delivered', 'bounced', 'failed', 'canceled', 'delivery_delayed', 'complained', 'suppressed')),
  resend_id text,
  first_attempt_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table public.table_email_jobs
  add column if not exists kind text not null default 'table_assignment' check (kind in ('table_assignment', 'wedding_reminder')),
  add column if not exists imported boolean not null default false,
  add column if not exists last_checked_at timestamptz;
drop index if exists public.table_email_jobs_active_email;
create unique index if not exists table_email_jobs_active_kind_email
  on public.table_email_jobs (kind, email) where status <> 'canceled';
create unique index if not exists table_email_jobs_resend_id
  on public.table_email_jobs (resend_id);
alter table public.table_email_jobs enable row level security;
revoke all on public.table_email_jobs from anon, authenticated;
grant all on public.table_email_jobs to service_role;
comment on table public.table_email_jobs is 'Wedding email campaigns: frozen payloads and delivery state, isolated by kind. Imported jobs retain their existing Resend identifiers.';
notify pgrst, 'reload schema';
commit;
