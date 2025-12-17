-- =====================================================
-- CRM COMPLETE ARCHITECTURE
-- Arquitetura completa do banco de dados para CRM Kanban
-- =====================================================

-- =====================================================
-- 1. DEAL NOTES (Notas internas dos negócios)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deal_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    note text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT deal_notes_note_not_empty CHECK (char_length(note) > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id ON public.deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_company_id ON public.deal_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_notes_created_at ON public.deal_notes(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_deal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_notes_updated_at
    BEFORE UPDATE ON public.deal_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_notes_updated_at();

-- Comentários
COMMENT ON TABLE public.deal_notes IS 'Notas internas vinculadas a negócios';
COMMENT ON COLUMN public.deal_notes.is_pinned IS 'Nota fixada no topo da lista';

-- =====================================================
-- 2. DEAL TASKS (Tarefas vinculadas a negócios)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deal_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date timestamptz,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completed_at timestamptz,
    completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reminder_at timestamptz,
    reminder_sent boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT deal_tasks_title_not_empty CHECK (char_length(title) > 0),
    CONSTRAINT deal_tasks_completed_logic CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deal_tasks_deal_id ON public.deal_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_company_id ON public.deal_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_assigned_to ON public.deal_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_status ON public.deal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_deal_tasks_due_date ON public.deal_tasks(due_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_deal_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_tasks_updated_at
    BEFORE UPDATE ON public.deal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_tasks_updated_at();

-- Trigger para preencher completed_at automaticamente
CREATE OR REPLACE FUNCTION auto_complete_deal_task()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = now();
        NEW.completed_by = auth.uid();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
        NEW.completed_by = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_complete_deal_task
    BEFORE UPDATE ON public.deal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION auto_complete_deal_task();

-- Comentários
COMMENT ON TABLE public.deal_tasks IS 'Tarefas vinculadas a negócios';
COMMENT ON COLUMN public.deal_tasks.reminder_at IS 'Data/hora para enviar lembrete';
COMMENT ON COLUMN public.deal_tasks.reminder_sent IS 'Indica se o lembrete já foi enviado';

-- =====================================================
-- 3. DEAL FILES (Arquivos anexados a negócios)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deal_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    mime_type text,
    storage_path text,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT deal_files_name_not_empty CHECK (char_length(file_name) > 0),
    CONSTRAINT deal_files_url_not_empty CHECK (char_length(file_url) > 0),
    CONSTRAINT deal_files_size_positive CHECK (file_size > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deal_files_deal_id ON public.deal_files(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_files_company_id ON public.deal_files(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_files_uploaded_by ON public.deal_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_deal_files_created_at ON public.deal_files(created_at DESC);

-- Comentários
COMMENT ON TABLE public.deal_files IS 'Arquivos anexados a negócios';
COMMENT ON COLUMN public.deal_files.storage_path IS 'Caminho no Supabase Storage';
COMMENT ON COLUMN public.deal_files.is_public IS 'Define se o arquivo é público ou privado';

-- =====================================================
-- 4. MELHORIAS NA TABELA DEALS (Adicionar campos faltantes)
-- =====================================================

-- Adicionar campos se não existirem
DO $$
BEGIN
    -- Temperatura score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'temperature_score'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN temperature_score integer;
        COMMENT ON COLUMN public.deals.temperature_score IS 'Score numérico de temperatura (0-100)';
    END IF;

    -- Budget confirmed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'budget_confirmed'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN budget_confirmed boolean DEFAULT false;
        COMMENT ON COLUMN public.deals.budget_confirmed IS 'Orçamento confirmado (BANT)';
    END IF;

    -- Timeline confirmed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'timeline_confirmed'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN timeline_confirmed boolean DEFAULT false;
        COMMENT ON COLUMN public.deals.timeline_confirmed IS 'Timeline confirmado (BANT)';
    END IF;

    -- Decision maker
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'decision_maker'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN decision_maker text;
        COMMENT ON COLUMN public.deals.decision_maker IS 'Nome do tomador de decisão';
    END IF;

    -- Need identified
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'need_identified'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN need_identified text;
        COMMENT ON COLUMN public.deals.need_identified IS 'Necessidade identificada do cliente';
    END IF;

    -- Win reason
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'win_reason'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN win_reason text;
        COMMENT ON COLUMN public.deals.win_reason IS 'Motivo de ganho do negócio';
    END IF;

    -- Loss reason detail
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'loss_reason_detail'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN loss_reason_detail text;
        COMMENT ON COLUMN public.deals.loss_reason_detail IS 'Detalhes do motivo de perda';
    END IF;

    -- Won at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'won_at'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN won_at timestamptz;
        COMMENT ON COLUMN public.deals.won_at IS 'Data/hora em que foi marcado como ganho';
    END IF;

    -- Lost at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'lost_at'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN lost_at timestamptz;
        COMMENT ON COLUMN public.deals.lost_at IS 'Data/hora em que foi marcado como perda';
    END IF;

    -- Tags array
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN tags text[];
        COMMENT ON COLUMN public.deals.tags IS 'Tags/etiquetas do negócio';
    END IF;

    -- Source (origem do lead)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.deals ADD COLUMN source text;
        COMMENT ON COLUMN public.deals.source IS 'Origem do lead (website, indicação, etc)';
    END IF;

END $$;

-- =====================================================
-- 5. ÍNDICES ADICIONAIS DE PERFORMANCE
-- =====================================================

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_deals_company_pipeline ON public.deals(company_id, pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_status ON public.deals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_status ON public.deals(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_deals_stage_status ON public.deals(stage_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_last_activity ON public.deals(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close ON public.deals(expected_close_date);

-- Índices para pipeline_stages
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_order ON public.pipeline_stages(pipeline_id, order_index);

-- Índices para deal_activities
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_created ON public.deal_activities(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_activities_type ON public.deal_activities(activity_type);

-- =====================================================
-- 6. RLS POLICIES (Row Level Security)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_files ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DEAL NOTES POLICIES
-- =====================================================

-- Membros da empresa podem ver notas
CREATE POLICY "Company members can view deal notes"
ON public.deal_notes FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Membros podem criar notas
CREATE POLICY "Company members can create deal notes"
ON public.deal_notes FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Autor ou admin pode atualizar
CREATE POLICY "Note author or admin can update"
ON public.deal_notes FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
);

-- Autor ou admin pode deletar
CREATE POLICY "Note author or admin can delete"
ON public.deal_notes FOR DELETE
USING (
    user_id = auth.uid()
    OR
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
);

-- =====================================================
-- DEAL TASKS POLICIES
-- =====================================================

-- Membros da empresa podem ver tarefas
CREATE POLICY "Company members can view deal tasks"
ON public.deal_tasks FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Membros podem criar tarefas
CREATE POLICY "Company members can create deal tasks"
ON public.deal_tasks FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Responsável, criador ou admin pode atualizar
CREATE POLICY "Task owner or admin can update"
ON public.deal_tasks FOR UPDATE
USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
);

-- Criador ou admin pode deletar
CREATE POLICY "Task creator or admin can delete"
ON public.deal_tasks FOR DELETE
USING (
    created_by = auth.uid()
    OR
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
);

-- =====================================================
-- DEAL FILES POLICIES
-- =====================================================

-- Membros da empresa podem ver arquivos
CREATE POLICY "Company members can view deal files"
ON public.deal_files FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_public = true
);

-- Membros podem fazer upload
CREATE POLICY "Company members can upload deal files"
ON public.deal_files FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Uploader ou admin pode deletar
CREATE POLICY "File uploader or admin can delete"
ON public.deal_files FOR DELETE
USING (
    uploaded_by = auth.uid()
    OR
    company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
);

-- =====================================================
-- 7. TRIGGERS PARA DEAL ACTIVITIES (Log automático)
-- =====================================================

-- Registrar criação de nota como atividade
CREATE OR REPLACE FUNCTION log_deal_note_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.deal_activities (
        deal_id,
        user_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        NEW.deal_id,
        NEW.user_id,
        'note_added',
        'Nota adicionada',
        jsonb_build_object('note_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deal_note_activity
    AFTER INSERT ON public.deal_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_deal_note_activity();

-- Registrar criação de tarefa como atividade
CREATE OR REPLACE FUNCTION log_deal_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.deal_activities (
            deal_id,
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            NEW.deal_id,
            NEW.created_by,
            'task_created',
            'Tarefa criada: ' || NEW.title,
            jsonb_build_object('task_id', NEW.id, 'title', NEW.title)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.deal_activities (
            deal_id,
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            NEW.deal_id,
            auth.uid(),
            'task_completed',
            'Tarefa concluída: ' || NEW.title,
            jsonb_build_object('task_id', NEW.id, 'title', NEW.title)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deal_task_activity
    AFTER INSERT OR UPDATE ON public.deal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_deal_task_activity();

-- Registrar upload de arquivo como atividade
CREATE OR REPLACE FUNCTION log_deal_file_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.deal_activities (
        deal_id,
        user_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        NEW.deal_id,
        NEW.uploaded_by,
        'file_uploaded',
        'Arquivo anexado: ' || NEW.file_name,
        jsonb_build_object('file_id', NEW.id, 'file_name', NEW.file_name)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_deal_file_activity
    AFTER INSERT ON public.deal_files
    FOR EACH ROW
    EXECUTE FUNCTION log_deal_file_activity();

-- =====================================================
-- 8. VIEWS ÚTEIS
-- =====================================================

-- View com estatísticas de deals por stage
CREATE OR REPLACE VIEW deal_stats_by_stage AS
SELECT
    ps.id as stage_id,
    ps.pipeline_id,
    ps.name as stage_name,
    ps.color,
    ps.order_index,
    COUNT(d.id) as deal_count,
    COALESCE(SUM(d.value), 0) as total_value,
    COALESCE(AVG(d.value), 0) as average_value,
    COALESCE(AVG(d.probability), 0) as average_probability
FROM public.pipeline_stages ps
LEFT JOIN public.deals d ON d.stage_id = ps.id AND d.status = 'open'
GROUP BY ps.id, ps.pipeline_id, ps.name, ps.color, ps.order_index
ORDER BY ps.order_index;

COMMENT ON VIEW deal_stats_by_stage IS 'Estatísticas agregadas de deals por stage';

-- View com deals e contagem de atividades
CREATE OR REPLACE VIEW deals_with_activity_count AS
SELECT
    d.*,
    COUNT(DISTINCT da.id) as activity_count,
    COUNT(DISTINCT dn.id) as notes_count,
    COUNT(DISTINCT dt.id) as tasks_count,
    COUNT(DISTINCT dt.id) FILTER (WHERE dt.status = 'completed') as completed_tasks_count,
    COUNT(DISTINCT df.id) as files_count
FROM public.deals d
LEFT JOIN public.deal_activities da ON da.deal_id = d.id
LEFT JOIN public.deal_notes dn ON dn.deal_id = d.id
LEFT JOIN public.deal_tasks dt ON dt.deal_id = d.id
LEFT JOIN public.deal_files df ON df.deal_id = d.id
GROUP BY d.id;

COMMENT ON VIEW deals_with_activity_count IS 'Deals com contagem de atividades, notas, tarefas e arquivos';

-- =====================================================
-- 9. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para calcular score de temperatura
CREATE OR REPLACE FUNCTION calculate_deal_temperature_score(deal_id uuid)
RETURNS integer AS $$
DECLARE
    score integer := 50; -- Score base
    deal_record record;
    days_since_activity integer;
    days_to_close integer;
BEGIN
    SELECT * INTO deal_record
    FROM public.deals
    WHERE id = deal_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- +20 se orçamento confirmado
    IF deal_record.budget_confirmed THEN
        score := score + 20;
    END IF;

    -- +20 se timeline confirmado
    IF deal_record.timeline_confirmed THEN
        score := score + 20;
    END IF;

    -- +10 se tem tomador de decisão identificado
    IF deal_record.decision_maker IS NOT NULL THEN
        score := score + 10;
    END IF;

    -- Calcular dias desde última atividade
    days_since_activity := EXTRACT(DAY FROM (now() - deal_record.last_activity));

    -- -5 por cada dia sem atividade (max -30)
    score := score - LEAST(days_since_activity * 5, 30);

    -- Calcular dias até fechamento esperado
    IF deal_record.expected_close_date IS NOT NULL THEN
        days_to_close := EXTRACT(DAY FROM (deal_record.expected_close_date - CURRENT_DATE));

        -- +20 se está próximo do fechamento (< 7 dias)
        IF days_to_close < 7 AND days_to_close >= 0 THEN
            score := score + 20;
        -- -10 se passou da data esperada
        ELSIF days_to_close < 0 THEN
            score := score - 10;
        END IF;
    END IF;

    -- Garantir que está entre 0 e 100
    score := GREATEST(0, LEAST(100, score));

    RETURN score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_deal_temperature_score IS 'Calcula score de temperatura de um deal (0-100)';

-- Função para atualizar automaticamente o temperature score
CREATE OR REPLACE FUNCTION auto_update_temperature_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.temperature_score := calculate_deal_temperature_score(NEW.id);

    -- Atualizar campo temperature baseado no score
    IF NEW.temperature_score >= 70 THEN
        NEW.temperature := 'hot';
    ELSIF NEW.temperature_score >= 40 THEN
        NEW.temperature := 'warm';
    ELSE
        NEW.temperature := 'cold';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_temperature_score
    BEFORE INSERT OR UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_temperature_score();

-- =====================================================
-- 10. DADOS INICIAIS (SEED) - Motivos de perda comuns
-- =====================================================

-- Criar tabela de motivos de perda predefinidos
CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reason text NOT NULL UNIQUE,
    category text,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.loss_reasons IS 'Motivos predefinidos de perda de negócios';

-- Inserir motivos comuns
INSERT INTO public.loss_reasons (reason, category, order_index) VALUES
    ('Preço muito alto', 'price', 1),
    ('Perdeu para concorrente', 'competition', 2),
    ('Sem orçamento', 'budget', 3),
    ('Timing não adequado', 'timing', 4),
    ('Não respondeu mais', 'unresponsive', 5),
    ('Decidiu não comprar', 'no_need', 6),
    ('Produto não atende necessidade', 'product', 7),
    ('Problemas internos do cliente', 'client_internal', 8),
    ('Perdeu interesse', 'lost_interest', 9),
    ('Outro', 'other', 10)
ON CONFLICT (reason) DO NOTHING;

-- =====================================================
-- CONCLUSÃO
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ CRM Complete Architecture instalada com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    RAISE NOTICE '   - deal_notes (notas internas)';
    RAISE NOTICE '   - deal_tasks (tarefas)';
    RAISE NOTICE '   - deal_files (arquivos)';
    RAISE NOTICE '   - loss_reasons (motivos de perda)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS Policies configuradas';
    RAISE NOTICE '📈 Índices de performance criados';
    RAISE NOTICE '🔄 Triggers automáticos ativados';
    RAISE NOTICE '📊 Views úteis criadas';
    RAISE NOTICE '⚡ Funções auxiliares disponíveis';
END $$;
