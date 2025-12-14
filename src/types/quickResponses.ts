// Types for Quick Responses / Canned Responses 2.0

export interface QuickResponseShortcut {
  id: string;
  company_id: string;
  shortcut: string;
  name: string;
  content: string;
  category?: string;
  tags: string[];
  variables: string[];
  is_favorite: boolean;
  is_personal: boolean;
  usage_count: number;
  avg_response_rate?: number;
  last_used_at?: string;
  created_by?: string;
  created_at: string;
}

export interface ShortcutSuggestion {
  shortcut: string;
  name: string;
  content: string;
  category?: string;
  preview: string;
  matchType: 'exact' | 'partial';
}

export interface QuickResponseFilters {
  category?: string;
  isFavorite?: boolean;
  isPersonal?: boolean;
  search?: string;
  tags?: string[];
}

export interface TemplateVariable {
  name: string;
  value: string;
  type: 'contact' | 'deal' | 'user' | 'custom';
}

export const DEFAULT_VARIABLES: TemplateVariable[] = [
  { name: 'nome', value: '', type: 'contact' },
  { name: 'empresa', value: '', type: 'contact' },
  { name: 'telefone', value: '', type: 'contact' },
  { name: 'email', value: '', type: 'contact' },
  { name: 'vendedor', value: '', type: 'user' },
  { name: 'data', value: '', type: 'custom' },
  { name: 'hora', value: '', type: 'custom' },
];

export const TEMPLATE_CATEGORIES = [
  { value: 'boas-vindas', label: 'Boas-vindas' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'agradecimento', label: 'Agradecimento' },
  { value: 'objecao', label: 'Objeção' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'agendamento', label: 'Agendamento' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'outros', label: 'Outros' },
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['value'];
