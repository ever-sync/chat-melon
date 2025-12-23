-- CRIAÇÃO DE TABELA DE LOGS DE WEBHOOK
-- Para descobrir se a Evolution está conseguindo chamar nosso backend

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT,
    payload JSONB,
    status TEXT, -- 'received', 'processed', 'error'
    error_message TEXT
);

-- Habilitar RLS mas deixar aberto para insert (para funcão system role)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system insert" ON webhook_logs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Allow public read" ON webhook_logs FOR SELECT TO authenticated USING (true); -- Para você poder ver os logs
