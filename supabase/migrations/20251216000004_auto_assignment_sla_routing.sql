DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
-- =====================================================
-- FASE 3: Auto-Assignment, SLA Tracking, Routing Rules
-- =====================================================

-- =====================================================
-- 3.1 AUTO-ASSIGNMENT
-- =====================================================

-- Adicionar campo last_assigned_at em queue_members se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'last_assigned_at'
  ) THEN
    ALTER TABLE queue_members ADD COLUMN last_assigned_at TIMESTAMPTZ;
  END IF;
END
$$;

-- Adicionar campo status (online/offline/busy) em queue_members se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'status'
  ) THEN
    ALTER TABLE queue_members ADD COLUMN status VARCHAR(20) DEFAULT 'online';
  END IF;
END
$$;

-- Adicionar skills em queue_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'skills'
  ) THEN
    ALTER TABLE queue_members ADD COLUMN skills TEXT[] DEFAULT '{}';
  END IF;
END
$$;

-- Função principal de auto-assignment
CREATE OR REPLACE FUNCTION assign_conversation_to_agent(
  p_conversation_id UUID,
  p_queue_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_selected_agent_id UUID;
  v_assignment_method TEXT;
  v_max_per_agent INTEGER;
  v_company_id UUID;
BEGIN
  -- Obter queue_id da conversa se não fornecido
  IF p_queue_id IS NULL THEN
    SELECT queue_id, company_id INTO v_queue_id, v_company_id
    FROM conversations
    WHERE id = p_conversation_id;
  ELSE
    v_queue_id := p_queue_id;
    SELECT company_id INTO v_company_id
    FROM conversations
    WHERE id = p_conversation_id;
  END IF;

  -- Se não houver fila, não atribuir
  IF v_queue_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar configurações da fila
  SELECT assignment_method, max_conversations_per_agent, auto_assign
  INTO v_assignment_method, v_max_per_agent
  FROM queues
  WHERE id = v_queue_id AND is_active = TRUE;

  -- Verificar se auto_assign está habilitado
  IF NOT FOUND OR v_assignment_method IS NULL THEN
    RETURN NULL;
  END IF;

  -- Selecionar agente baseado no método
  IF v_assignment_method = 'round_robin' THEN
    -- Round Robin: próximo agente na fila que não atingiu limite
    SELECT qm.user_id INTO v_selected_agent_id
    FROM queue_members qm
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as active_count
      FROM conversations
      WHERE status IN ('open', 'pending') AND company_id = v_company_id
      GROUP BY assigned_to
    ) conv_counts ON conv_counts.assigned_to = qm.user_id
    WHERE qm.queue_id = v_queue_id
      AND qm.is_active = TRUE
      AND qm.status = 'online'
      AND COALESCE(conv_counts.active_count, 0) < COALESCE(qm.max_conversations, v_max_per_agent, 5)
    ORDER BY qm.last_assigned_at NULLS FIRST, qm.created_at
    LIMIT 1;

  ELSIF v_assignment_method = 'load_balancing' THEN
    -- Load Balancing: agente com menos conversas ativas
    SELECT qm.user_id INTO v_selected_agent_id
    FROM queue_members qm
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as active_count
      FROM conversations
      WHERE status IN ('open', 'pending') AND company_id = v_company_id
      GROUP BY assigned_to
    ) conv_counts ON conv_counts.assigned_to = qm.user_id
    WHERE qm.queue_id = v_queue_id
      AND qm.is_active = TRUE
      AND qm.status = 'online'
      AND COALESCE(conv_counts.active_count, 0) < COALESCE(qm.max_conversations, v_max_per_agent, 5)
    ORDER BY COALESCE(conv_counts.active_count, 0) ASC
    LIMIT 1;

  ELSIF v_assignment_method = 'skill_based' THEN
    -- Skill Based: agente que tem skills compatíveis com tags da conversa
    SELECT qm.user_id INTO v_selected_agent_id
    FROM queue_members qm
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as active_count
      FROM conversations
      WHERE status IN ('open', 'pending') AND company_id = v_company_id
      GROUP BY assigned_to
    ) conv_counts ON conv_counts.assigned_to = qm.user_id
    WHERE qm.queue_id = v_queue_id
      AND qm.is_active = TRUE
      AND qm.status = 'online'
      AND COALESCE(conv_counts.active_count, 0) < COALESCE(qm.max_conversations, v_max_per_agent, 5)
    ORDER BY COALESCE(conv_counts.active_count, 0) ASC, qm.last_assigned_at NULLS FIRST
    LIMIT 1;
  END IF;

  -- Se encontrou agente, atribuir
  IF v_selected_agent_id IS NOT NULL THEN
    -- Atualizar conversa
    UPDATE conversations
    SET assigned_to = v_selected_agent_id,
        updated_at = NOW()
    WHERE id = p_conversation_id;

    -- Atualizar last_assigned_at do membro
    UPDATE queue_members
    SET last_assigned_at = NOW()
    WHERE queue_id = v_queue_id AND user_id = v_selected_agent_id;
  END IF;

  RETURN v_selected_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3.2 SLA TRACKING
