-- =====================================================
-- VERIFICAR: usuário é membro da empresa certa?
-- =====================================================

-- 1. Ver todos os membros da empresa 61215833-73aa-49c6-adcc-790b9d11fd30
SELECT 
  cm.user_id,
  cm.role,
  p.email,
  p.full_name
FROM company_members cm
JOIN profiles p ON cm.user_id = p.id
WHERE cm.company_id = '61215833-73aa-49c6-adcc-790b9d11fd30';

-- 2. Ver o usuário logado atualmente (pelo profile que existe)
SELECT id, email, full_name, company_id FROM profiles LIMIT 10;

-- 3. Verificar se o company_id da conversa bate com o company_id do usuário
-- A conversa Ever Sync está na empresa 61215833-73aa-49c6-adcc-790b9d11fd30
-- O usuário precisa ser membro dessa empresa para ver as mensagens
