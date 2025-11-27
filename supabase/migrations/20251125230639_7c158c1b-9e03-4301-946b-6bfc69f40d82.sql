-- Create AI insights table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  is_actionable BOOLEAN DEFAULT true,
  action_type TEXT,
  action_data JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for better query performance
CREATE INDEX idx_ai_insights_company_id ON ai_insights(company_id);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view insights in their company"
  ON ai_insights FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update insights in their company"
  ON ai_insights FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "System can insert insights"
  ON ai_insights FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can delete insights"
  ON ai_insights FOR DELETE
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));