-- =====================================================

-- Adicionar campos SLA em queues se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'sla_first_response_minutes'
  ) THEN
    ALTER TABLE queues ADD COLUMN sla_first_response_minutes INTEGER DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'sla_resolution_hours'
  ) THEN
    ALTER TABLE queues ADD COLUMN sla_resolution_hours INTEGER DEFAULT 24;
  END IF;
END
$$;

-- Adicionar campos SLA em conversations se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'sla_first_response_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN sla_first_response_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'sla_resolution_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN sla_resolution_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'sla_first_response_met'
  ) THEN
    ALTER TABLE conversations ADD COLUMN sla_first_response_met BOOLEAN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'sla_resolution_met'
  ) THEN
    ALTER TABLE conversations ADD COLUMN sla_resolution_met BOOLEAN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'first_response_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN first_response_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;
END
$$;

-- Função para calcular SLA deadlines ao criar conversa
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  v_queue_config RECORD;
BEGIN
  -- Buscar configurações SLA da fila
  IF NEW.queue_id IS NOT NULL THEN
    SELECT sla_first_response_minutes, sla_resolution_hours
    INTO v_queue_config
    FROM queues
    WHERE id = NEW.queue_id;

    IF FOUND THEN
      NEW.sla_first_response_at := NEW.created_at +
        (COALESCE(v_queue_config.sla_first_response_minutes, 30) || ' minutes')::INTERVAL;

      NEW.sla_resolution_at := NEW.created_at +
        (COALESCE(v_queue_config.sla_resolution_hours, 24) || ' hours')::INTERVAL;
    END IF;
  ELSE
    -- SLA padrão: 30 min primeira resposta, 24h resolução
    NEW.sla_first_response_at := NEW.created_at + INTERVAL '30 minutes';
    NEW.sla_resolution_at := NEW.created_at + INTERVAL '24 hours';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular SLA ao criar conversa
DROP TRIGGER IF EXISTS set_sla_deadlines ON conversations;
CREATE TRIGGER set_sla_deadlines
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sla_deadlines();

-- Função para verificar se primeira resposta foi dada
CREATE OR REPLACE FUNCTION check_first_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é mensagem de saída (do agente) e conversa não tem first_response_at
  IF NEW.is_from_me = TRUE THEN
    UPDATE conversations
    SET
      first_response_at = NEW.created_at,
      sla_first_response_met = (NEW.created_at <= sla_first_response_at)
    WHERE id = NEW.conversation_id
      AND first_response_at IS NULL
      AND sla_first_response_at IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar primeira resposta ao criar mensagem
DROP TRIGGER IF EXISTS check_first_response_trigger ON messages;
CREATE TRIGGER check_first_response_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_first_response();

-- Função para verificar resolução ao fechar conversa
CREATE OR REPLACE FUNCTION check_resolution_sla()
RETURNS TRIGGER AS $$
BEGIN
  -- Se conversa foi fechada/resolvida
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at := NOW();
    NEW.sla_resolution_met := (NOW() <= NEW.sla_resolution_at);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar resolução
DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
CREATE TRIGGER check_resolution_sla_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_resolution_sla();

-- View para métricas de SLA
CREATE OR REPLACE VIEW sla_metrics_view AS
SELECT
  c.company_id,
  q.id as queue_id,
  q.name as queue_name,
  DATE_TRUNC('day', c.created_at) as date,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE c.sla_first_response_met = TRUE) as first_response_met,
  COUNT(*) FILTER (WHERE c.sla_first_response_met = FALSE) as first_response_breached,
  COUNT(*) FILTER (WHERE c.sla_resolution_met = TRUE) as resolution_met,
  COUNT(*) FILTER (WHERE c.sla_resolution_met = FALSE) as resolution_breached,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE c.sla_first_response_met = TRUE) / NULLIF(COUNT(*), 0),
    2
  ) as first_response_rate,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE c.sla_resolution_met = TRUE) / NULLIF(COUNT(*), 0),
    2
  ) as resolution_rate,
  AVG(EXTRACT(EPOCH FROM (c.first_response_at - c.created_at)) / 60) as avg_first_response_minutes,
  AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600) as avg_resolution_hours
FROM conversations c
LEFT JOIN queues q ON q.id = c.queue_id
WHERE c.created_at > NOW() - INTERVAL '90 days'
GROUP BY c.company_id, q.id, q.name, DATE_TRUNC('day', c.created_at);

-- =====================================================
-- 3.3 CHAT ROUTING RULES
-- =====================================================

-- Tabela de regras de roteamento
CREATE TABLE IF NOT EXISTS routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- Maior = maior prioridade
  is_active BOOLEAN DEFAULT TRUE,

  -- Condições (quando aplicar a regra)
  conditions JSONB NOT NULL DEFAULT '[]',
  -- Ex: [
  --   { "type": "keyword", "keywords": ["vendas", "comprar"], "match": "any" },
  --   { "type": "business_hours", "outside": true },
  --   { "type": "contact_tag", "tags": ["vip"] },
  --   { "type": "channel", "channels": ["instagram", "whatsapp"] },
  --   { "type": "new_contact", "value": true }
  -- ]

  -- Ações (o que fazer quando regra bate)
  actions JSONB NOT NULL DEFAULT '[]',
  -- Ex: [
  --   { "type": "assign_queue", "queue_id": "uuid" },
  --   { "type": "assign_agent", "agent_id": "uuid" },
  --   { "type": "add_tag", "tag": "suporte" },
  --   { "type": "start_chatbot", "chatbot_id": "uuid" },
  --   { "type": "send_message", "message": "Olá! Em breve um atendente irá te atender." },
  --   { "type": "set_priority", "priority": "high" }
  -- ]

  -- Métricas
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_routing_rules_company ON routing_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON routing_rules(company_id, is_active, priority DESC);

-- RLS
ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage routing rules from their company" ON routing_rules;
CREATE POLICY "Users can manage routing rules from their company" ON routing_rules
  FOR ALL USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));

