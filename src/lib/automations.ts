import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AutomationRule {
  type: 'create_task' | 'send_notification' | 'update_probability' | 'send_email';
  config: {
    title?: string;
    description?: string;
    probability?: number;
    message?: string;
    subject?: string;
    body?: string;
  };
}

export const executeAutomations = async (
  dealId: string,
  automationRules: AutomationRule[] | null
) => {
  if (!automationRules || automationRules.length === 0) return;

  console.log('Executando automações para deal:', dealId, automationRules);

  for (const rule of automationRules) {
    try {
      switch (rule.type) {
        case 'create_task':
          await createAutomatedTask(dealId, rule.config);
          break;

        case 'send_notification':
          await sendNotification(dealId, rule.config);
          break;

        case 'update_probability':
          await updateProbability(dealId, rule.config);
          break;

        case 'send_email':
          // Email integration seria implementado aqui
          console.log('Envio de email automático:', rule.config);
          break;

        default:
          console.warn('Tipo de automação desconhecido:', rule.type);
      }
    } catch (error) {
      console.error('Erro ao executar automação:', error);
      // Não falhar todo o processo por causa de uma automação
    }
  }
};

const createAutomatedTask = async (
  dealId: string,
  config: AutomationRule['config']
) => {
  const { data: deal } = await supabase
    .from('deals')
    .select('assigned_to, company_id')
    .eq('id', dealId)
    .single();

  if (!deal) return;

  const { error } = await supabase.from('tasks').insert({
    title: config.title || 'Tarefa automática',
    description: config.description || '',
    deal_id: dealId,
    assigned_to: deal.assigned_to || undefined,
    company_id: deal.company_id,
    status: 'pending',
    priority: 'medium',
  });

  if (error) {
    console.error('Erro ao criar tarefa automática:', error);
  } else {
    toast.success('Tarefa criada automaticamente!');
  }
};

const sendNotification = async (dealId: string, config: AutomationRule['config']) => {
  const { data: deal } = await supabase
    .from('deals')
    .select('assigned_to, title, company_id')
    .eq('id', dealId)
    .single();

  if (!deal || !deal.assigned_to) return;

  const { error } = await supabase.from('notifications').insert({
    user_id: deal.assigned_to,
    company_id: deal.company_id,
    title: 'Atualização de negócio',
    message: config.message || `O negócio "${deal.title}" foi atualizado`,
    type: 'deal_update',
    reference_id: dealId,
    reference_type: 'deal',
  });

  if (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};

const updateProbability = async (
  dealId: string,
  config: AutomationRule['config']
) => {
  if (config.probability === undefined) return;

  const { error } = await supabase
    .from('deals')
    .update({ probability: config.probability })
    .eq('id', dealId);

  if (error) {
    console.error('Erro ao atualizar probabilidade:', error);
  } else {
    toast.success(`Probabilidade atualizada para ${config.probability}%`);
  }
};
