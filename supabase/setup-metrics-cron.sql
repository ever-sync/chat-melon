-- Configuração de CRON Job para atualizar métricas dos vendedores
-- Execute este SQL no SQL Editor do Supabase (Lovable Cloud)

-- IMPORTANTE: Antes de executar, atualize a URL e a chave:
-- 1. Substitua 'heipukzowidsktcepxwr' pelo seu project_id (se diferente)
-- 2. A anon key já está configurada automaticamente via variável de ambiente

-- Habilitar extensões necessárias (se ainda não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover cron job anterior se existir
SELECT cron.unschedule('update-member-metrics-hourly');

-- Agendar atualização de métricas a cada hora
SELECT cron.schedule(
  'update-member-metrics-hourly',
  '0 * * * *', -- A cada hora no minuto 0
  $$
  SELECT net.http_post(
    url := 'https://heipukzowidsktcepxwr.supabase.co/functions/v1/update-member-metrics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaXB1a3pvd2lkc2t0Y2VweHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU2MTIsImV4cCI6MjA3OTU5MTYxMn0.S_duMoQlhugqZNn3U9JC6xAvFlqQlWdMS5igv8uhht0'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verificar se o cron job foi criado
SELECT * FROM cron.job WHERE jobname = 'update-member-metrics-hourly';

-- Para ver os logs de execução do cron:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-member-metrics-hourly') ORDER BY start_time DESC LIMIT 10;

-- Para desabilitar o cron job (se necessário):
-- SELECT cron.unschedule('update-member-metrics-hourly');

-- NOTA: Você também pode executar manualmente para testar:
-- SELECT net.http_post(
--   url := 'https://heipukzowidsktcepxwr.supabase.co/functions/v1/update-member-metrics',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaXB1a3pvd2lkc2t0Y2VweHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU2MTIsImV4cCI6MjA3OTU5MTYxMn0.S_duMoQlhugqZNn3U9JC6xAvFlqQlWdMS5igv8uhht0'
--   ),
--   body := '{}'::jsonb
-- );
