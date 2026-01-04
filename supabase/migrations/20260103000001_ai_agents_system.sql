-- =====================================================
-- SISTEMA ROBUSTO DE AGENTES DE IA
-- MelonChat - Agentes de Atendimento Inteligentes
-- =====================================================

-- =====================================================
-- 1. ENUMS E TIPOS
-- =====================================================

-- Tipo de agente
CREATE TYPE ai_agent_type AS ENUM (
    'customer_service',    -- Atendimento ao cliente
    'sales',              -- Vendas
    'support',            -- Suporte técnico
    'qualification',      -- Qualificação de leads
    'scheduling',         -- Agendamentos
    'faq',                -- FAQ e informações
    'custom'              -- Personalizado
);

-- Status do agente
CREATE TYPE ai_agent_status AS ENUM (
    'draft',              -- Rascunho - não publicado
    'active',             -- Ativo e atendendo
    'paused',             -- Pausado temporariamente
    'training',           -- Em treinamento/aprendizado
    'archived'            -- Arquivado
);

-- Nível de autonomia do agente
CREATE TYPE ai_agent_autonomy AS ENUM (
    'full',               -- 100% autônomo - responde sozinho
    'supervised',         -- Responde mas notifica humano
    'assisted',           -- Sugere respostas para humano aprovar
    'handoff_only'        -- Apenas coleta info e passa para humano
);

-- Comportamento de handoff
CREATE TYPE ai_handoff_behavior AS ENUM (
    'immediate',          -- Passa imediatamente quando solicitado
    'after_qualification',-- Passa após qualificar
    'on_frustration',     -- Passa quando detecta frustração
    'on_complexity',      -- Passa quando não sabe responder
    'never'               -- Nunca passa (com fallback definido)
);

-- Nível de personalidade
CREATE TYPE ai_personality_style AS ENUM (
    'professional',       -- Formal e profissional
    'friendly',           -- Amigável e casual
    'empathetic',         -- Empático e compreensivo
    'direct',             -- Direto e objetivo
    'enthusiastic',       -- Entusiasmado e animado
    'consultative',       -- Consultivo e educador
    'custom'              -- Personalizado via prompt
);

-- Tipo de resposta padrão
CREATE TYPE ai_fallback_type AS ENUM (
    'apologize_handoff',  -- Pede desculpas e passa para humano
    'ask_rephrase',       -- Pede para reformular
    'offer_options',      -- Oferece opções de menu
    'collect_contact',    -- Coleta contato para retorno
    'schedule_callback',  -- Agenda retorno
    'custom_message'      -- Mensagem customizada
);

-- Tipo de gatilho de ativação
CREATE TYPE ai_trigger_type AS ENUM (
    'always',             -- Sempre ativo
    'keyword',            -- Por palavras-chave
    'schedule',           -- Por horário
    'channel',            -- Por canal específico
    'tag',                -- Por tag do contato
    'no_agent_available', -- Quando não há agente disponível
    'after_hours',        -- Fora do horário comercial
    'queue_threshold',    -- Quando fila atinge limite
    'manual'              -- Ativação manual apenas
);

-- Status de sessão de atendimento
CREATE TYPE ai_session_status AS ENUM (
    'active',             -- Em andamento
    'waiting_response',   -- Aguardando resposta do cliente
    'handed_off',         -- Transferido para humano
    'completed',          -- Finalizado com sucesso
    'abandoned',          -- Abandonado pelo cliente
    'failed'              -- Falhou (erro ou timeout)
);

-- Tipo de ação do agente
CREATE TYPE ai_action_type AS ENUM (
    'send_message',       -- Enviar mensagem
    'ask_question',       -- Fazer pergunta
    'collect_data',       -- Coletar dados
    'qualify_lead',       -- Qualificar lead
    'schedule_meeting',   -- Agendar reunião
    'create_deal',        -- Criar negócio
    'create_task',        -- Criar tarefa
    'add_tag',            -- Adicionar tag
    'update_contact',     -- Atualizar contato
    'send_media',         -- Enviar mídia
    'handoff',            -- Transferir para humano
    'escalate',           -- Escalar para supervisor
    'end_conversation',   -- Encerrar conversa
    'webhook',            -- Chamar webhook externo
    'custom_code'         -- Executar código customizado
);

