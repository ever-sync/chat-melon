-- Create saved_filters table for users to save their favorite filter combinations
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_saved_filters_user_company ON saved_filters(user_id, company_id);

-- Enable RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved filters"
  ON saved_filters FOR SELECT
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can create their own saved filters"
  ON saved_filters FOR INSERT
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can update their own saved filters"
  ON saved_filters FOR UPDATE
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Users can delete their own saved filters"
  ON saved_filters FOR DELETE
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_saved_filters_updated_at
  BEFORE UPDATE ON saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();