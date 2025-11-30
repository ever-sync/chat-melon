-- VERIFICAR CONFIGURAÇÃO COMPLETA DA EMPRESA EVERSYNC
-- Vamos ver todos os campos da tabela evolution_settings

SELECT 
    es.*
FROM evolution_settings es
WHERE es.instance_name = 'Eversync';

-- Verificar também os dados da empresa
SELECT 
    c.id,
    c.name,
    c.evolution_instance_name,
    c.evolution_api_url,
    c.evolution_api_key
FROM companies c
WHERE c.id = 'd865cc81-0272-4691-bc54-44304a77ad4e';
