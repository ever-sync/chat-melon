-- Tabela para rastrear testes A/B do chatbot
CREATE TABLE IF NOT EXISTS chatbot_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para performance
  UNIQUE(contact_id, test_name)
);

-- Índices
CREATE INDEX idx_chatbot_ab_tests_chatbot_id ON chatbot_ab_tests(chatbot_id);
CREATE INDEX idx_chatbot_ab_tests_test_name ON chatbot_ab_tests(test_name);
CREATE INDEX idx_chatbot_ab_tests_variant_id ON chatbot_ab_tests(variant_id);
CREATE INDEX idx_chatbot_ab_tests_assigned_at ON chatbot_ab_tests(assigned_at);

-- RLS Policies
ALTER TABLE chatbot_ab_tests ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver testes A/B da sua empresa
CREATE POLICY "Users can view AB tests from their company"
  ON chatbot_ab_tests
  FOR SELECT
  USING (
    chatbot_id IN (
      SELECT id FROM chatbots
      WHERE company_id IN (
        SELECT company_id FROM company_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Sistema pode inserir testes A/B
CREATE POLICY "System can insert AB tests"
  ON chatbot_ab_tests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Sistema pode atualizar testes A/B
CREATE POLICY "System can update AB tests"
  ON chatbot_ab_tests
  FOR UPDATE
  USING (true);

COMMENT ON TABLE chatbot_ab_tests IS 'Rastreamento de testes A/B dos chatbots';
COMMENT ON COLUMN chatbot_ab_tests.test_name IS 'Nome do teste A/B';
COMMENT ON COLUMN chatbot_ab_tests.variant_id IS 'ID da variante atribuída';
COMMENT ON COLUMN chatbot_ab_tests.converted_at IS 'Quando o contato converteu (se aplicável)';
COMMENT ON COLUMN chatbot_ab_tests.conversion_value IS 'Valor da conversão (se aplicável)';
