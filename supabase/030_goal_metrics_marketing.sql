-- BillTech — estende as metas (`goals`, supabase/006_crm.sql) com 3 métricas de Marketing: teto de
-- investimento, teto de CPL e piso de ROAS. Não se edita o CHECK antigo no sítio (Postgres não
-- deixa); substitui-se por um novo com a lista completa. Idempotente.

alter table public.goals drop constraint if exists goals_metric_check;
alter table public.goals add constraint goals_metric_check
  check (metric in ('cold_calls', 'meetings', 'revenue', 'win_rate', 'proposals_value', 'ad_spend_max', 'cpl_max', 'roas_min'));
