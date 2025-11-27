-- Add enrichment fields to contacts table
ALTER TABLE contacts 
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS company_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS company_data JSONB DEFAULT '{}';

-- Create index for enrichment status for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_enrichment_status ON contacts(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_contacts_company_cnpj ON contacts(company_cnpj);

COMMENT ON COLUMN contacts.enrichment_data IS 'Additional enrichment data from external sources';
COMMENT ON COLUMN contacts.enrichment_status IS 'Status: pending, enriched, failed, not_found';
COMMENT ON COLUMN contacts.company_data IS 'Company data from CNPJ lookup: razao_social, nome_fantasia, cnae, endereco, etc.';