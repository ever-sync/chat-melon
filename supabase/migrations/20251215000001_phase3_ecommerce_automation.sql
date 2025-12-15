-- =====================================================
-- FASE 3: E-commerce & Automação Avançada
-- =====================================================

-- =====================================================
-- 3.4 Sales Cadences
-- =====================================================

-- Cadences (Sequências de Follow-up)
CREATE TABLE IF NOT EXISTS cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Steps configuration
  steps JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   { "day": 0, "channel": "whatsapp", "template_id": "...", "time": "09:00" },
  --   { "day": 2, "channel": "email", "subject": "...", "content": "..." },
  --   { "day": 5, "channel": "task", "task_type": "call", "title": "..." }
  -- ]
  
  -- Settings
  settings JSONB DEFAULT '{}',
  -- Example: { "businessHoursOnly": true, "timezone": "America/Sao_Paulo" }
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  
  -- Metrics
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cadence Enrollments (Inscrições de contatos em cadências)
CREATE TABLE IF NOT EXISTS cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID REFERENCES cadences(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Progress
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'replied', 'converted', 'paused', 'exited', 'bounced')),
  
  -- Tracking
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  exit_reason TEXT,
  
  -- History
  step_history JSONB DEFAULT '[]',
  -- Example: [{ "step": 0, "executed_at": "...", "status": "sent" }]
  
  -- Metadata
  enrolled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cadence_id, contact_id)
);

-- Indexes for Cadences
CREATE INDEX IF NOT EXISTS idx_cadences_company ON cadences(company_id);
CREATE INDEX IF NOT EXISTS idx_cadences_status ON cadences(status);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_cadence ON cadence_enrollments(cadence_id);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_contact ON cadence_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_next_step ON cadence_enrollments(next_step_at) WHERE status = 'active';

-- =====================================================
-- 3.2 & 3.3 Mini-Loja e Orders
-- =====================================================

-- Orders (Pedidos)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Order number (human readable)
  order_number SERIAL,
  
  -- Items
  items JSONB NOT NULL DEFAULT '[]',
  -- Example: [{ "product_id": "...", "name": "...", "quantity": 2, "unit_price": 99.90, "total": 199.80 }]
  
  -- Values
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  discount_type VARCHAR(20) DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  shipping DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  payment_id VARCHAR(255),
  payment_provider VARCHAR(50),
  paid_at TIMESTAMPTZ,
  
  -- PIX specific
  pix_code TEXT,
  pix_qrcode_url TEXT,
  pix_expiration TIMESTAMPTZ,
  
  -- Shipping
  shipping_address JSONB,
  -- Example: { "street": "...", "number": "...", "city": "...", "state": "...", "zip": "..." }
  tracking_code VARCHAR(100),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Orders
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_contact ON orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- =====================================================
-- 3.5 A/B Testing em Campanhas
-- =====================================================

-- Add A/B testing columns to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS variants JSONB;
-- Example: [{ "id": "A", "content": "...", "weight": 50 }, { "id": "B", "content": "...", "weight": 50 }]

-- Add variant tracking to campaign_contacts
ALTER TABLE campaign_contacts ADD COLUMN IF NOT EXISTS variant_id VARCHAR(10);

-- =====================================================
-- 3.6 Advanced Triggers - Add birthday to contacts
-- =====================================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS renewal_date DATE;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view cadences from their company" ON cadences;
DROP POLICY IF EXISTS "Users can manage cadences from their company" ON cadences;
DROP POLICY IF EXISTS "Users can view enrollments from their company" ON cadence_enrollments;
DROP POLICY IF EXISTS "Users can manage enrollments from their company" ON cadence_enrollments;
DROP POLICY IF EXISTS "Users can view orders from their company" ON orders;
DROP POLICY IF EXISTS "Users can manage orders from their company" ON orders;
DROP POLICY IF EXISTS "Users can view order history from their company" ON order_status_history;

-- Cadences policies
CREATE POLICY "Users can view cadences from their company" ON cadences
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage cadences from their company" ON cadences
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  );

-- Cadence Enrollments policies
CREATE POLICY "Users can view enrollments from their company" ON cadence_enrollments
  FOR SELECT USING (
    cadence_id IN (
      SELECT id FROM cadences WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage enrollments from their company" ON cadence_enrollments
  FOR ALL USING (
    cadence_id IN (
      SELECT id FROM cadences WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

-- Orders policies
CREATE POLICY "Users can view orders from their company" ON orders
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage orders from their company" ON orders
  FOR ALL USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid())
  );

-- Order Status History policies
CREATE POLICY "Users can view order history from their company" ON order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE company_id IN (
        SELECT company_id FROM company_members WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- Functions
-- =====================================================

-- Function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  items_total DECIMAL(12,2);
  discount_amount DECIMAL(12,2);
BEGIN
  -- Calculate items total
  SELECT COALESCE(SUM((item->>'total')::DECIMAL), 0)
  INTO items_total
  FROM jsonb_array_elements(NEW.items) AS item;
  
  NEW.subtotal := items_total;
  
  -- Calculate discount
  IF NEW.discount_type = 'percentage' THEN
    discount_amount := items_total * (NEW.discount / 100);
  ELSE
    discount_amount := COALESCE(NEW.discount, 0);
  END IF;
  
  -- Calculate total
  NEW.total := items_total - discount_amount + COALESCE(NEW.shipping, 0) + COALESCE(NEW.tax, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order total calculation
DROP TRIGGER IF EXISTS trigger_update_order_total ON orders;
CREATE TRIGGER trigger_update_order_total
  BEFORE INSERT OR UPDATE OF items, discount, discount_type, shipping, tax ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Function to record order status changes
CREATE OR REPLACE FUNCTION record_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status history
DROP TRIGGER IF EXISTS trigger_record_order_status ON orders;
CREATE TRIGGER trigger_record_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_order_status_change();
