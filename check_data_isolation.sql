-- DIAGNÓSTICO DE ISOLAMENTO DE DADOS
-- Verificar se o usuário está vendo conversas de outras empresas

-- 1. Ver qual empresa você está vinculado
SELECT 
    u.email,
    cm.company_id,
    c.name as company_name,
    cm.role
FROM company_members cm
JOIN companies c ON cm.company_id = c.id
JOIN auth.users u ON cm.user_id = u.id
WHERE cm.user_id = auth.uid();

-- 2. Ver as conversas que você está vendo (e suas empresas)
SELECT 
    conv.id,
    conv.contact_name,
    conv.company_id,
    comp.name as company_name
FROM conversations conv
JOIN companies comp ON conv.company_id = comp.id
ORDER BY conv.created_at DESC
LIMIT 10;

-- 3. Verificar se existem conversas de OUTRAS empresas aparecendo
SELECT 
    conv.id,
    conv.contact_name,
    conv.company_id,
    comp.name as company_name
FROM conversations conv
JOIN companies comp ON conv.company_id = comp.id
WHERE conv.company_id NOT IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
)
LIMIT 5;
