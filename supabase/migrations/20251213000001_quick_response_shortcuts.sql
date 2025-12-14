-- Migration: Quick Response Shortcuts (Canned Responses 2.0)
-- Description: Adds shortcut support for quick message templates

-- Add shortcut column to message_templates
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS shortcut VARCHAR(50);

-- Create unique index for shortcuts per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_templates_shortcut_company
ON message_templates(company_id, shortcut)
WHERE shortcut IS NOT NULL;

-- Add is_personal column to differentiate personal vs company templates
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false;

-- Add tags for better organization
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add last_used_at for smarter sorting
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Create table for tracking shortcut usage analytics
CREATE TABLE IF NOT EXISTS template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES message_templates(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  response_received BOOLEAN DEFAULT false,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template
ON template_usage_analytics(template_id, used_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_company
ON template_usage_analytics(company_id, used_at DESC);

-- RLS for template_usage_analytics
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics in their company" ON template_usage_analytics
  FOR SELECT USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can insert analytics" ON template_usage_analytics
  FOR INSERT WITH CHECK (company_id = get_user_company(auth.uid()));

-- Function to update avg_response_rate based on analytics
CREATE OR REPLACE FUNCTION update_template_response_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.response_received = true AND OLD.response_received = false THEN
    UPDATE message_templates
    SET avg_response_rate = (
      SELECT
        ROUND(
          (COUNT(*) FILTER (WHERE response_received = true)::DECIMAL /
           NULLIF(COUNT(*), 0) * 100), 2
        )
      FROM template_usage_analytics
      WHERE template_id = NEW.template_id
    )
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating response rate
DROP TRIGGER IF EXISTS trigger_update_template_response_rate ON template_usage_analytics;
CREATE TRIGGER trigger_update_template_response_rate
  AFTER UPDATE ON template_usage_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_template_response_rate();

-- Comment on columns
COMMENT ON COLUMN message_templates.shortcut IS 'Shortcut command like /agend, /preco for quick access';
COMMENT ON COLUMN message_templates.is_personal IS 'If true, only visible to the creator';
COMMENT ON COLUMN message_templates.tags IS 'Array of tags for better organization';
COMMENT ON COLUMN message_templates.last_used_at IS 'Last time this template was used';
