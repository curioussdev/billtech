-- BillTech — distingue o tipo de documento de um projeto (contrato, entregável, acesso, outro).
-- `project_documents` já existia para isto ("contratos, acessos, entregáveis", ver comentário em
-- src/actions/documents.ts) — só faltava o campo para separar o contrato em destaque na área de
-- cliente. Sem mudanças a RLS/storage: já estavam corretas. Idempotente.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_documents' and column_name = 'kind') then
    alter table public.project_documents add column kind text not null default 'outro' check (kind in ('contrato', 'entregavel', 'acesso', 'outro'));
  end if;
end $$;
