-- =====================================================
-- FIX SUPABASE SECURITY LINTER ERRORS
-- =====================================================

-- 1. FIX online_users view security
-- Linter error: auth_users_exposed and security_definer_view

-- A. Add last_seen_at to profiles to avoid querying auth.users in the view
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen_at') THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
  END IF;
END $$;

-- B. Sync initial data from auth.users (one-time)
DO $$
BEGIN
  UPDATE public.profiles p
  SET last_seen_at = u.last_sign_in_at
  FROM auth.users u
  WHERE u.id = p.id AND (p.last_seen_at IS NULL OR p.last_seen_at < u.last_sign_in_at);
EXCEPTION WHEN OTHERS THEN 
  -- Ignore if we can't access auth.users during migration (e.g. restricted environment)
  NULL;
END $$;

-- C. Create/Update sync trigger to keep profiles updated
CREATE OR REPLACE FUNCTION public.handle_user_presence_sync() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_presence_updated ON auth.users;
CREATE TRIGGER on_auth_user_presence_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_presence_sync();

-- D. Create the view as SECURITY INVOKER (fully secure)
DROP VIEW IF EXISTS public.online_users;
CREATE OR REPLACE VIEW public.online_users 
WITH (security_invoker = true)
AS
SELECT DISTINCT
  p.id,
  p.full_name,
  p.avatar_url,
  cm.company_id,
  COALESCE(p.full_name, 'Usuário') as display_name,
  CASE
    WHEN p.last_seen_at > NOW() - INTERVAL '15 minutes' THEN true
    ELSE false
  END as is_online,
  p.last_seen_at as last_sign_in_at
FROM public.profiles p
JOIN public.company_members cm ON cm.user_id = p.id
WHERE cm.is_active = true
AND cm.company_id IN (
    -- Multi-tenant filter
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
);

-- EXPLICIT REVOKE FOR ANON (Security Linter Fix)
REVOKE ALL ON public.online_users FROM anon, public;
GRANT SELECT ON public.online_users TO authenticated;

-- 2. Convert and Secure other Views from SD to SI
-- Linter error: security_definer_view
-- These views only access public tables, so they should be SECURITY INVOKER to respect RLS.

DO $$
BEGIN
    -- audit_logs_view
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'audit_logs_view') THEN
        DROP VIEW IF EXISTS public.audit_logs_view;
        CREATE OR REPLACE VIEW public.audit_logs_view WITH (security_invoker = true) AS
        SELECT
            al.id, al.company_id, c.name as company_name, al.user_id, al.user_email,
            p.full_name as user_name, al.user_ip, al.user_agent, al.action,
            al.resource_type, al.resource_id, al.resource_name, al.old_values,
            al.new_values, al.metadata, al.severity, al.category, al.created_at
        FROM audit_logs al
        LEFT JOIN companies c ON c.id = al.company_id
        LEFT JOIN profiles p ON p.id = al.user_id;
        GRANT SELECT ON public.audit_logs_view TO authenticated;
    END IF;

    -- sla_metrics_view
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'sla_metrics_view') THEN
        DROP VIEW IF EXISTS public.sla_metrics_view;
        CREATE OR REPLACE VIEW public.sla_metrics_view WITH (security_invoker = true) AS
        SELECT
            c.company_id, q.id as queue_id, q.name as queue_name,
            DATE_TRUNC('day', c.created_at) as date, COUNT(*) as total_conversations,
            COUNT(*) FILTER (WHERE c.sla_first_response_met = TRUE) as first_response_met,
            COUNT(*) FILTER (WHERE c.sla_first_response_met = FALSE) as first_response_breached,
            COUNT(*) FILTER (WHERE c.sla_resolution_met = TRUE) as resolution_met,
            COUNT(*) FILTER (WHERE c.sla_resolution_met = FALSE) as resolution_breached
        FROM conversations c
        LEFT JOIN queues q ON q.id = c.queue_id
        WHERE c.created_at > NOW() - INTERVAL '90 days'
        GROUP BY c.company_id, q.id, q.name, DATE_TRUNC('day', c.created_at);
        GRANT SELECT ON public.sla_metrics_view TO authenticated;
    END IF;

    -- deal_stats_by_stage
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'deal_stats_by_stage') THEN
        DROP VIEW IF EXISTS public.deal_stats_by_stage;
        CREATE OR REPLACE VIEW public.deal_stats_by_stage WITH (security_invoker = true) AS
        SELECT
            ps.id as stage_id, ps.pipeline_id, ps.name as stage_name, ps.color, ps.order_index,
            COUNT(d.id) as deal_count, COALESCE(SUM(d.value), 0) as total_value,
            COALESCE(AVG(d.value), 0) as average_value, COALESCE(AVG(d.probability), 0) as average_probability
        FROM public.pipeline_stages ps
        LEFT JOIN public.deals d ON d.stage_id = ps.id AND d.status = 'open'
        GROUP BY ps.id, ps.pipeline_id, ps.name, ps.color, ps.order_index;
        GRANT SELECT ON public.deal_stats_by_stage TO authenticated;
    END IF;

    -- deals_with_activity_count
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'deals_with_activity_count') THEN
        DROP VIEW IF EXISTS public.deals_with_activity_count;
        CREATE OR REPLACE VIEW public.deals_with_activity_count WITH (security_invoker = true) AS
        SELECT
            d.*, COUNT(DISTINCT da.id) as activity_count, COUNT(DISTINCT dn.id) as notes_count,
            COUNT(DISTINCT dt.id) as tasks_count, COUNT(DISTINCT df.id) as files_count
        FROM public.deals d
        LEFT JOIN public.deal_activities da ON da.deal_id = d.id
        LEFT JOIN public.deal_notes dn ON dn.deal_id = d.id
        LEFT JOIN public.deal_tasks dt ON dt.deal_id = d.id
        LEFT JOIN public.deal_files df ON df.deal_id = d.id
        GROUP BY d.id;
        GRANT SELECT ON public.deals_with_activity_count TO authenticated;
    END IF;
