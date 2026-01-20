-- Asaas Payment Gateway Integration
-- Adds fields to link local entities with Asaas

-- 1. Add Asaas fields to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS asaas_product_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_sync_status TEXT DEFAULT 'pending';

COMMENT ON COLUMN subscription_plans.asaas_product_id IS 'ID do produto no Asaas para cobrança automática';
COMMENT ON COLUMN subscription_plans.asaas_sync_status IS 'Status de sincronização com Asaas: pending, synced, error';

-- 2. Add Asaas fields to companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_payment_method TEXT;

COMMENT ON COLUMN companies.asaas_customer_id IS 'ID do cliente no Asaas';
COMMENT ON COLUMN companies.asaas_subscription_id IS 'ID da assinatura ativa no Asaas';
COMMENT ON COLUMN companies.asaas_payment_method IS 'Método de pagamento: PIX, BOLETO, CREDIT_CARD';

-- 3. Create table to track payment history
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
  payment_method TEXT,
  due_date DATE,
  payment_date TIMESTAMP WITH TIME ZONE,
  invoice_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  boleto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Super Admin can manage all payment history
CREATE POLICY "Super Admin can manage payment history"
  ON payment_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN (SELECT unnest(string_to_array(current_setting('app.super_admin_emails', true), ',')))
    )
  );

-- Company members can view their payment history
CREATE POLICY "Company members can view payment history"
  ON payment_history FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_history_company_id ON payment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_asaas_payment_id ON payment_history(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_companies_asaas_customer_id ON companies(asaas_customer_id);

-- 5. Add Asaas configuration to global settings (for API keys, etc.)
-- This will be managed via environment variables for security, but we add a config table for other settings
CREATE TABLE IF NOT EXISTS asaas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sandbox_mode BOOLEAN DEFAULT true,
  webhook_secret TEXT,
  default_payment_methods TEXT[] DEFAULT ARRAY['PIX', 'BOLETO', 'CREDIT_CARD'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO asaas_config (sandbox_mode, default_payment_methods)
VALUES (true, ARRAY['PIX', 'BOLETO', 'CREDIT_CARD'])
ON CONFLICT DO NOTHING;

-- Enable RLS on asaas_config
ALTER TABLE asaas_config ENABLE ROW LEVEL SECURITY;

-- Only Super Admin can manage Asaas config
CREATE POLICY "Super Admin can manage Asaas config"
  ON asaas_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email IN (SELECT unnest(string_to_array(current_setting('app.super_admin_emails', true), ',')))
    )
  );
