-- BillTech — Centro de Comando (Fase 2): a assinatura HMAC-SHA256 do payload de telemetria exige
-- que o servidor consiga recalcular a assinatura com o MESMO segredo usado pelo site do cliente —
-- um hash de um sentido só (como ficou na Fase 1) não permite isso. Troca-se por armazenamento em
-- claro, tal como qualquer segredo de webhook (Stripe, GitHub, etc.) — protegido pela RLS
-- (só is_admin() lê a tabela) e nunca exposto a mais ninguém. Sem sites externos reais registados
-- ainda, a troca é direta (não há chaves a migrar). Idempotente.

alter table public.external_sites drop column if exists api_key_hash;
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'external_sites' and column_name = 'api_key') then
    alter table public.external_sites add column api_key text;
  end if;
end $$;
alter table public.external_sites alter column api_key set not null;
create unique index if not exists external_sites_api_key_idx on public.external_sites (api_key);
