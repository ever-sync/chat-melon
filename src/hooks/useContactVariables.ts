import { useMemo } from 'react';
import { useVariables } from './useVariables';
import { useCustomFields } from './useCustomFields';

export interface ContactVariable {
  key: string;
  label: string;
  description?: string;
  value?: string;
  category: 'default' | 'company' | 'custom';
}

/**
 * Hook centralizado para obter todas as variáveis de contato disponíveis
 * Combina variáveis padrão do sistema, variáveis da empresa e campos personalizados
 */
export function useContactVariables() {
  const { variables: companyVariables } = useVariables();
  const { fields: customFields } = useCustomFields('contact');

  // Variáveis padrão do sistema (campos fixos do contato)
  const defaultVariables: ContactVariable[] = useMemo(() => [
    { key: 'nome', label: 'Nome do Contato', description: 'Nome completo do contato', category: 'default' },
    { key: 'primeiro_nome', label: 'Primeiro Nome', description: 'Primeiro nome do contato', category: 'default' },
    { key: 'telefone', label: 'Telefone', description: 'Número de telefone', category: 'default' },
    { key: 'email', label: 'Email', description: 'Email do contato', category: 'default' },
    { key: 'empresa', label: 'Empresa', description: 'Nome da empresa (se for contato PJ)', category: 'default' },
    { key: 'cpf', label: 'CPF', description: 'CPF do contato (se for PF)', category: 'default' },
    { key: 'cnpj', label: 'CNPJ', description: 'CNPJ do contato (se for PJ)', category: 'default' },
    { key: 'cep', label: 'CEP', description: 'CEP do endereço', category: 'default' },
    { key: 'cep_numero', label: 'Número', description: 'Número do endereço', category: 'default' },
    { key: 'cep_uf', label: 'UF', description: 'Estado', category: 'default' },
    { key: 'cep_rua', label: 'Rua', description: 'Nome da rua', category: 'default' },
    { key: 'cep_cidade', label: 'Cidade', description: 'Nome da cidade', category: 'default' },
    { key: 'cep_bairro', label: 'Bairro', description: 'Nome do bairro', category: 'default' },
    { key: 'iri', label: 'IRI', description: 'Identificador único', category: 'default' },
  ], []);

  // Variáveis da empresa
  const companyVars: ContactVariable[] = useMemo(() =>
    companyVariables.map(v => ({
      key: v.key,
      label: v.label,
      description: v.description || `Variável da empresa: ${v.label}`,
      value: v.value,
      category: 'company' as const,
    }))
  , [companyVariables]);

  // Campos personalizados de contato
  // Agora sincronizados automaticamente com company_variables via triggers
  const customVars: ContactVariable[] = useMemo(() => {
    // Filtra apenas variáveis da categoria 'contact' que foram auto-criadas dos custom_fields
    const contactCategoryVars = companyVariables
      .filter(v => v.category === 'contact')
      .map(v => ({
        key: v.key,
        label: v.label,
        description: v.description || `Campo personalizado: ${v.label}`,
        value: v.value,
        category: 'custom' as const,
      }));

    // Também inclui custom_fields que ainda não foram sincronizados (fallback)
    const customFieldsVars = customFields
      .filter(cf => cf.is_active)
      .filter(cf => !contactCategoryVars.some(cv => cv.key === cf.field_name))
      .map(cf => ({
        key: cf.field_name,
        label: cf.field_label,
        description: `Campo personalizado: ${cf.field_label} (${cf.field_type})`,
        category: 'custom' as const,
      }));

    return [...contactCategoryVars, ...customFieldsVars];
  }, [customFields, companyVariables]);

  // Combinar todas as variáveis
  const allVariables = useMemo(() => [
    ...defaultVariables,
    ...companyVars,
    ...customVars,
  ], [defaultVariables, companyVars, customVars]);

  return {
    allVariables,
    defaultVariables,
    companyVariables: companyVars,
    customVariables: customVars,
  };
}

