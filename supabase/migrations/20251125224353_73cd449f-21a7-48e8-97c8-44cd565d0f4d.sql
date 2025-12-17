-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  message_content TEXT NOT NULL,
  message_media_url TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document')),
  segment_id UUID REFERENCES segments(id),
  contact_filter JSONB,
  schedule_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  sending_rate INTEGER DEFAULT 10,
  instance_id UUID REFERENCES evolution_settings(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create campaign_contacts table
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'replied')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  reply_message TEXT,
  replied_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
DROP POLICY IF EXISTS "Users can view campaigns in their company" ON campaigns;
CREATE POLICY "Users can view campaigns in their company"
  ON campaigns FOR SELECT
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can create campaigns in their company" ON campaigns;
CREATE POLICY "Users can create campaigns in their company"
  ON campaigns FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update campaigns in their company" ON campaigns;
CREATE POLICY "Users can update campaigns in their company"
  ON campaigns FOR UPDATE
  USING (company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete campaigns" ON campaigns;
CREATE POLICY "Admins can delete campaigns"
  ON campaigns FOR DELETE
  USING (has_role(auth.uid(), company_id, 'admin'::app_role));

-- RLS Policies for campaign_contacts
DROP POLICY IF EXISTS "Users can view campaign contacts in their company" ON campaign_contacts;
CREATE POLICY "Users can view campaign contacts in their company"
  ON campaign_contacts FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE company_id = get_user_company(auth.uid())
  ));

DROP POLICY IF EXISTS "System can manage campaign contacts" ON campaign_contacts;
CREATE POLICY "System can manage campaign contacts"
  ON campaign_contacts FOR ALL
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE company_id = get_user_company(auth.uid())
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_company ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);