-- =====================================================
-- 2. TABELA PRINCIPAL DE AGENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Identificação
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    display_name VARCHAR(50), -- Nome que aparece para o cliente

    -- Classificação
    agent_type ai_agent_type NOT NULL DEFAULT 'customer_service',
    status ai_agent_status NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,

    -- Configurações de autonomia
    autonomy_level ai_agent_autonomy NOT NULL DEFAULT 'supervised',
    handoff_behavior ai_handoff_behavior NOT NULL DEFAULT 'on_complexity',
    confidence_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.75, -- 0.00 a 1.00

    -- Configurações de personalidade
    personality_style ai_personality_style NOT NULL DEFAULT 'professional',
    custom_personality TEXT, -- Prompt customizado de personalidade
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    tone_formality INTEGER NOT NULL DEFAULT 7 CHECK (tone_formality BETWEEN 1 AND 10), -- 1=muito informal, 10=muito formal
    use_emojis BOOLEAN NOT NULL DEFAULT false,
    max_emoji_per_message INTEGER DEFAULT 2,

    -- Prompt principal do sistema
    system_prompt TEXT NOT NULL,

    -- Conhecimento e contexto
    knowledge_base JSONB DEFAULT '[]'::jsonb, -- Array de documentos/FAQs
    product_catalog_enabled BOOLEAN DEFAULT false,
    crm_context_enabled BOOLEAN DEFAULT true,
    conversation_history_limit INTEGER DEFAULT 20,

    -- Configurações de resposta
    max_response_length INTEGER DEFAULT 500,
    min_response_length INTEGER DEFAULT 20,
    response_delay_ms INTEGER DEFAULT 1500, -- Simular digitação
    typing_indicator BOOLEAN DEFAULT true,

    -- Fallbacks
    fallback_type ai_fallback_type NOT NULL DEFAULT 'apologize_handoff',
    fallback_message TEXT,
    fallback_agent_id UUID REFERENCES profiles(id), -- Agente humano padrão

    -- Limites e proteções
    max_messages_per_session INTEGER DEFAULT 50,
    session_timeout_minutes INTEGER DEFAULT 30,
    daily_message_limit INTEGER DEFAULT 1000,
    rate_limit_per_minute INTEGER DEFAULT 10,

    -- Horários de funcionamento
    schedule_enabled BOOLEAN DEFAULT false,
    schedule JSONB DEFAULT '{}'::jsonb, -- Horários por dia da semana
    out_of_hours_message TEXT,

    -- Métricas e analytics
    total_sessions INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    total_handoffs INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0, -- segundos
    avg_messages_per_session DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    resolution_rate DECIMAL(3,2) DEFAULT 0,

    -- Configurações avançadas
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    CONSTRAINT valid_tone CHECK (tone_formality >= 1 AND tone_formality <= 10)
);

-- Índices
CREATE INDEX idx_ai_agents_company ON ai_agents(company_id);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_agents_type ON ai_agents(agent_type);

-- =====================================================
-- 3. CANAIS VINCULADOS AO AGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Configurações específicas do canal
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1, -- Se múltiplos agentes no canal

    -- Gatilhos de ativação
    trigger_type ai_trigger_type NOT NULL DEFAULT 'always',
    trigger_config JSONB DEFAULT '{}'::jsonb, -- Configurações do gatilho

    -- Mensagens específicas do canal
    welcome_message TEXT,
    channel_specific_prompt TEXT, -- Prompt adicional para este canal

    -- Métricas do canal
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint de unicidade
    CONSTRAINT unique_agent_channel UNIQUE(agent_id, channel_id)
);

CREATE INDEX idx_ai_agent_channels_agent ON ai_agent_channels(agent_id);
CREATE INDEX idx_ai_agent_channels_channel ON ai_agent_channels(channel_id);

