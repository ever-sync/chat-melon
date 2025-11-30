-- VERIFICAR MAPEAMENTO DE INSTÂNCIAS E EMPRESAS
-- Vamos ver qual instância está vinculada a qual empresa

SELECT 
    es.instance_name,
    es.company_id,
    c.name as company_name,
    es.is_connected,
    es.instance_status
FROM evolution_settings es
JOIN companies c ON es.company_id = c.id
ORDER BY es.instance_name;
