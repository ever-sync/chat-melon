-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('message', 'task', 'deal', 'inactivity', 'system')) DEFAULT 'system',
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid() AND company_id = get_user_company(auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (company_id = get_user_company(auth.uid()));

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_company_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'system',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    company_id,
    title,
    message,
    type,
    entity_type,
    entity_id,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_company_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger para notificar quando deal é movido
CREATE OR REPLACE FUNCTION notify_deal_moved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
  v_contact_name TEXT;
BEGIN
  -- Buscar nomes dos stages
  SELECT name INTO v_old_stage_name FROM pipeline_stages WHERE id = OLD.stage_id;
  SELECT name INTO v_new_stage_name FROM pipeline_stages WHERE id = NEW.stage_id;
  
  -- Buscar nome do contato
  SELECT name INTO v_contact_name FROM contacts WHERE id = NEW.contact_id;
  
  -- Criar notificação para o responsável
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.assigned_to,
      NEW.company_id,
      '🔄 Negócio Movido',
      format('%s movido de "%s" para "%s"', 
        COALESCE(v_contact_name, NEW.title),
        v_old_stage_name,
        v_new_stage_name
      ),
      'deal',
      'deal',
      NEW.id,
      '/crm',
      jsonb_build_object(
        'old_stage', v_old_stage_name,
        'new_stage', v_new_stage_name,
        'deal_value', NEW.value
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_deal_moved ON deals;
CREATE TRIGGER trigger_notify_deal_moved
  AFTER UPDATE OF stage_id ON deals
  FOR EACH ROW
  WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
  EXECUTE FUNCTION notify_deal_moved();

-- Trigger para notificar quando nova mensagem chega
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation RECORD;
  v_user_id UUID;
BEGIN
  -- Apenas para mensagens recebidas (não enviadas)
  IF NEW.is_from_me = false THEN
    -- Buscar informações da conversa
    SELECT * INTO v_conversation
    FROM conversations
    WHERE id = NEW.conversation_id;
    
    -- Notificar o usuário responsável pela conversa
    IF v_conversation.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        v_conversation.assigned_to,
        v_conversation.company_id,
        format('💬 Nova mensagem de %s', v_conversation.contact_name),
        LEFT(NEW.content, 100),
        'message',
        'conversation',
        NEW.conversation_id,
        '/chat',
        jsonb_build_object(
          'contact_number', v_conversation.contact_number,
          'message_id', NEW.id
        )
      );
    ELSE
      -- Se não tem responsável, notificar todos os usuários da empresa
      FOR v_user_id IN 
        SELECT user_id FROM company_users WHERE company_id = v_conversation.company_id
      LOOP
        PERFORM create_notification(
          v_user_id,
          v_conversation.company_id,
          format('💬 Nova mensagem de %s', v_conversation.contact_name),
          LEFT(NEW.content, 100),
          'message',
          'conversation',
          NEW.conversation_id,
          '/chat',
          jsonb_build_object(
            'contact_number', v_conversation.contact_number,
            'message_id', NEW.id
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger para notificar quando tarefa fica atrasada
CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
BEGIN
  FOR v_task IN
    SELECT t.*, c.name as contact_name
    FROM tasks t
    LEFT JOIN contacts c ON c.id = t.contact_id
    WHERE t.status = 'pending'
      AND t.due_date < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_type = 'task'
          AND n.entity_id = t.id
          AND n.type = 'task'
          AND n.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    PERFORM create_notification(
      v_task.assigned_to,
      v_task.company_id,
      '⏰ Tarefa Atrasada',
      format('%s - Venceu em %s', 
        v_task.title,
        TO_CHAR(v_task.due_date, 'DD/MM/YYYY HH24:MI')
      ),
      'task',
      'task',
      v_task.id,
      '/tasks',
      jsonb_build_object(
        'contact_name', v_task.contact_name,
        'days_overdue', EXTRACT(day FROM NOW() - v_task.due_date)
      )
    );
  END LOOP;
END;
$$;

-- Trigger para notificar deals inativos (sem atividade há 7 dias)
CREATE OR REPLACE FUNCTION notify_inactive_deals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_contact_name TEXT;
BEGIN
  FOR v_deal IN
    SELECT d.*
    FROM deals d
    WHERE d.status = 'open'
      AND (d.last_activity < NOW() - INTERVAL '7 days' OR d.last_activity IS NULL)
      AND d.created_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_type = 'deal'
          AND n.entity_id = d.id
          AND n.type = 'inactivity'
          AND n.created_at > NOW() - INTERVAL '7 days'
      )
  LOOP
    SELECT name INTO v_contact_name FROM contacts WHERE id = v_deal.contact_id;
    
    IF v_deal.assigned_to IS NOT NULL THEN
      PERFORM create_notification(
        v_deal.assigned_to,
        v_deal.company_id,
        '⚠️ Negócio Inativo',
        format('%s está sem atividade há mais de 7 dias', 
          COALESCE(v_contact_name, v_deal.title)
        ),
        'inactivity',
        'deal',
        v_deal.id,
        '/crm',
        jsonb_build_object(
          'days_inactive', EXTRACT(day FROM NOW() - COALESCE(v_deal.last_activity, v_deal.created_at)),
          'deal_value', v_deal.value
        )
      );
    END IF;
  END LOOP;
END;
$$;