-- =====================================================
-- 4. SKILLS/HABILIDADES DO AGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identificação da skill
    skill_name VARCHAR(100) NOT NULL,
    skill_type VARCHAR(50) NOT NULL, -- greeting, faq, scheduling, qualification, etc
    description TEXT,

    -- Configuração da skill
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,

    -- Gatilhos da skill
    trigger_keywords TEXT[], -- Palavras que ativam esta skill
    trigger_intents TEXT[],  -- Intenções que ativam
    trigger_patterns TEXT[], -- Regex patterns

    -- Ações da skill
    actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de ações a executar

    -- Fluxo condicional
    conditions JSONB DEFAULT '[]'::jsonb, -- Condições para executar

    -- Respostas da skill
    responses JSONB NOT NULL DEFAULT '[]'::jsonb, -- Templates de resposta

    -- Métricas
    times_triggered INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_skills_agent ON ai_agent_skills(agent_id);

-- =====================================================
-- 5. BANCO DE CONHECIMENTO DO AGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Tipo de conhecimento
    knowledge_type VARCHAR(50) NOT NULL, -- faq, document, product, policy, script

    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT, -- Resumo para matching rápido

    -- Categorização
    category VARCHAR(100),
    tags TEXT[],

    -- Prioridade e relevância
    priority INTEGER DEFAULT 1,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,

    -- Controle de uso
    is_enabled BOOLEAN DEFAULT true,
    use_in_training BOOLEAN DEFAULT true,

    -- Metadados
    source_url TEXT,
    source_file TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Métricas
    times_used INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,

    -- Embeddings para busca semântica (se usar)
    embedding VECTOR(1536), -- OpenAI embeddings dimension

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_knowledge_agent ON ai_agent_knowledge(agent_id);
CREATE INDEX idx_ai_agent_knowledge_type ON ai_agent_knowledge(knowledge_type);

-- =====================================================
-- 6. FLUXOS DE CONVERSA DO AGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identificação
    name VARCHAR(100) NOT NULL,
    description TEXT,
    flow_type VARCHAR(50) NOT NULL, -- qualification, support, sales, onboarding, survey

    -- Status
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Fluxo padrão do agente

    -- Gatilhos
    trigger_keywords TEXT[],
    trigger_intents TEXT[],
    trigger_conditions JSONB DEFAULT '[]'::jsonb,

    -- Estrutura do fluxo (ReactFlow format)
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Variáveis do fluxo
    variables JSONB DEFAULT '[]'::jsonb,

    -- Configurações
    settings JSONB DEFAULT '{}'::jsonb,

    -- Métricas
    times_started INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    avg_completion_rate DECIMAL(3,2) DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_flows_agent ON ai_agent_flows(agent_id);

-- =====================================================
-- 7. SESSÕES DE ATENDIMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Status da sessão
    status ai_session_status NOT NULL DEFAULT 'active',

    -- Fluxo atual
    current_flow_id UUID REFERENCES ai_agent_flows(id),
    current_node_id VARCHAR(100),
    flow_variables JSONB DEFAULT '{}'::jsonb,

    -- Contexto da sessão
    context JSONB DEFAULT '{}'::jsonb,
    collected_data JSONB DEFAULT '{}'::jsonb, -- Dados coletados durante a sessão
    intent_history TEXT[], -- Histórico de intenções detectadas
    sentiment_history TEXT[], -- Histórico de sentimentos

    -- Métricas da sessão
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0, -- milissegundos
    confidence_scores DECIMAL(3,2)[] DEFAULT ARRAY[]::DECIMAL(3,2)[], -- Histórico de confidence

    -- Handoff
    handed_off_to UUID REFERENCES profiles(id),
    handoff_reason TEXT,
    handoff_at TIMESTAMPTZ,

    -- Avaliação
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    internal_quality_score DECIMAL(3,2),

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_sessions_agent ON ai_agent_sessions(agent_id);
CREATE INDEX idx_ai_sessions_conversation ON ai_agent_sessions(conversation_id);
CREATE INDEX idx_ai_sessions_contact ON ai_agent_sessions(contact_id);
CREATE INDEX idx_ai_sessions_status ON ai_agent_sessions(status);
CREATE INDEX idx_ai_sessions_started ON ai_agent_sessions(started_at DESC);