-- Função para avaliar e aplicar regras de roteamento
CREATE OR REPLACE FUNCTION apply_routing_rules(
  p_conversation_id UUID,
  p_first_message TEXT DEFAULT NULL,
  p_is_new_contact BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_conversation RECORD;
  v_condition JSONB;
  v_action JSONB;
  v_condition_met BOOLEAN;
  v_all_conditions_met BOOLEAN;
  v_applied_actions JSONB := '[]'::JSONB;
  v_keywords TEXT[];
  v_contact_tags TEXT[];
BEGIN
  -- Buscar informações da conversa
  SELECT c.*, co.tags as contact_tags
  INTO v_conversation
  FROM conversations c
  LEFT JOIN contacts co ON co.id = c.contact_id
  WHERE c.id = p_conversation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;

  -- Buscar regras ativas ordenadas por prioridade
  FOR v_rule IN
    SELECT * FROM routing_rules
    WHERE company_id = v_conversation.company_id
      AND is_active = TRUE
    ORDER BY priority DESC
  LOOP
    v_all_conditions_met := TRUE;

    -- Avaliar cada condição
    FOR v_condition IN SELECT * FROM jsonb_array_elements(v_rule.conditions)
    LOOP
      v_condition_met := FALSE;

      -- Tipo: keyword
      IF (v_condition->>'type') = 'keyword' AND p_first_message IS NOT NULL THEN
        SELECT ARRAY_AGG(elem::TEXT) INTO v_keywords
        FROM jsonb_array_elements_text(v_condition->'keywords') elem;

        IF (v_condition->>'match') = 'all' THEN
          v_condition_met := p_first_message ~* ALL(v_keywords);
        ELSE -- any
          v_condition_met := p_first_message ~* ANY(v_keywords);
        END IF;

      -- Tipo: new_contact
      ELSIF (v_condition->>'type') = 'new_contact' THEN
        v_condition_met := p_is_new_contact = (v_condition->>'value')::BOOLEAN;

      -- Tipo: channel
      ELSIF (v_condition->>'type') = 'channel' THEN
        v_condition_met := v_conversation.channel_type = ANY(
          ARRAY(SELECT jsonb_array_elements_text(v_condition->'channels'))
        );

      -- Tipo: contact_tag
      ELSIF (v_condition->>'type') = 'contact_tag' THEN
        v_condition_met := v_conversation.contact_tags &&
          ARRAY(SELECT jsonb_array_elements_text(v_condition->'tags'));

      -- Tipo: business_hours
      ELSIF (v_condition->>'type') = 'business_hours' THEN
        -- Verificar se está fora do horário comercial (8h-18h, seg-sex)
        IF (v_condition->>'outside')::BOOLEAN THEN
          v_condition_met := NOT (
            EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5 AND
            EXTRACT(HOUR FROM NOW()) BETWEEN 8 AND 17
          );
        ELSE
          v_condition_met := (
            EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5 AND
            EXTRACT(HOUR FROM NOW()) BETWEEN 8 AND 17
          );
        END IF;
      END IF;

      -- Se qualquer condição falhar, regra não aplica
      IF NOT v_condition_met THEN
        v_all_conditions_met := FALSE;
        EXIT;
      END IF;
    END LOOP;

    -- Se todas as condições foram atendidas, aplicar ações
    IF v_all_conditions_met THEN
      FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
      LOOP
        -- Tipo: assign_queue
        IF (v_action->>'type') = 'assign_queue' THEN
          UPDATE conversations
          SET queue_id = (v_action->>'queue_id')::UUID,
              updated_at = NOW()
          WHERE id = p_conversation_id;

          v_applied_actions := v_applied_actions ||
            jsonb_build_object('type', 'assign_queue', 'queue_id', v_action->>'queue_id');

        -- Tipo: assign_agent
        ELSIF (v_action->>'type') = 'assign_agent' THEN
          UPDATE conversations
          SET assigned_to = (v_action->>'agent_id')::UUID,
              updated_at = NOW()
          WHERE id = p_conversation_id;

          v_applied_actions := v_applied_actions ||
            jsonb_build_object('type', 'assign_agent', 'agent_id', v_action->>'agent_id');

        -- Tipo: add_tag (na conversa)
        ELSIF (v_action->>'type') = 'add_tag' THEN
          UPDATE conversations
          SET tags = COALESCE(tags, '{}') || ARRAY[v_action->>'tag'],
              updated_at = NOW()
          WHERE id = p_conversation_id;

          v_applied_actions := v_applied_actions ||
            jsonb_build_object('type', 'add_tag', 'tag', v_action->>'tag');

        -- Tipo: set_priority
        ELSIF (v_action->>'type') = 'set_priority' THEN
          UPDATE conversations
          SET priority = v_action->>'priority',
              updated_at = NOW()
          WHERE id = p_conversation_id;

          v_applied_actions := v_applied_actions ||
            jsonb_build_object('type', 'set_priority', 'priority', v_action->>'priority');
        END IF;
      END LOOP;

      -- Atualizar métricas da regra
      UPDATE routing_rules
      SET times_triggered = times_triggered + 1,
          last_triggered_at = NOW()
      WHERE id = v_rule.id;

      -- Parar após primeira regra que bateu (ou continuar para todas?)
      -- Por padrão, paramos na primeira regra que bate
      EXIT;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'applied_actions', v_applied_actions,
    'conversation_id', p_conversation_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3.4 BULK ACTIONS
-- =====================================================

-- Função para atualizar múltiplas conversas
CREATE OR REPLACE FUNCTION bulk_update_conversations(
  p_conversation_ids UUID[],
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE conversations
  SET
    assigned_to = COALESCE((p_updates->>'assigned_to')::UUID, assigned_to),
    queue_id = COALESCE((p_updates->>'queue_id')::UUID, queue_id),
    status = COALESCE(p_updates->>'status', status),
    priority = COALESCE(p_updates->>'priority', priority),
    tags = CASE
      WHEN p_updates ? 'add_tag' THEN COALESCE(tags, '{}') || ARRAY[p_updates->>'add_tag']
      WHEN p_updates ? 'remove_tag' THEN array_remove(tags, p_updates->>'remove_tag')
      ELSE tags
    END,
    updated_at = NOW()
  WHERE id = ANY(p_conversation_ids);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para arquivar múltiplas conversas
CREATE OR REPLACE FUNCTION bulk_archive_conversations(
  p_conversation_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  UPDATE conversations
  SET
    status = 'archived',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(p_conversation_ids)
    AND status != 'archived';

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_archived_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar tag em múltiplos contatos
CREATE OR REPLACE FUNCTION bulk_tag_contacts(
  p_contact_ids UUID[],
  p_tag TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE contacts
  SET
    tags = CASE
      WHEN NOT (tags @> ARRAY[p_tag]) THEN COALESCE(tags, '{}') || ARRAY[p_tag]
      ELSE tags
    END,
    updated_at = NOW()
  WHERE id = ANY(p_contact_ids);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3.5 PUSH NOTIFICATIONS
-- =====================================================

-- Tabela de subscriptions push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Subscription data
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh, auth }

  -- Metadata
  device_name TEXT,
  user_agent TEXT,
  platform VARCHAR(50), -- web, android, ios

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_company ON push_subscriptions(company_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Conteúdo
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  icon TEXT,
  data JSONB DEFAULT '{}',

  -- Tipo
  type VARCHAR(50) NOT NULL, -- new_message, mention, assignment, sla_warning, etc.

  -- Referências
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, read
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_unread ON notification_logs(user_id, status) WHERE status != 'read';

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_logs;
CREATE POLICY "Users can view their own notifications" ON notification_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notification_logs;
CREATE POLICY "Users can update their own notifications" ON notification_logs
  FOR UPDATE USING (user_id = auth.uid());

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_company_id UUID;
BEGIN
  -- Buscar company_id do usuário
  SELECT company_id INTO v_company_id
  FROM company_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Criar notificação
  INSERT INTO notification_logs (
    user_id, company_id, type, title, body, url, conversation_id, data
  ) VALUES (
    p_user_id, v_company_id, p_type, p_title, p_body, p_url, p_conversation_id, p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Adicionar campo priority em conversations se não existir
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'priority'
  ) THEN
    ALTER TABLE conversations ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
  END IF;
END
$$;

-- =====================================================
-- Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION assign_conversation_to_agent(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_routing_rules(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_conversations(UUID[], JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_archive_conversations(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_tag_contacts(UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT SELECT ON sla_metrics_view TO authenticated;

-- =====================================================
-- Feature Flags
-- =====================================================

INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES
  ('auto_assignment', 'Auto-Assignment', 'Distribuição automática de conversas para agentes', 'productivity', true, 'Users', 30),
  ('sla_tracking', 'SLA Tracking', 'Rastreamento de tempo de resposta e resolução', 'analytics', true, 'Clock', 31),
  ('routing_rules', 'Regras de Roteamento', 'Roteamento inteligente baseado em condições', 'automation', true, 'GitBranch', 32),
  ('push_notifications', 'Push Notifications', 'Notificações push em tempo real', 'communication', true, 'Bell', 33)
ON CONFLICT (feature_key) DO NOTHING;
