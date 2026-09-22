-- BillTech — "Escritório Virtual": follow-up, cold calls e metas.
-- Executar depois de 005_broadcasts.sql. Idempotente.
--
-- Nota de arquitetura: `leads` e `deals` do pedido original CONTINUAM mock (src/data/mock/leads.ts),
-- reutilizando o Pipeline de 6 etapas já existente (que já faz o papel de Deal Board). Só o que é
-- genuinamente novo nesta iteração — follow-up/cold calls (interactions) e metas (goals) — fica aqui,
-- persistido de verdade. Ferramenta de uso interno e pessoal: sem RLS pública, só is_admin().

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  -- Os leads ainda são mock (sem tabela própria), por isso o id é texto livre e guardamos uma cópia
  -- do nome da empresa em vez de um JOIN a uma tabela `leads` que ainda não existe.
  lead_id text not null,
  lead_label text not null default '',
  type text not null check (type in ('cold_call', 'whatsapp', 'reuniao', 'email', 'follow_up')),
  occurred_at timestamptz not null default now(),
  duration_min int check (duration_min is null or duration_min >= 0),
  outcome text not null check (outcome in ('sucesso', 'sem_resposta', 'interessado', 'nao_interessado', 'agendado')),
  notes text not null default '',
  next_step text not null default '',
  admin_id uuid references public.profiles (id) on delete set null,
  admin_email text not null,
  created_at timestamptz not null default now()
);
create index if not exists interactions_lead_idx on public.interactions (lead_id, occurred_at desc);
create index if not exists interactions_occurred_idx on public.interactions (occurred_at desc);
create index if not exists interactions_type_idx on public.interactions (type);

alter table public.interactions enable row level security;
drop policy if exists "interactions_admin" on public.interactions;
create policy "interactions_admin" on public.interactions for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('diaria', 'semanal', 'mensal', 'anual')),
  metric text not null check (metric in ('cold_calls', 'meetings', 'revenue', 'win_rate', 'proposals_value')),
  target numeric not null check (target >= 0),
  -- Chave do período: 'AAAA-MM-DD' (diária) · 'AAAA-Wss' ISO (semanal) · 'AAAA-MM' (mensal) · 'AAAA' (anual)
  period text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_type, metric, period)
);
create index if not exists goals_lookup_idx on public.goals (period_type, metric, period);

alter table public.goals enable row level security;
drop policy if exists "goals_admin" on public.goals;
create policy "goals_admin" on public.goals for all using (public.is_admin()) with check (public.is_admin());
