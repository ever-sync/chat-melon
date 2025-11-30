-- VERIFICAR CONFIGURAÇÕES DAS DUAS EMPRESAS
-- Vamos ver se ambas estão usando o mesmo nome de instância (ex: "Raphael")

SELECT 
    company_id,
    instance_name,
    instance_status,
    is_connected,
    created_at
FROM evolution_settings
WHERE company_id IN (
    'd865cc81-0272-4691-bc54-44304a77ad4e', -- Nova (Hoje)
    'd8827b63-d69a-44ac-89a2-aa2fc85a29e2'  -- Velha (28/11)
);
