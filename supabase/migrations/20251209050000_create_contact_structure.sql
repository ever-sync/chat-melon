-- Create contact_categories table
CREATE TABLE IF NOT EXISTS contact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366F1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_settings table
CREATE TABLE IF NOT EXISTS contact_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    entity_name text DEFAULT 'Contato',
    entity_name_plural text DEFAULT 'Contatos',
    entity_icon text DEFAULT 'User',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT contact_settings_company_id_key UNIQUE (company_id)
);

-- Add category_id to contacts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'category_id') THEN
        ALTER TABLE contacts ADD COLUMN category_id uuid REFERENCES contact_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

-- Policies for contact_categories
DROP POLICY IF EXISTS "Users can view their company's contact categories" ON contact_categories;
CREATE POLICY "Users can view their company's contact categories"
  ON contact_categories FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their company's contact categories" ON contact_categories;
CREATE POLICY "Users can insert their company's contact categories"
  ON contact_categories FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company's contact categories" ON contact_categories;
CREATE POLICY "Users can update their company's contact categories"
  ON contact_categories FOR UPDATE
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their company's contact categories" ON contact_categories;
CREATE POLICY "Users can delete their company's contact categories"
  ON contact_categories FOR DELETE
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Policies for contact_settings
DROP POLICY IF EXISTS "Users can view their company's contact settings" ON contact_settings;
CREATE POLICY "Users can view their company's contact settings"
  ON contact_settings FOR SELECT
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their company's contact settings" ON contact_settings;
CREATE POLICY "Users can insert their company's contact settings"
  ON contact_settings FOR INSERT
  WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company's contact settings" ON contact_settings;
CREATE POLICY "Users can update their company's contact settings"
  ON contact_settings FOR UPDATE
  USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
