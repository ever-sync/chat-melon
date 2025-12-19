-- Script super simples para inserir a conversa

-- Ver quais triggers existem
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'conversations'
ORDER BY trigger_name;

-- Tentar inserir com valores mínimos obrigatórios
INSERT INTO conversations (
  id,
  company_id,
  user_id,
  contact_name,
  contact_number,
  unread_count,
  created_at,
  updated_at
) VALUES (
  '204cb6ed-978d-4dc0-b1b1-67d48f2324c3'::uuid,
  '61215833-73aa-49c6-adcc-790b9d11fd30'::uuid,
  '1b115bca-8738-4cf8-9995-41892c9815d9'::uuid,
  'Contato Imobiliário',
  'Sem Número',
  13,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT * FROM conversations WHERE company_id = '61215833-73aa-49c6-adcc-790b9d11fd30';
