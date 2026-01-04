-- Fix: Canais Instagram duplicados

-- 1. Ver TODOS os canais Instagram (incluindo duplicatas)
SELECT
    id,
    name,
    company_id,
    external_id,
    status,
    created_at
FROM channels
WHERE type = 'instagram'
ORDER BY created_at;

-- 2. Ver qual canal tem o company_id correto (este é o que devemos manter)
SELECT
    id,
    name,
    company_id,
    external_id,
    status,
    created_at
FROM channels
WHERE type = 'instagram'
  AND company_id = '61215833-73aa-49c6-adcc-790b9d11fd30';

-- 3. Ver qual canal tem o company_id errado (este devemos deletar)
SELECT
    id,
    name,
    company_id,
    external_id,
    status,
    created_at
FROM channels
WHERE type = 'instagram'
  AND company_id = '44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6';

-- 4. Verificar se há conversas usando o canal errado
SELECT
    COUNT(*) as total_conversas,
    channel_id
FROM conversations
WHERE channel_id IN (
    SELECT id FROM channels
    WHERE type = 'instagram'
      AND company_id = '44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6'
)
GROUP BY channel_id;

-- ATENÇÃO: Execute as queries acima PRIMEIRO
-- Depois execute estas atualizações:

-- 5. Atualizar conversas para usar o canal correto
-- Substitua CANAL_CORRETO_ID e CANAL_ERRADO_ID pelos IDs da query acima
/*
UPDATE conversations
SET channel_id = 'CANAL_CORRETO_ID'  -- Canal com company_id correto
WHERE channel_id = 'CANAL_ERRADO_ID'; -- Canal com company_id errado
*/

-- 6. Deletar o canal duplicado (com company_id errado)
/*
DELETE FROM channels
WHERE id = 'CANAL_ERRADO_ID'
  AND type = 'instagram'
  AND company_id = '44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6';
*/

-- 7. Verificar resultado final
/*
SELECT
    type,
    company_id,
    COUNT(*) as total
FROM channels
WHERE type = 'instagram'
GROUP BY type, company_id;
*/
