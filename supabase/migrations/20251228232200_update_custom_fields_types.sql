-- Migration to add new custom field types: cpf, cnpj, cep
ALTER TABLE public.custom_fields DROP CONSTRAINT IF EXISTS custom_fields_field_type_check;

ALTER TABLE public.custom_fields ADD CONSTRAINT custom_fields_field_type_check 
CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email', 'phone', 'currency', 'cpf', 'cnpj', 'cep', 'textarea'));
