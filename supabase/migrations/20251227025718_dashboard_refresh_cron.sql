-- Configurar cron job para refresh automático das materialized views do dashboard
-- Atualiza as views a cada 5 minutos

-- Verificar se pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar refresh das views materializadas a cada 5 minutos
-- Nota: pg_cron pode não estar disponível em todos os planos do Supabase
-- Em produção, considere usar Supabase Edge Functions ou um serviço externo

-- Função wrapper para garantir que erros não quebrem o cron job
CREATE OR REPLACE FUNCTION refresh_dashboard_views_safe()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    PERFORM refresh_dashboard_views();
  EXCEPTION WHEN OTHERS THEN
    -- Log erro mas não falha o cron job
    RAISE WARNING 'Erro ao atualizar views do dashboard: %', SQLERRM;
  END;
END;
$$;

-- Agendar cron job (comentado porque pg_cron pode não estar disponível)
-- Descomente se tiver acesso ao pg_cron no seu plano Supabase
/*
SELECT cron.schedule(
  'refresh-dashboard-views',
  '*/5 * * * *', -- A cada 5 minutos
  $$SELECT refresh_dashboard_views_safe();$$
);
*/

-- Alternativa: Criar trigger que atualiza views quando dados mudam
-- (mais eficiente que cron job, mas pode ser mais pesado)

-- Trigger para atualizar view de conversas quando houver mudanças
CREATE OR REPLACE FUNCTION trigger_refresh_conversation_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Invalidar cache e marcar view como desatualizada
  -- A view será atualizada na próxima consulta ou via cron
  PERFORM pg_notify('refresh_dashboard_views', 'conversation_metrics');
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_conversation_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_conversation_metrics();

-- Trigger para atualizar view de deals quando houver mudanças
CREATE OR REPLACE FUNCTION trigger_refresh_deal_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('refresh_dashboard_views', 'deal_metrics');
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_deal_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_deal_metrics();

-- Trigger para atualizar view de tarefas quando houver mudanças
CREATE OR REPLACE FUNCTION trigger_refresh_task_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('refresh_dashboard_views', 'task_metrics');
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_task_metrics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_task_metrics();

-- Comentários
COMMENT ON FUNCTION refresh_dashboard_views_safe() IS 'Versão segura da função de refresh que não falha em caso de erro. Usada por cron jobs.';
COMMENT ON FUNCTION trigger_refresh_conversation_metrics() IS 'Trigger que notifica quando views de conversas precisam ser atualizadas.';
COMMENT ON FUNCTION trigger_refresh_deal_metrics() IS 'Trigger que notifica quando views de deals precisam ser atualizadas.';
COMMENT ON FUNCTION trigger_refresh_task_metrics() IS 'Trigger que notifica quando views de tarefas precisam ser atualizadas.';

-- Nota: Para usar cron job em produção, você pode:
-- 1. Usar Supabase Edge Function com cron (recomendado)
-- 2. Usar serviço externo (Vercel Cron, GitHub Actions, etc.)
-- 3. Usar pg_cron se disponível no seu plano

