-- BillTech — Marketing: campanhas pagas (Meta/Google/TikTok/LinkedIn) e métricas diárias brutas, para
-- analytics de CAC/CPL/ROAS reais (substitui o ACQUISITION_SPEND_90D fixo em src/data/mock/dashboard.ts,
-- na Fase 2) e atribuição opcional de leads à campanha que os gerou. Sem integração ao vivo com
-- plataformas de anúncios (sem OAuth/webhooks) — registo manual diário pelo admin, como o resto do
-- Financeiro ("sem Stripe ativo, tudo o que entra é cobrado fora da plataforma"). Ferramenta de uso
-- interno e pessoal: sem RLS pública, só is_admin(), como `leads`/`goals`/`expenses`. Idempotente.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text not null check (platform in ('meta', 'google', 'tiktok', 'linkedin', 'outro')),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'terminada')),
  started_at date not null default current_date,
  ended_at date,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_started_idx on public.campaigns (started_at desc);

alter table public.campaigns enable row level security;
drop policy if exists "campaigns_admin" on public.campaigns;
create policy "campaigns_admin" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- Números brutos diários por campanha. CTR/CPC/CPM/CPL/ROAS são SEMPRE calculados em runtime a partir
-- destas colunas (src/lib/marketing/metrics.ts), nunca guardados — mesmo princípio de
-- src/lib/finance/progress.ts (paymentProgress): evita bugs de desincronização entre o valor guardado
-- e os números brutos que lhe deram origem.
create table if not exists public.campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  date date not null,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  spend numeric not null default 0 check (spend >= 0),
  leads_count int not null default 0 check (leads_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, date)
);
create index if not exists campaign_metrics_campaign_idx on public.campaign_metrics (campaign_id, date desc);
create index if not exists campaign_metrics_date_idx on public.campaign_metrics (date desc);

alter table public.campaign_metrics enable row level security;
drop policy if exists "campaign_metrics_admin" on public.campaign_metrics;
create policy "campaign_metrics_admin" on public.campaign_metrics for all using (public.is_admin()) with check (public.is_admin());

-- Atribuição opcional: a que campanha paga este lead pertence (null = orgânico/indicação/etc.) — campo
-- ortogonal ao `channel` já existente, não o substitui nem lhe mexe.
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'campaign_id') then
    alter table public.leads add column campaign_id uuid references public.campaigns (id) on delete set null;
  end if;
end $$;
create index if not exists leads_campaign_idx on public.leads (campaign_id);
