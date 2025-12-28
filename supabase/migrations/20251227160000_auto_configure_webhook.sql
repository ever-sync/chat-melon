-- Migration: Configuração automática de webhook para novas instâncias
-- Garante que todas as instâncias criadas tenham webhook configurado automaticamente

-- Função para configurar webhook automaticamente quando uma instância é criada
CREATE OR REPLACE FUNCTION auto_configure_evolution_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Configurar webhook_url automaticamente se não estiver definida
  IF NEW.webhook_url IS NULL OR NEW.webhook_url = '' THEN
    -- Obter URL do Supabase (assumindo que está em https://[project-ref].supabase.co)
    -- Em produção, use a variável de ambiente ou configure manualmente
    NEW.webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/evolution-webhook';

    -- Se a variável não estiver definida, usar um placeholder que precisa ser configurado
    IF NEW.webhook_url IS NULL OR NEW.webhook_url = '/functions/v1/evolution-webhook' THEN
      NEW.webhook_url := 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook';
    END IF;
  END IF;

  -- Habilitar webhook por padrão
  IF NEW.webhook_enabled IS NULL THEN
    NEW.webhook_enabled := true;
  END IF;

  -- Configurar eventos padrão se não estiverem definidos
  IF NEW.webhook_events IS NULL OR array_length(NEW.webhook_events, 1) IS NULL THEN
    NEW.webhook_events := ARRAY[
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED',
      'MESSAGES_SET',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONTACTS_SET',
      'CONTACTS_UPSERT',
      'CONTACTS_UPDATE',
      'PRESENCE_UPDATE',
      'CHATS_SET',
      'CHATS_UPSERT',
      'CHATS_UPDATE',
      'CHATS_DELETE',
      'CONNECTION_UPDATE',
      'GROUPS_UPSERT',
      'GROUP_UPDATE',
      'GROUP_PARTICIPANTS_UPDATE',
      'CALL',
      'NEW_JWT_TOKEN'
    ];
  END IF;

  RETURN NEW;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION auto_configure_evolution_webhook() IS
'Configura automaticamente o webhook para novas instâncias da Evolution API';

-- Criar trigger para configuração automática ANTES de inserir
DROP TRIGGER IF EXISTS trigger_auto_configure_webhook ON evolution_settings;

CREATE TRIGGER trigger_auto_configure_webhook
  BEFORE INSERT ON evolution_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_configure_evolution_webhook();

-- Comentário do trigger
COMMENT ON TRIGGER trigger_auto_configure_webhook ON evolution_settings IS
'Trigger que configura webhook automaticamente antes de criar nova instância';

-- Atualizar instâncias existentes que não têm webhook configurado
UPDATE evolution_settings
SET
  webhook_url = 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook',
  webhook_enabled = true,
  webhook_events = ARRAY[
    'APPLICATION_STARTUP',
    'QRCODE_UPDATED',
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'MESSAGES_DELETE',
    'SEND_MESSAGE',
    'CONNECTION_UPDATE',
    'CONTACTS_UPDATE',
    'PRESENCE_UPDATE',
    'CHATS_UPDATE'
  ]
WHERE webhook_url IS NULL
   OR webhook_url = ''
   OR webhook_enabled IS NULL
   OR webhook_events IS NULL;

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_evolution_settings_webhook
ON evolution_settings(webhook_enabled, instance_name)
WHERE webhook_enabled = true;

COMMENT ON INDEX idx_evolution_settings_webhook IS
'Índice para consultas rápidas de instâncias com webhook habilitado';
