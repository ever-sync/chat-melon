-- Tabela para templates visuais de email (editor estilo Canva)
CREATE TABLE IF NOT EXISTS email_templates_visual (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    subject text,
    blocks jsonb DEFAULT '[]'::jsonb,
    global_styles jsonb DEFAULT '{
        "backgroundColor": "#f4f4f5",
        "contentBackgroundColor": "#ffffff",
        "primaryColor": "#6366f1",
        "textColor": "#1f2937",
        "fontFamily": "Inter, sans-serif",
        "maxWidth": 600
    }'::jsonb,
    html text,
    thumbnail text,
    category text,
    usage_count integer DEFAULT 0,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_templates_visual_company ON email_templates_visual(company_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_visual_category ON email_templates_visual(category);

-- RLS
ALTER TABLE email_templates_visual ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários veem templates da sua empresa
CREATE POLICY "Users can view own company email templates visual"
    ON email_templates_visual FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

-- Política para INSERT: usuários podem criar templates na sua empresa
CREATE POLICY "Users can create email templates visual"
    ON email_templates_visual FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

-- Política para UPDATE: usuários podem atualizar templates da sua empresa
CREATE POLICY "Users can update own company email templates visual"
    ON email_templates_visual FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

-- Política para DELETE: admins podem deletar templates
CREATE POLICY "Admins can delete email templates visual"
    ON email_templates_visual FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_templates_visual_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_templates_visual_timestamp ON email_templates_visual;
CREATE TRIGGER update_email_templates_visual_timestamp
    BEFORE UPDATE ON email_templates_visual
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_visual_updated_at();

-- Comentários
COMMENT ON TABLE email_templates_visual IS 'Templates de email com editor visual estilo Canva';
COMMENT ON COLUMN email_templates_visual.blocks IS 'Array de blocos do template (header, text, image, button, etc)';
COMMENT ON COLUMN email_templates_visual.global_styles IS 'Estilos globais do template (cores, fontes, largura)';
COMMENT ON COLUMN email_templates_visual.html IS 'HTML gerado do template para envio';
