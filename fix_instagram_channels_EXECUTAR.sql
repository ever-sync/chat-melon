-- PASSO A PASSO: Corrigir canais Instagram duplicados
-- Execute cada bloco na ordem e verifique os resultados

-- ===== PASSO 1: Ver quantas conversas cada canal tem =====
SELECT
    channel_id,
    COUNT(*) as total_conversas,
    ch.name,
    ch.company_id
FROM conversations
JOIN channels ch ON ch.id = channel_id
WHERE channel_id IN ('26fbe59a-e395-4203-87c3-8f47776af90a', 'b45168f7-117c-4047-a71d-71e877bd9415')
GROUP BY channel_id, ch.name, ch.company_id;

-- ===== PASSO 2: Mover TODAS as conversas para o canal CORRETO =====
-- Canal CORRETO: b45168f7-117c-4047-a71d-71e877bd9415 (company_id: 61215833...)
-- Canal ERRADO:  26fbe59a-e395-4203-87c3-8f47776af90a (company_id: 44d1f270...)

UPDATE conversations
SET channel_id = 'b45168f7-117c-4047-a71d-71e877bd9415'  -- Canal correto
WHERE channel_id = '26fbe59a-e395-4203-87c3-8f47776af90a'; -- Canal errado

-- ===== PASSO 3: Verificar se as conversas foram movidas =====
SELECT
    channel_id,
    COUNT(*) as total_conversas,
    ch.name,
    ch.company_id
FROM conversations
JOIN channels ch ON ch.id = channel_id
WHERE channel_id IN ('26fbe59a-e395-4203-87c3-8f47776af90a', 'b45168f7-117c-4047-a71d-71e877bd9415')
GROUP BY channel_id, ch.name, ch.company_id;

-- Deve mostrar ZERO conversas no canal errado agora

-- ===== PASSO 4: Deletar o canal ERRADO =====
DELETE FROM channels
WHERE id = '26fbe59a-e395-4203-87c3-8f47776af90a'
  AND type = 'instagram'
  AND company_id = '44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6';

-- ===== PASSO 5: Verificação FINAL =====
-- Deve mostrar apenas 1 canal Instagram agora
SELECT
    id,
    name,
    company_id,
    external_id,
    type,
    status,
    created_at
FROM channels
WHERE type = 'instagram'
ORDER BY created_at;

-- ===== PASSO 6: Verificar se as conversas estão OK =====
SELECT
    c.id,
    c.contact_name,
    c.channel_id,
    c.company_id,
    ch.name as channel_name
FROM conversations c
JOIN channels ch ON ch.id = c.channel_id
WHERE c.channel_type = 'instagram'
ORDER BY c.created_at DESC
LIMIT 5;
