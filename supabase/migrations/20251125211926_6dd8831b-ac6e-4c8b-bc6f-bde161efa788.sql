-- Create satisfaction_surveys table
CREATE TABLE satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('csat', 'nps')),
  score INTEGER CHECK (
    (survey_type = 'csat' AND score >= 1 AND score <= 5) OR
    (survey_type = 'nps' AND score >= 0 AND score <= 10)
  ),
  feedback TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'answered', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_satisfaction_surveys_company ON satisfaction_surveys(company_id);
CREATE INDEX idx_satisfaction_surveys_conversation ON satisfaction_surveys(conversation_id);
CREATE INDEX idx_satisfaction_surveys_status ON satisfaction_surveys(status);
CREATE INDEX idx_satisfaction_surveys_assigned ON satisfaction_surveys(assigned_to);
CREATE INDEX idx_satisfaction_surveys_answered ON satisfaction_surveys(answered_at DESC);

-- RLS policies
ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view surveys in their company"
  ON satisfaction_surveys FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "System can insert surveys"
  ON satisfaction_surveys FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

CREATE POLICY "System can update surveys"
  ON satisfaction_surveys FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

-- Create satisfaction_settings table
CREATE TABLE satisfaction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  survey_type TEXT NOT NULL DEFAULT 'csat' CHECK (survey_type IN ('csat', 'nps')),
  delay_minutes INTEGER NOT NULL DEFAULT 5,
  custom_message TEXT,
  ask_feedback BOOLEAN NOT NULL DEFAULT true,
  feedback_prompt TEXT DEFAULT 'Pode nos contar o que podemos melhorar?',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for settings
ALTER TABLE satisfaction_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage satisfaction settings"
  ON satisfaction_settings FOR ALL
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

CREATE POLICY "Users can view satisfaction settings in their company"
  ON satisfaction_settings FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_satisfaction_surveys_updated_at
  BEFORE UPDATE ON satisfaction_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_satisfaction_settings_updated_at
  BEFORE UPDATE ON satisfaction_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for satisfaction_surveys
ALTER PUBLICATION supabase_realtime ADD TABLE satisfaction_surveys;