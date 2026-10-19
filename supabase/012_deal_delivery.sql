-- BillTech — acompanhamento de entrega dos negócios ganhos ("Receita & Projetos" deixa de ser
-- demonstração). Um negócio em `leads.stage = 'ganho'` já tem cliente, projeto, setor, valor e data
-- de venda; aqui só acrescentamos o que falta para seguir a entrega: estado (desenvolvimento → teste
-- → entregue), margem e data de entrega. Evita duplicar os negócios ganhos numa tabela paralela.
-- Idempotente.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'delivery_status') then
    alter table public.leads add column delivery_status text check (delivery_status in ('em_desenvolvimento', 'em_teste', 'entregue'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'margin_pct') then
    alter table public.leads add column margin_pct numeric check (margin_pct is null or margin_pct between 0 and 100);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'delivered_at') then
    alter table public.leads add column delivered_at date;
  end if;
end $$;

-- Negócios já ganhos antes desta migração entram em "Em desenvolvimento" por omissão.
update public.leads set delivery_status = 'em_desenvolvimento' where stage = 'ganho' and delivery_status is null;