-- =====================================================
-- 8. LOG DE AÇÕES DO AGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Ação executada
    action_type ai_action_type NOT NULL,
    action_name VARCHAR(100),

    -- Input/Output
    input_data JSONB,
    output_data JSONB,

    -- Análise de IA
    detected_intent VARCHAR(100),
    detected_sentiment VARCHAR(20),
    confidence_score DECIMAL(3,2),

    -- Skill/Fluxo usado
    skill_id UUID REFERENCES ai_agent_skills(id),
    flow_id UUID REFERENCES ai_agent_flows(id),
    node_id VARCHAR(100),

    -- Status
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Performance
    processing_time_ms INTEGER,
    tokens_used INTEGER,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_action_logs_session ON ai_agent_action_logs(session_id);
CREATE INDEX idx_ai_action_logs_agent ON ai_agent_action_logs(agent_id);
CREATE INDEX idx_ai_action_logs_created ON ai_agent_action_logs(created_at DESC);

-- =====================================================
-- 9. TEMPLATES DE RESPOSTA
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE, -- NULL = template global da empresa
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identificação
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- greeting, farewell, apologize, confirm, etc

    -- Conteúdo
    content TEXT NOT NULL,
    variations TEXT[], -- Variações do mesmo template

    -- Variáveis suportadas
    variables TEXT[], -- {{nome}}, {{produto}}, etc

    -- Condições de uso
    conditions JSONB DEFAULT '[]'::jsonb, -- Quando usar este template

    -- Controle
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,

    -- Métricas
    times_used INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_response_templates_agent ON ai_agent_response_templates(agent_id);
CREATE INDEX idx_ai_response_templates_company ON ai_agent_response_templates(company_id);

-- =====================================================
-- 10. REGRAS DE HANDOFF
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_handoff_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identificação
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Prioridade
    priority INTEGER NOT NULL DEFAULT 1,
    is_enabled BOOLEAN DEFAULT true,

    -- Condições para handoff
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Exemplos de condições:
    -- [{"type": "keyword", "value": "falar com humano"}]
    -- [{"type": "sentiment", "operator": "equals", "value": "negative", "consecutive": 3}]
    -- [{"type": "confidence", "operator": "less_than", "value": 0.5}]
    -- [{"type": "messages_count", "operator": "greater_than", "value": 10}]
    -- [{"type": "intent", "value": "complaint"}]

    -- Ação de handoff
    target_type VARCHAR(50) NOT NULL DEFAULT 'queue', -- queue, specific_agent, team, round_robin
    target_id UUID, -- ID do agente/equipe específico
    target_queue VARCHAR(100),

    -- Mensagens
    pre_handoff_message TEXT, -- Mensagem antes de transferir
    handoff_message TEXT, -- Mensagem durante transferência

    -- Coleta de dados antes do handoff
    collect_data_before BOOLEAN DEFAULT false,
    data_to_collect JSONB DEFAULT '[]'::jsonb,

    -- Contexto a passar
    include_conversation_summary BOOLEAN DEFAULT true,
    include_collected_data BOOLEAN DEFAULT true,
    include_sentiment_history BOOLEAN DEFAULT true,

    -- Métricas
    times_triggered INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_handoff_rules_agent ON ai_agent_handoff_rules(agent_id);

-- =====================================================
-- 11. TREINAMENTO E FEEDBACK
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Tipo de dado de treinamento
    data_type VARCHAR(50) NOT NULL, -- example, correction, feedback, conversation

    -- Conteúdo
    input_text TEXT NOT NULL, -- Pergunta/mensagem do cliente
    expected_output TEXT, -- Resposta esperada
    actual_output TEXT, -- Resposta que o agente deu

    -- Feedback
    is_correct BOOLEAN,
    correction TEXT,
    feedback_notes TEXT,

    -- Origem
    source_session_id UUID REFERENCES ai_agent_sessions(id),
    source_message_id UUID,
    reviewed_by UUID REFERENCES profiles(id),

    -- Status
    used_in_training BOOLEAN DEFAULT false,
    training_batch_id VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_training_data_agent ON ai_agent_training_data(agent_id);
