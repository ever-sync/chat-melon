-- CONFIGURAR APENAS O NOME DA INSTÂNCIA (SEM CREDENCIAIS)
UPDATE companies
SET evolution_instance_name = 'Eversync'
WHERE name = 'EverSync';

-- Verificar
SELECT id, name, evolution_instance_name
FROM companies
WHERE name = 'EverSync';
