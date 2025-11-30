-- CONFIGURAR EVOLUTION API NA EMPRESA EVERSYNC
-- Preencha os valores corretos antes de executar

UPDATE companies
SET 
    evolution_instance_name = 'Eversync',
    evolution_api_url = 'COLE_AQUI_A_URL_DA_SUA_EVOLUTION_API',
    evolution_api_key = 'COLE_AQUI_A_API_KEY_DA_EVOLUTION'
WHERE name = 'EverSync';

-- Verificar se funcionou
SELECT 
    id,
    name,
    evolution_instance_name,
    evolution_api_url,
    evolution_api_key
FROM companies
WHERE name = 'EverSync';
