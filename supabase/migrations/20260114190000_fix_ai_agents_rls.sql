-- Fix AI Agents RLS Policies to use correct company_users table instead of profiles
-- Previous policies incorrectly referenced profiles.company_id which does not exist

-- 1. ai_agents
DROP POLICY IF EXISTS "Users can view agents from their company" ON ai_agents;
CREATE POLICY "Users can view agents from their company"
    ON ai_agents FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can create agents for their company" ON ai_agents;
CREATE POLICY "Users can create agents for their company"
    ON ai_agents FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update agents from their company" ON ai_agents;
CREATE POLICY "Users can update agents from their company"
    ON ai_agents FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete agents from their company" ON ai_agents;
CREATE POLICY "Users can delete agents from their company"
    ON ai_agents FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 2. ai_agent_channels
DROP POLICY IF EXISTS "Users can manage agent channels from their company" ON ai_agent_channels;
CREATE POLICY "Users can manage agent channels from their company"
    ON ai_agent_channels FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 3. ai_agent_skills
DROP POLICY IF EXISTS "Users can manage agent skills from their company" ON ai_agent_skills;
CREATE POLICY "Users can manage agent skills from their company"
    ON ai_agent_skills FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 4. ai_agent_knowledge
DROP POLICY IF EXISTS "Users can manage agent knowledge from their company" ON ai_agent_knowledge;
CREATE POLICY "Users can manage agent knowledge from their company"
    ON ai_agent_knowledge FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 5. ai_agent_flows
DROP POLICY IF EXISTS "Users can manage agent flows from their company" ON ai_agent_flows;
CREATE POLICY "Users can manage agent flows from their company"
    ON ai_agent_flows FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 6. ai_agent_sessions
DROP POLICY IF EXISTS "Users can view sessions from their company" ON ai_agent_sessions;
CREATE POLICY "Users can view sessions from their company"
    ON ai_agent_sessions FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "System can manage sessions" ON ai_agent_sessions;
CREATE POLICY "System can manage sessions"
    ON ai_agent_sessions FOR ALL
    USING (true);

-- 7. ai_agent_action_logs
DROP POLICY IF EXISTS "Users can view action logs from their company" ON ai_agent_action_logs;
CREATE POLICY "Users can view action logs from their company"
    ON ai_agent_action_logs FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 8. ai_agent_response_templates
DROP POLICY IF EXISTS "Users can manage templates from their company" ON ai_agent_response_templates;
CREATE POLICY "Users can manage templates from their company"
    ON ai_agent_response_templates FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 9. ai_agent_handoff_rules
DROP POLICY IF EXISTS "Users can manage handoff rules from their company" ON ai_agent_handoff_rules;
CREATE POLICY "Users can manage handoff rules from their company"
    ON ai_agent_handoff_rules FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 10. ai_agent_training_data
DROP POLICY IF EXISTS "Users can manage training data from their company" ON ai_agent_training_data;
CREATE POLICY "Users can manage training data from their company"
    ON ai_agent_training_data FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 11. ai_agent_metrics
DROP POLICY IF EXISTS "Users can view metrics from their company" ON ai_agent_metrics;
CREATE POLICY "Users can view metrics from their company"
    ON ai_agent_metrics FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 12. ai_agent_versions
DROP POLICY IF EXISTS "Users can manage versions from their company" ON ai_agent_versions;
CREATE POLICY "Users can manage versions from their company"
    ON ai_agent_versions FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 13. ai_agent_ab_tests
DROP POLICY IF EXISTS "Users can manage ab tests from their company" ON ai_agent_ab_tests;
CREATE POLICY "Users can manage ab tests from their company"
    ON ai_agent_ab_tests FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));

-- 14. ai_agent_integrations
DROP POLICY IF EXISTS "Users can manage integrations from their company" ON ai_agent_integrations;
CREATE POLICY "Users can manage integrations from their company"
    ON ai_agent_integrations FOR ALL
    USING (company_id IN (
        SELECT company_id FROM company_users WHERE user_id = auth.uid()
    ));