CREATE INDEX idx_ai_training_data_type ON ai_agent_training_data(data_type);

-- =====================================================
-- 12. MÉTRICAS E ANALYTICS AGREGADAS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Período
    period_type VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Métricas de volume
    total_sessions INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    unique_contacts INTEGER DEFAULT 0,

    -- Métricas de qualidade
    avg_confidence_score DECIMAL(3,2),
    avg_response_time_ms INTEGER,
    avg_session_duration_seconds INTEGER,
    avg_messages_per_session DECIMAL(5,2),

    -- Métricas de resolução
    sessions_completed INTEGER DEFAULT 0,
    sessions_handed_off INTEGER DEFAULT 0,
    sessions_abandoned INTEGER DEFAULT 0,
    sessions_failed INTEGER DEFAULT 0,
    resolution_rate DECIMAL(3,2),

    -- Métricas de satisfação
    ratings_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(2,1),
    positive_ratings INTEGER DEFAULT 0,
    negative_ratings INTEGER DEFAULT 0,

    -- Métricas de intenções
    top_intents JSONB DEFAULT '[]'::jsonb, -- [{intent, count, percentage}]

    -- Métricas de skills
    skill_usage JSONB DEFAULT '{}'::jsonb, -- {skill_id: count}

    -- Métricas de erros
    errors_count INTEGER DEFAULT 0,
    error_types JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_metrics_agent ON ai_agent_metrics(agent_id);
CREATE INDEX idx_ai_agent_metrics_period ON ai_agent_metrics(period_type, period_start);

-- =====================================================
-- 13. VERSÕES DO AGENTE (HISTÓRICO)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Versão
    version_number INTEGER NOT NULL,
    version_name VARCHAR(100),

    -- Snapshot completo do agente
    agent_snapshot JSONB NOT NULL,

    -- Mudanças
    changes_summary TEXT,
    changed_by UUID REFERENCES profiles(id),

    -- Status
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id),

    -- Métricas desta versão
    sessions_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(2,1),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_versions_agent ON ai_agent_versions(agent_id);

-- =====================================================
-- 14. A/B TESTING
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Identificação
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Variantes (agentes sendo testados)
    variant_a_agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    variant_b_agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    traffic_split DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- % para variante A

    -- Período
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, running, paused, completed

    -- Métricas objetivo
    primary_metric VARCHAR(50) NOT NULL, -- resolution_rate, satisfaction, response_time

    -- Resultados
    results JSONB DEFAULT '{}'::jsonb,
    winner_variant VARCHAR(1), -- 'A' ou 'B'
    statistical_significance DECIMAL(3,2),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 15. INTEGRAÇÕES EXTERNAS
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agent_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Tipo de integração
    integration_type VARCHAR(50) NOT NULL, -- webhook, api, calendar, crm, ecommerce
    integration_name VARCHAR(100) NOT NULL,

    -- Configuração
    is_enabled BOOLEAN DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    credentials_encrypted TEXT, -- Credenciais criptografadas

    -- Endpoints
    webhook_url TEXT,
    api_base_url TEXT,

    -- Mapeamento de dados
    data_mapping JSONB DEFAULT '{}'::jsonb,

    -- Status
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_integrations_agent ON ai_agent_integrations(agent_id);

-- =====================================================
-- 16. TRIGGERS E FUNCTIONS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

CREATE TRIGGER trigger_ai_agent_channels_updated_at
    BEFORE UPDATE ON ai_agent_channels
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

CREATE TRIGGER trigger_ai_agent_skills_updated_at
    BEFORE UPDATE ON ai_agent_skills
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

CREATE TRIGGER trigger_ai_agent_flows_updated_at
    BEFORE UPDATE ON ai_agent_flows
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

CREATE TRIGGER trigger_ai_agent_response_templates_updated_at
    BEFORE UPDATE ON ai_agent_response_templates
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

CREATE TRIGGER trigger_ai_agent_handoff_rules_updated_at
    BEFORE UPDATE ON ai_agent_handoff_rules
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_updated_at();

