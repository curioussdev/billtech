-- BillTech — marca quando o cliente concluiu o tour de boas-vindas, para não voltar a aparecer.
-- Persistido na base de dados (não localStorage): sobrevive a mudar de browser/dispositivo.
-- Idempotente.

alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
