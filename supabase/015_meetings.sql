-- BillTech — reuniões agendadas com leads, a sério (antes só existiam na sessão do browser e
-- desapareciam ao atualizar a página). Ferramenta de uso interno, sem RLS pública — só is_admin(),
-- como `leads`/`goals`/`interactions`. Idempotente.

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null references public.leads (id) on delete cascade,
  title text not null,
  start timestamptz not null,
  duration_min int not null default 30 check (duration_min > 0),
  kind text not null default 'reuniao' check (kind in ('reuniao', 'demo', 'follow-up')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists meetings_start_idx on public.meetings (start);
create index if not exists meetings_lead_idx on public.meetings (lead_id);

alter table public.meetings enable row level security;
drop policy if exists "meetings_admin" on public.meetings;
create policy "meetings_admin" on public.meetings for all using (public.is_admin()) with check (public.is_admin());