-- Function para atualizar métricas do agente
CREATE OR REPLACE FUNCTION update_ai_agent_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_agents SET
            total_sessions = total_sessions + 1,
            last_active_at = NOW()
        WHERE id = NEW.agent_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'completed' THEN
            UPDATE ai_agents SET
                avg_messages_per_session = (
                    (avg_messages_per_session * total_sessions + NEW.messages_sent) /
                    (total_sessions + 1)
                )
            WHERE id = NEW.agent_id;
        ELSIF NEW.status = 'handed_off' THEN
            UPDATE ai_agents SET
                total_handoffs = total_handoffs + 1
            WHERE id = NEW.agent_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_agent_session_metrics
    AFTER INSERT OR UPDATE ON ai_agent_sessions
    FOR EACH ROW EXECUTE FUNCTION update_ai_agent_session_metrics();

-- =====================================================
-- 17. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_handoff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_integrations ENABLE ROW LEVEL SECURITY;

-- Policies para ai_agents
CREATE POLICY "Users can view agents from their company"
    ON ai_agents FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create agents for their company"
    ON ai_agents FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update agents from their company"
    ON ai_agents FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete agents from their company"
    ON ai_agents FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_channels
CREATE POLICY "Users can manage agent channels from their company"
    ON ai_agent_channels FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_skills
CREATE POLICY "Users can manage agent skills from their company"
    ON ai_agent_skills FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_knowledge
CREATE POLICY "Users can manage agent knowledge from their company"
    ON ai_agent_knowledge FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_flows
CREATE POLICY "Users can manage agent flows from their company"
    ON ai_agent_flows FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_sessions
CREATE POLICY "Users can view sessions from their company"
    ON ai_agent_sessions FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "System can manage sessions"
    ON ai_agent_sessions FOR ALL
    USING (true);

-- Policies para ai_agent_action_logs
CREATE POLICY "Users can view action logs from their company"
    ON ai_agent_action_logs FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_response_templates
CREATE POLICY "Users can manage templates from their company"
    ON ai_agent_response_templates FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_handoff_rules
CREATE POLICY "Users can manage handoff rules from their company"
    ON ai_agent_handoff_rules FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_training_data
CREATE POLICY "Users can manage training data from their company"
    ON ai_agent_training_data FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_metrics
CREATE POLICY "Users can view metrics from their company"
    ON ai_agent_metrics FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_versions
CREATE POLICY "Users can manage versions from their company"
    ON ai_agent_versions FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_ab_tests
CREATE POLICY "Users can manage ab tests from their company"
    ON ai_agent_ab_tests FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Policies para ai_agent_integrations
CREATE POLICY "Users can manage integrations from their company"
    ON ai_agent_integrations FOR ALL
    USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- =====================================================
-- 18. COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE ai_agents IS 'Agentes de IA para atendimento automatizado nos canais';
COMMENT ON TABLE ai_agent_channels IS 'Vinculação de agentes aos canais de atendimento';
COMMENT ON TABLE ai_agent_skills IS 'Habilidades e capacidades dos agentes';
COMMENT ON TABLE ai_agent_knowledge IS 'Base de conhecimento dos agentes (FAQs, docs, etc)';
COMMENT ON TABLE ai_agent_flows IS 'Fluxos de conversa estruturados';
COMMENT ON TABLE ai_agent_sessions IS 'Sessões de atendimento ativas e históricas';
COMMENT ON TABLE ai_agent_action_logs IS 'Log de todas ações executadas pelos agentes';
COMMENT ON TABLE ai_agent_response_templates IS 'Templates de resposta reutilizáveis';
COMMENT ON TABLE ai_agent_handoff_rules IS 'Regras para transferência para humanos';
COMMENT ON TABLE ai_agent_training_data IS 'Dados para treinamento e melhoria dos agentes';
COMMENT ON TABLE ai_agent_metrics IS 'Métricas agregadas de performance';
COMMENT ON TABLE ai_agent_versions IS 'Histórico de versões dos agentes';
COMMENT ON TABLE ai_agent_ab_tests IS 'Testes A/B entre agentes';
COMMENT ON TABLE ai_agent_integrations IS 'Integrações externas dos agentes';
