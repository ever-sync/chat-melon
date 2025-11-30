-- INVESTIGAÇÃO DE EMPRESAS
-- O print mostrou que as conversas pertencem a EMPRESAS DIFERENTES!
-- Vamos descobrir qual delas é a verdadeira e qual é fantasma.

SELECT 
    id, 
    name, 
    created_at 
FROM companies 
WHERE id IN (
    'd865cc81-0272-4691-bc54-44304a77ad4e', -- Empresa da conversa VAZIA (que você vê)
    'd8827b63-d69a-44ac-89a2-aa2fc85a29e2'  -- Empresa da conversa CHEIA (onde a mensagem chegou)
);

-- Ver em qual empresa VOCÊ está
SELECT 
    u.email,
    cm.company_id,
    c.name as company_name
FROM company_members cm
JOIN companies c ON cm.company_id = c.id
JOIN auth.users u ON cm.user_id = u.id
WHERE cm.user_id = auth.uid();