/**
 * Função utilitária para substituir variáveis em um texto
 * @param text Texto com variáveis no formato {{variavel}}
 * @param contact Objeto de contato com os dados
 * @param companyVariables Variáveis da empresa
 * @returns Texto com variáveis substituídas
 */
export function replaceContactVariables(
  text: string,
  contact: any,
  companyVariables: Array<{ key: string; value: string }> = []
): string {
  let result = text;

  // Substituir variáveis padrão
  result = result.replace(/\{\{nome\}\}/g, contact?.name || '');
  result = result.replace(/\{\{primeiro_nome\}\}/g, contact?.name ? contact.name.split(' ')[0] : '');
  result = result.replace(/\{\{telefone\}\}/g, contact?.phone_number || '');
  result = result.replace(/\{\{email\}\}/g, contact?.email || '');
  result = result.replace(/\{\{empresa\}\}/g, contact?.company_data?.name || '');
  result = result.replace(/\{\{cpf\}\}/g, contact?.cpf || '');
  result = result.replace(/\{\{cnpj\}\}/g, contact?.cnpj || '');
  result = result.replace(/\{\{cep\}\}/g, contact?.cep || '');
  result = result.replace(/\{\{cep_numero\}\}/g, contact?.cep_numero || '');
  result = result.replace(/\{\{cep_uf\}\}/g, contact?.cep_uf || '');
  result = result.replace(/\{\{cep_rua\}\}/g, contact?.cep_rua || '');
  result = result.replace(/\{\{cep_cidade\}\}/g, contact?.cep_cidade || '');
  result = result.replace(/\{\{cep_bairro\}\}/g, contact?.cep_bairro || '');
  result = result.replace(/\{\{iri\}\}/g, contact?.iri || '');

  // Substituir variáveis da empresa
  companyVariables.forEach(v => {
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value || '');
  });

  // Substituir campos personalizados (tenta com e sem o prefixo 'contato_')
  if (contact?.custom_field_values) {
    Object.entries(contact.custom_field_values).forEach(([key, value]) => {
      // Substitui {{field_name}}
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
      // Substitui {{contato_field_name}}
      result = result.replace(new RegExp(`\\{\\{contato_${key}\\}\\}`, 'g'), String(value || ''));
    });
  }

  return result;
}

/**
 * Função utilitária para renderizar preview de mensagem com exemplos
 * @param text Texto com variáveis
 * @param companyVariables Variáveis da empresa
 * @returns Preview com dados de exemplo
 */
export function renderContactVariablesPreview(
  text: string,
  companyVariables: Array<{ key: string; value: string }> = []
): string {
  let preview = text;

  // Exemplos para variáveis padrão
  preview = preview.replace(/\{\{nome\}\}/g, 'João Silva');
  preview = preview.replace(/\{\{primeiro_nome\}\}/g, 'João');
  preview = preview.replace(/\{\{telefone\}\}/g, '5511999999999');
  preview = preview.replace(/\{\{email\}\}/g, 'joao@email.com');
  preview = preview.replace(/\{\{empresa\}\}/g, 'Empresa ABC');
  preview = preview.replace(/\{\{cpf\}\}/g, '123.456.789-00');
  preview = preview.replace(/\{\{cnpj\}\}/g, '12.345.678/0001-00');
  preview = preview.replace(/\{\{cep\}\}/g, '01234-567');
  preview = preview.replace(/\{\{cep_numero\}\}/g, '123');
  preview = preview.replace(/\{\{cep_uf\}\}/g, 'SP');
  preview = preview.replace(/\{\{cep_rua\}\}/g, 'Rua das Flores');
  preview = preview.replace(/\{\{cep_cidade\}\}/g, 'São Paulo');
  preview = preview.replace(/\{\{cep_bairro\}\}/g, 'Centro');
  preview = preview.replace(/\{\{iri\}\}/g, 'IRI-12345');

  // Substituir variáveis da empresa com valores reais
  companyVariables.forEach(v => {
    preview = preview.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.value || '');
  });

  // Substituir campos personalizados que ainda estão no texto com placeholder
  preview = preview.replace(/\{\{([^}]+)\}\}/g, '[Campo: $1]');

  return preview;
}
