-- BillTech — "Escritório Virtual": persistência real dos leads/Pipeline.
-- Executar depois de 006_crm.sql. Idempotente.
--
-- Nota de arquitetura: até aqui os leads viviam só em `src/data/mock/leads.ts` (ver nota em
-- 006_crm.sql) — mudar de etapa, fechar como Ganho/Perdido, etc. só existia na sessão do browser e
-- desaparecia ao atualizar a página. Esta tabela fecha esse hiato: passa a ser a fonte de verdade do
-- Pipeline, com os 26 leads de demonstração como seed inicial (feito por um script à parte, com a
-- service role key — não precisa de acesso direto à base de dados). Ferramenta de uso interno e
-- pessoal: sem RLS pública, só is_admin(), como as restantes tabelas deste módulo.

create table if not exists public.leads (
  id text primary key default gen_random_uuid()::text,
  contact_name text not null,
  company text not null,
  sector text not null check (sector in ('oficinas', 'restauracao', 'clinicas', 'comercio', 'imobiliario', 'logistica', 'fitness')),
  -- Valor estimado do negócio em EUR
  estimated_value numeric not null default 0 check (estimated_value >= 0),
  stage text not null default 'captado' check (stage in ('captado', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido')),
  channel text not null check (channel in ('organico', 'indicacao', 'linkedin', 'whatsapp')),
  -- Quando entrou no stage atual (dias no stage = hoje − esta data)
  stage_entered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  owner text not null default '',
  -- Contactos de follow-up já feitos
  follow_ups int not null default 0 check (follow_ups >= 0),
  -- Horas até à primeira resposta ao lead (null = ainda sem resposta)
  first_response_hours numeric,
  -- Preenchido ao mover para "Ganho" (mini-form do Deal Board)
  project_name text,
  project_type text check (project_type is null or project_type in ('Web App', 'Mobile App', 'Dashboard', 'Automação')),
  -- Preenchido ao mover para "Perdido" (modal de motivo do Deal Board)
  loss_reason text check (loss_reason is null or loss_reason in ('preco', 'timing', 'concorrente', 'nao_respondeu', 'outro')),
  updated_at timestamptz not null default now()
);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
drop policy if exists "leads_admin" on public.leads;
create policy "leads_admin" on public.leads for all using (public.is_admin()) with check (public.is_admin());
