-- VERIFICAR SE O evolution_instance_name FOI CONFIGURADO
SELECT 
    c.id,
    c.name,
    c.evolution_instance_name,
    es.instance_name as evolution_settings_instance
FROM companies c
LEFT JOIN evolution_settings es ON c.id = es.company_id
WHERE c.name = 'EverSync';
