-- Migration: 20251217000010_chat_crm_triggers.sql

-- 1. Função para sincronizar contato do Chat para o CRM
CREATE OR REPLACE FUNCTION sync_conversation_to_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_contact_id UUID;
  v_contact_name TEXT;
  v_contact_phone TEXT;
BEGIN
  -- Tenta obter nome e telefone dos campos da conversa
  v_contact_name := COALESCE(NEW.contact_name, 'Visitante'); 
  v_contact_phone := NEW.contact_number;

  -- Se não tiver telefone, não conseguimos vincular ou criar com segurança(exceto se for email)
  IF v_contact_phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Procurar contato existente pelo telefone ou whatsapp
  SELECT id INTO v_contact_id
  FROM contacts
  WHERE company_id = NEW.company_id
    AND (phone = v_contact_phone OR whatsapp = v_contact_phone)
  LIMIT 1;

  -- Se não existe, criar novo contato
  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (
      company_id,
      name,
      phone,
      whatsapp,
      source,
      created_from_conversation_id,
      created_at
    )
    VALUES (
      NEW.company_id,
      v_contact_name,
      v_contact_phone,
      v_contact_phone,
      'chat',
      NEW.id,
      NOW()
    )
    RETURNING id INTO v_contact_id;
  ELSE
    -- Atualizar última interação se o contato já existe
    UPDATE contacts
    SET
      last_interaction_at = NOW(),
      last_interaction_type = ('chat_' || NEW.channel_type)::text,
      updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;

  -- Vincular a conversa ao contato encontrado ou criado
  -- IMPORTANTE: Isso atualiza a referência na conversa
  NEW.contact_id := v_contact_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger para executar a sincronização ANTES de inserir (para já salvar com contact_id)
-- Se fosse AFTER, precisaria fazer um UPDATE na própria tabela, o que é mais custoso
DROP TRIGGER IF EXISTS trigger_sync_conversation_to_contact ON conversations;
CREATE TRIGGER trigger_sync_conversation_to_contact
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION sync_conversation_to_contact();


-- 3. Função RPC para criar Deal a partir de uma conversa (para uso no Frontend)
CREATE OR REPLACE FUNCTION create_deal_from_conversation(
  p_conversation_id UUID,
  p_deal_title TEXT,
  p_deal_value DECIMAL(12,2) DEFAULT 0,
  p_pipeline_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_contact_id UUID;
  v_deal_id UUID;
  v_pipeline_id UUID;
  v_first_stage_id UUID;
BEGIN
  -- Obter informações da conversa
  SELECT company_id, contact_id
  INTO v_company_id, v_contact_id
  FROM conversations
  WHERE id = p_conversation_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  IF v_contact_id IS NULL THEN
    RAISE EXCEPTION 'Conversa não está vinculada a um contato. Sincronize o contato primeiro.';
  END IF;

  -- Obter pipeline padrão se não especificado
  IF p_pipeline_id IS NULL THEN
    SELECT id INTO v_pipeline_id
    FROM pipelines
    WHERE company_id = v_company_id
      AND is_default = TRUE
    LIMIT 1;
    
    -- Se não achar default, pega o primeiro criado
    IF v_pipeline_id IS NULL THEN
       SELECT id INTO v_pipeline_id
       FROM pipelines
       WHERE company_id = v_company_id
       ORDER BY created_at ASC
       LIMIT 1;
    END IF;
  ELSE
    v_pipeline_id := p_pipeline_id;
  END IF;

  IF v_pipeline_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum pipeline encontrado para esta empresa.';
  END IF;

  -- Obter primeiro stage do pipeline
  SELECT id INTO v_first_stage_id
  FROM pipeline_stages
  WHERE pipeline_id = v_pipeline_id
  ORDER BY order_index ASC
  LIMIT 1;

  IF v_first_stage_id IS NULL THEN
    RAISE EXCEPTION 'Pipeline selecionado não possui estágios.';
  END IF;

  -- Criar o deal
  INSERT INTO deals (
    company_id,
    contact_id,
    pipeline_id,
    stage_id,
    title,
    value,
    notes,
    source,
    created_from_conversation_id,
    created_at,
    status
  )
  VALUES (
    v_company_id,
    v_contact_id,
    v_pipeline_id,
    v_first_stage_id,
    p_deal_title,
    p_deal_value,
    p_notes,
    'chat',
    p_conversation_id,
    NOW(),
    'open'
  )
  RETURNING id INTO v_deal_id;

  -- Opcional: Registrar atividade de criação
  INSERT INTO activities (
    company_id,
    contact_id,
    deal_id,
    type,
    title,
    description,
    created_at
  )
  VALUES (
    v_company_id,
    v_contact_id,
    v_deal_id,
    'deal_created',
    'Negócio Criado via Chat',
    format('Negócio "%s" iniciado a partir da conversa.', p_deal_title),
    NOW()
  );

  RETURN v_deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_deal_from_conversation(UUID, TEXT, DECIMAL, UUID, TEXT) TO authenticated;

-- 4. Função Helper para Métricas (NOVO)
CREATE OR REPLACE FUNCTION get_contact_metrics(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_conversations INT;
  v_total_deals_won INT;
  v_total_spent DECIMAL(12,2);
  v_last_interaction TIMESTAMP;
BEGIN
  -- Total conversations
  SELECT COUNT(*) INTO v_total_conversations
  FROM conversations
  WHERE contact_id = p_contact_id;
  
  -- Total deals won and value
  SELECT COUNT(*), COALESCE(SUM(value), 0)
  INTO v_total_deals_won, v_total_spent
  FROM deals
  WHERE contact_id = p_contact_id AND status = 'won';

  -- Last interaction
  SELECT MAX(updated_at) INTO v_last_interaction
  FROM conversations
  WHERE contact_id = p_contact_id;

  RETURN jsonb_build_object(
    'total_conversations', v_total_conversations,
    'total_deals_won', v_total_deals_won,
    'total_spent', v_total_spent,
    'last_interaction', v_last_interaction
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_contact_metrics(UUID) TO authenticated;
