-- Corrigir a associação da instância RaphaelSantos com a empresa correta do chatbot
-- A instância estava em 61215833-73aa-49c6-adcc-790b9d11fd30
-- Mas o chatbot está em 44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6

-- Atualizar a configuração existente
UPDATE evolution_settings
SET company_id = '44d1f270-1dc8-4ae9-9ff4-6a92849ae6a6'
WHERE instance_name = 'RaphaelSantos';
