/**
 * Helper functions to provide contact variable context to AI
 * This ensures AI-generated content can reference dynamic contact fields
 */

import { supabase } from '@/lib/supabaseClient';

export interface ContactContext {
  contactId: string;
  contactData: Record<string, any>;
  availableVariables: Array<{
    key: string;
    label: string;
    value?: string;
    category: string;
  }>;
}

/**
 * Fetches all available variables for a contact (including custom fields)
 * This data is used to inform the AI about what variables it can reference
 */
export async function getContactVariablesContext(
  contactId: string,
  companyId: string
): Promise<ContactContext | null> {
  try {
    // 1. Get contact data with custom fields
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, custom_field_values')
      .eq('id', contactId)
      .single();

    if (contactError) throw contactError;

    // 2. Get all active company variables (auto-synced with custom_fields)
    const { data: variables, error: varsError } = await supabase
      .from('company_variables')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (varsError) throw varsError;

    // 3. Build available variables list with actual values
    const availableVariables = [
      // Default contact variables
      { key: 'nome', label: 'Nome do Contato', value: contact.name, category: 'default' },
      { key: 'primeiro_nome', label: 'Primeiro Nome', value: contact.name?.split(' ')[0], category: 'default' },
      { key: 'telefone', label: 'Telefone', value: contact.phone_number, category: 'default' },
      { key: 'email', label: 'Email', value: contact.email, category: 'default' },
      { key: 'empresa', label: 'Empresa', value: contact.company_data?.name, category: 'default' },
      { key: 'cpf', label: 'CPF', value: contact.cpf, category: 'default' },
      { key: 'cnpj', label: 'CNPJ', value: contact.cnpj, category: 'default' },

      // Company variables (non-contact specific)
      ...(variables || [])
        .filter(v => v.category !== 'contact')
        .map(v => ({
          key: v.key,
          label: v.label,
          value: v.value || v.default_value,
          category: 'company',
        })),

      // Custom contact fields (auto-synced variables)
      ...(variables || [])
        .filter(v => v.category === 'contact')
        .map(v => ({
          key: v.key,
          label: v.label,
          value: contact.custom_field_values?.[v.key] || v.default_value,
          category: 'custom',
        })),
    ].filter(v => v.value); // Only include variables with values

    return {
      contactId,
      contactData: contact,
      availableVariables,
    };
  } catch (error) {
    console.error('Error getting contact variables context:', error);
    return null;
  }
}

/**
 * Builds a prompt context string for AI that includes available variables
 * This helps the AI understand what dynamic data it can reference
 */
export function buildAIVariablesPrompt(context: ContactContext | null): string {
  if (!context) return '';

  const variablesList = context.availableVariables
    .map(v => `- {{${v.key}}}: ${v.label} (atual: "${v.value}")`)
    .join('\n');

  return `
VARIÁVEIS DISPONÍVEIS:
Você pode usar as seguintes variáveis nas suas sugestões usando o formato {{variavel}}:

${variablesList}

IMPORTANTE:
- Use variáveis quando apropriado para personalizar as mensagens
- As variáveis serão automaticamente substituídas pelos valores reais ao enviar
- Campos personalizados são sincronizados automaticamente do sistema
`;
}

/**
 * Example usage in AI suggestion generation:
 *
 * const context = await getContactVariablesContext(contactId, companyId);
 * const variablesPrompt = buildAIVariablesPrompt(context);
 *
 * const aiPrompt = `${variablesPrompt}\n\nGerar uma mensagem de follow-up para o cliente.`;
 */
