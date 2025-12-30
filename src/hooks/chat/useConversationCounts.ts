import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface ConversationCounts {
  all: number;
  atendimento: number;
  aguardando: number;
  bot: number;
  ia: number;
  groups: number;
}

/**
 * Hook para buscar contadores totais de conversas por categoria
 * Busca dados reais do banco de dados, não apenas da página atual
 */
export function useConversationCounts(currentUserId?: string | null) {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['conversation-counts', currentCompany?.id, currentUserId],
    queryFn: async (): Promise<ConversationCounts> => {
      console.log('🔢 Buscando contadores reais para empresa:', currentCompany?.id);

      if (!currentCompany?.id) {
        console.log('⚠️ Nenhuma empresa selecionada, retornando zeros');
        return {
          all: 0,
          atendimento: 0,
          aguardando: 0,
          bot: 0,
          ia: 0,
          groups: 0,
        };
      }

      try {
        // Buscar todas as conversas de uma vez e contar no JavaScript
        const { data: allConversations, error } = await supabase
          .from('conversations')
          .select('id, status, assigned_to, ai_enabled, contact_number')
          .eq('company_id', currentCompany.id)
          .neq('status', 'closed');

        if (error) {
          console.error('❌ Erro ao buscar conversas:', error);
          throw error;
        }

        console.log('📊 Total de conversas carregadas:', allConversations?.length || 0);

        const conversations = allConversations || [];

        // Contar localmente
        const counts = {
          all: conversations.length,
          atendimento: conversations.filter(c =>
            c.assigned_to &&
            c.status !== 'chatbot' &&
            !c.ai_enabled
          ).length,
          aguardando: conversations.filter(c =>
            (c.status === 'waiting' || c.status === 're_entry') &&
            !c.assigned_to
          ).length,
          bot: conversations.filter(c =>
            c.status === 'chatbot' &&
            !c.ai_enabled
          ).length,
          ia: conversations.filter(c =>
            c.ai_enabled === true
          ).length,
          groups: conversations.filter(c => 
            c.contact_number?.endsWith('@g.us')
          ).length,
        };

        console.log('✅ Contadores calculados:', counts);
        return counts;
      } catch (error) {
        console.error('❌ Erro ao buscar contadores de conversas:', error);
        // Retornar zeros em caso de erro
        return {
          all: 0,
          atendimento: 0,
          aguardando: 0,
          bot: 0,
          ia: 0,
          groups: 0,
        };
      }
    },
    enabled: !!currentCompany?.id,
    staleTime: 10 * 1000, // Cache por 10 segundos (reduzido para debug)
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
    retry: 1, // Tentar apenas 1 vez em caso de erro
  });
}
