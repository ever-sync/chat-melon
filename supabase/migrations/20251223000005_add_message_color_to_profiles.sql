-- Adicionar coluna de cor da mensagem ao perfil do usuário
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS message_color TEXT DEFAULT '#6366f1';

-- Comentário explicativo
COMMENT ON COLUMN profiles.message_color IS 'Cor personalizada para as bolhas de mensagem do atendente no chat';
