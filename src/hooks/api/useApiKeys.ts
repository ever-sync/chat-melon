import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  key_prefix: string;
  permissions: string[];
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  total_requests: number;
  last_used_at?: string;
  last_used_ip?: string;
  is_active: boolean;
  expires_at?: string;
  revoked_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  permissions?: string[];
  scopes?: string[];
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  expires_at?: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  secret: string; // Only returned on creation
}

// Generate a secure random API key
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'mk_live_';
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const key = prefix + randomPart;

  // We'll compute hash on the server for security
  return { key, prefix, hash: '' };
}

// Hash the API key (should be done server-side in production)
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const useApiKeys = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('company_id', companyId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!companyId,
  });

  const createApiKey = useMutation({
    mutationFn: async (input: CreateApiKeyInput): Promise<ApiKeyWithSecret> => {
      if (!companyId) throw new Error('No company selected');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Generate key and hash
      const { key, prefix } = generateApiKey();
      const keyHash = await hashApiKey(key);

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          company_id: companyId,
          name: input.name,
          description: input.description,
          key_hash: keyHash,
          key_prefix: prefix,
          permissions: input.permissions || ['read'],
          scopes: input.scopes || ['*'],
          rate_limit_per_minute: input.rate_limit_per_minute || 60,
          rate_limit_per_day: input.rate_limit_per_day || 10000,
          expires_at: input.expires_at,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        secret: key, // Only time we return the full key
      } as ApiKeyWithSecret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key criada!', {
        description: 'Guarde a chave em um lugar seguro. Ela não será mostrada novamente.',
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar API Key: ' + error.message);
    },
  });

  const revokeApiKey = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('api_keys')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user.user?.id,
          revoked_reason: reason,
          is_active: false,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key revogada!');
    },
    onError: (error) => {
      toast.error('Erro ao revogar API Key: ' + error.message);
    },
  });

  const updateApiKey = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Pick<
          ApiKey,
          | 'name'
          | 'description'
          | 'permissions'
          | 'scopes'
          | 'rate_limit_per_minute'
          | 'rate_limit_per_day'
          | 'is_active'
        >
      >;
    }) => {
      const { error } = await supabase.from('api_keys').update(updates).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API Key atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar API Key: ' + error.message);
    },
  });

  return {
    apiKeys,
    isLoading,
    createApiKey,
    revokeApiKey,
    updateApiKey,
  };
};

// Available permissions
export const API_PERMISSIONS = [
  { value: 'read', label: 'Leitura', description: 'Ler dados da API' },
  { value: 'write', label: 'Escrita', description: 'Criar e atualizar dados' },
  { value: 'delete', label: 'Exclusão', description: 'Excluir dados' },
  { value: 'admin', label: 'Admin', description: 'Acesso total' },
] as const;

// Available scopes
export const API_SCOPES = [
  { value: '*', label: 'Todos', description: 'Acesso a todos os recursos' },
  { value: 'contacts', label: 'Contatos', description: 'Gerenciar contatos' },
  { value: 'conversations', label: 'Conversas', description: 'Gerenciar conversas' },
  { value: 'messages', label: 'Mensagens', description: 'Enviar e ler mensagens' },
  { value: 'deals', label: 'Negócios', description: 'Gerenciar pipeline' },
  { value: 'tasks', label: 'Tarefas', description: 'Gerenciar tarefas' },
  { value: 'proposals', label: 'Propostas', description: 'Gerenciar propostas' },
  { value: 'campaigns', label: 'Campanhas', description: 'Gerenciar campanhas' },
  { value: 'webhooks', label: 'Webhooks', description: 'Gerenciar webhooks' },
] as const;