END $$;

-- 3. ENABLE RLS ON PUBLIC TABLES
-- Linter error: rls_disabled_in_public

ALTER TABLE IF EXISTS public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_fix_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_widget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.used_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loss_reasons ENABLE ROW LEVEL SECURITY;

-- 4. ADD BASIC POLICIES FOR THESE TABLES

-- api_rate_limits (Join with api_keys to check company)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_rate_limits') THEN
        DROP POLICY IF EXISTS "Users can view their api rate limits" ON public.api_rate_limits;
        EXECUTE 'CREATE POLICY "Users can view their api rate limits" ON public.api_rate_limits FOR SELECT USING (EXISTS (SELECT 1 FROM public.api_keys ak JOIN public.company_members cm ON ak.company_id = cm.company_id WHERE ak.id = api_rate_limits.api_key_id AND cm.user_id = auth.uid()))';
    END IF;
END $$;

-- n8n_chat_histories (Multi-tenant check)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'n8n_chat_histories') THEN
        DROP POLICY IF EXISTS "Users can view their n8n histories" ON public.n8n_chat_histories;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'n8n_chat_histories' AND column_name = 'company_id') THEN
            EXECUTE 'CREATE POLICY "Users can view their n8n histories" ON public.n8n_chat_histories FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()))';
        ELSE
            EXECUTE 'CREATE POLICY "Users can view their n8n histories" ON public.n8n_chat_histories FOR SELECT USING (false)';
        END IF;
    END IF;
END $$;

-- loss_reasons (Read-only for all workers)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loss_reasons') THEN
        DROP POLICY IF EXISTS "Anyone authenticated can view loss reasons" ON public.loss_reasons;
        EXECUTE 'CREATE POLICY "Anyone authenticated can view loss reasons" ON public.loss_reasons FOR SELECT USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

-- dashboard_widget_templates (Read-only for all workers)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dashboard_widget_templates') THEN
        DROP POLICY IF EXISTS "Anyone authenticated can view widget templates" ON public.dashboard_widget_templates;
        EXECUTE 'CREATE POLICY "Anyone authenticated can view widget templates" ON public.dashboard_widget_templates FOR SELECT USING (auth.role() = ''authenticated'')';
    END IF;
END $$;

-- used_recovery_codes (Owner only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'used_recovery_codes') THEN
        DROP POLICY IF EXISTS "Users can view their own recovery codes" ON public.used_recovery_codes;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'used_recovery_codes' AND column_name = 'user_id') THEN
            EXECUTE 'CREATE POLICY "Users can view their own recovery codes" ON public.used_recovery_codes FOR SELECT USING (user_id = auth.uid())';
        ELSE
            EXECUTE 'CREATE POLICY "Users can view their own recovery codes" ON public.used_recovery_codes FOR SELECT USING (false)';
        END IF;
    END IF;
END $$;

-- error_fix_log (Admins only)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'error_fix_log') THEN
        DROP POLICY IF EXISTS "Admins can view error fix logs" ON public.error_fix_log;
        EXECUTE 'CREATE POLICY "Admins can view error fix logs" ON public.error_fix_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid() AND role IN (''admin'', ''owner'')))';
    END IF;
END $$;
