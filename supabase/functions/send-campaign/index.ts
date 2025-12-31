import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { campaignId, resume = false } = await req.json();

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campanha não encontrada');
    }

    // Buscar contatos do segmento aplicando os filtros
    let contactIds: string[] = [];

    if (campaign.segment_id) {
      const { data: segment } = await supabase
        .from('segments')
        .select('filters')
        .eq('id', campaign.segment_id)
        .single();

      if (segment && segment.filters) {
        // Aplicar filtros do segmento para buscar contatos
        const filters = segment.filters as Array<{field: string; operator: string; value: any; logic?: string}>;

        // Construir query base
        let query = supabase
          .from('contacts')
          .select('id, phone_number')
          .eq('company_id', campaign.company_id)
          .is('deleted_at', null);

        // Aplicar cada filtro
        for (const filter of filters) {
          const { field, operator, value } = filter;

          switch (operator) {
            case 'equals':
              query = query.eq(field, value);
              break;
            case 'not_equals':
              query = query.neq(field, value);
              break;
            case 'contains':
              query = query.ilike(field, `%${value}%`);
              break;
            case 'starts_with':
              query = query.ilike(field, `${value}%`);
              break;
            case 'ends_with':
              query = query.ilike(field, `%${value}`);
              break;
            case 'is_empty':
              query = query.is(field, null);
              break;
            case 'is_not_empty':
              query = query.not(field, 'is', null);
              break;
            case 'greater_than':
              query = query.gt(field, value);
              break;
            case 'less_than':
              query = query.lt(field, value);
              break;
            case 'before':
              query = query.lt(field, value);
              break;
            case 'after':
              query = query.gt(field, value);
              break;
          }
        }

        const { data: filteredContacts, error: filterError } = await query;

        if (filterError) {
          console.error('Error filtering contacts:', filterError);
          throw new Error('Erro ao filtrar contatos do segmento');
        }

        if (filteredContacts && filteredContacts.length > 0) {
          // Remove duplicates by phone number
          const uniquePhones = new Set<string>();
          const uniqueContacts: string[] = [];

          for (const contact of filteredContacts) {
            if (contact.phone_number && !uniquePhones.has(contact.phone_number)) {
              uniquePhones.add(contact.phone_number);
              uniqueContacts.push(contact.id);
            }
          }

          // Check for blocked contacts
          const { data: blockedContacts } = await supabase
            .from('blocked_contacts')
            .select('blocked_number')
            .eq('company_id', campaign.company_id);

          const blockedNumbers = new Set(
            blockedContacts?.map(b => b.blocked_number) || []
          );

          // Filter out blocked contacts
          contactIds = [];
          for (const contact of filteredContacts) {
            if (uniqueContacts.includes(contact.id) && !blockedNumbers.has(contact.phone_number)) {
              contactIds.push(contact.id);
            }
          }

          console.log(`Segment filters applied: ${filteredContacts.length} matched, ${contactIds.length} valid after dedup/blocked removal`);
        } else {
          console.log('No contacts matched the segment filters');
        }
      } else {
        console.log('Segment has no filters defined');
      }
    } else {
      console.log('No segment_id specified for campaign');
    }

    if (contactIds.length === 0) {
      throw new Error('Nenhum contato encontrado para este segmento. Verifique os filtros do segmento.');
    }

    // Criar registros de campaign_contacts se não existirem
    if (!resume) {
      const campaignContacts = contactIds.map(contactId => ({
        campaign_id: campaignId,
        contact_id: contactId,
        status: 'pending',
      }));

      await supabase
        .from('campaign_contacts')
        .insert(campaignContacts);

      // Atualizar total de contatos
      await supabase
        .from('campaigns')
        .update({
          total_contacts: contactIds.length,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    } else {
      // Se for resume, apenas atualizar status
      await supabase
        .from('campaigns')
        .update({ status: 'running' })
        .eq('id', campaignId);
    }

    // Buscar instância WhatsApp conectada da empresa
    // Primeiro tenta buscar pelo instance_id se existir, senão busca qualquer instância conectada da empresa
    let instance: any = null;

    if (campaign.instance_id) {
      const { data } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('id', campaign.instance_id)
        .maybeSingle();
      instance = data;
    }

    // Se não encontrou por instance_id ou não está conectada, busca qualquer instância conectada da empresa
    if (!instance || (!instance.is_connected && instance.instance_status !== 'open' && instance.instance_status !== 'connected')) {
      const { data } = await supabase
        .from('evolution_settings')
        .select('*')
        .eq('company_id', campaign.company_id)
        .or('is_connected.eq.true,instance_status.eq.open,instance_status.eq.connected')
        .limit(1)
        .maybeSingle();
      instance = data;
    }

    if (!instance) {
      throw new Error('Nenhuma instância WhatsApp encontrada para esta empresa');
    }

    // Verificar se está conectada
    const isConnected = instance.is_connected === true ||
                        instance.instance_status === 'open' ||
                        instance.instance_status === 'connected';

    if (!isConnected) {
      throw new Error('Instância WhatsApp não conectada. Verifique a conexão em Configurações.');
    }

    // Buscar configuração global da Evolution API para obter api_url e api_key
    const { data: globalConfig } = await supabase
      .from('evolution_global_config')
      .select('api_url, api_key')
      .eq('is_active', true)
      .maybeSingle();

    if (!globalConfig) {
      throw new Error('Evolution API não configurada. Configure em Configurações > Evolution API');
    }

    // Adicionar api_url e api_key da config global na instância
    instance.api_url = globalConfig.api_url;
    instance.api_key = globalConfig.api_key;

    console.log(`Using instance: ${instance.instance_name}, is_connected: ${instance.is_connected}, status: ${instance.instance_status}`);

    // Processar envios em background
    processQueue(supabase, campaign, instance);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Campanha iniciada com sucesso',
        totalContacts: contactIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processQueue(supabase: any, campaign: any, instance: any) {
  console.log('Processing campaign queue:', campaign.id);

  // Calcular delay entre mensagens baseado na taxa de envio
  // sending_rate = mensagens por minuto
  // delayMs = (60 segundos / taxa) * 1000 = milissegundos entre cada mensagem
  const delayMs = Math.max((60 / (campaign.sending_rate || 10)) * 1000, 1000); // Mínimo 1 segundo
  console.log(`Delay between messages: ${delayMs}ms (${campaign.sending_rate || 10} msgs/min)`);

  let consecutiveErrors = 0;
  let totalSent = 0;
  let isFirstMessage = true;

  while (true) {
    // Check if campaign is still running
    const { data: currentCampaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', campaign.id)
      .single();

    if (!currentCampaign || currentCampaign.status !== 'running') {
      console.log('Campaign stopped or paused');
      break;
    }

    // Check instance health
    const { data: currentInstance } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('id', instance.id)
      .single();

    // Reset daily counter if needed
    const today = new Date().toISOString().split('T')[0];
    if (currentInstance.last_reset_date !== today) {
      await supabase
        .from('evolution_settings')
        .update({
          messages_sent_today: 0,
          last_reset_date: today,
        })
        .eq('id', instance.id);
      currentInstance.messages_sent_today = 0;
    }

    // Check daily limit
    if (currentInstance.messages_sent_today >= currentInstance.daily_message_limit) {
      console.log('Daily message limit reached');
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);
      break;
    }

    // Check business hours if enabled
    if (campaign.business_hours_only) {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
      const startTime = campaign.business_hours_start || '09:00';
      const endTime = campaign.business_hours_end || '18:00';

      if (currentTime < startTime || currentTime >= endTime) {
        console.log('Outside business hours, waiting...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        continue;
      }
    }

    // Check error rate
    const errorRate = campaign.sent_count > 0 
      ? (campaign.failed_count / campaign.sent_count) * 100 
      : 0;
    
    if (errorRate > 10 && campaign.sent_count > 10) {
      console.log('Error rate too high, pausing campaign');
      await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);
      break;
    }

    // Aplicar delay ANTES de enviar a próxima mensagem (exceto na primeira)
    if (!isFirstMessage) {
      console.log(`Waiting ${delayMs}ms before next message...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    isFirstMessage = false;

    // Get next pending contact
    const { data: campaignContacts } = await supabase
      .from('campaign_contacts')
      .select('*, contacts(*)')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .limit(1);

    if (!campaignContacts || campaignContacts.length === 0) {
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      console.log('Campaign completed');
      break;
    }

    const campaignContact = campaignContacts[0];
    const contact = campaignContact.contacts;

    try {
      // Check if contact is blocked
      const { data: blocked } = await supabase
        .from('blocked_contacts')
        .select('id')
        .eq('company_id', campaign.company_id)
        .eq('blocked_number', contact.phone_number)
        .maybeSingle();

      if (blocked) {
        console.log(`Contact ${contact.phone_number} is blocked, skipping`);
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'failed',
            error_message: 'Contato bloqueado',
          })
          .eq('id', campaignContact.id);
        continue;
      }

      // Validate message length
      let message = campaign.message_content;

      // Substituir variáveis padrão do contato
      message = message.replace(/\{\{nome\}\}/g, contact.name || 'Cliente');
      message = message.replace(/\{\{primeiro_nome\}\}/g, contact.name ? contact.name.split(' ')[0] : 'Cliente');
      message = message.replace(/\{\{telefone\}\}/g, contact.phone_number || '');
      message = message.replace(/\{\{email\}\}/g, contact.email || '');
      message = message.replace(/\{\{empresa\}\}/g, contact.company_data?.name || '');
      message = message.replace(/\{\{cpf\}\}/g, contact.cpf || '');
      message = message.replace(/\{\{cnpj\}\}/g, contact.cnpj || '');

      // Substituir variáveis de endereço (CEP)
      message = message.replace(/\{\{cep\}\}/g, contact.cep || '');
      message = message.replace(/\{\{cep_numero\}\}/g, contact.cep_numero || '');
      message = message.replace(/\{\{cep_uf\}\}/g, contact.cep_uf || '');
      message = message.replace(/\{\{cep_rua\}\}/g, contact.cep_rua || '');
      message = message.replace(/\{\{cep_cidade\}\}/g, contact.cep_cidade || '');
      message = message.replace(/\{\{cep_bairro\}\}/g, contact.cep_bairro || '');

      // Substituir variável IRI (se existir)
      message = message.replace(/\{\{iri\}\}/g, contact.iri || '');

      if (message.length > 1000) {
        console.log(`Message too long for ${contact.phone_number}, skipping`);
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'failed',
            error_message: 'Mensagem muito longa (>1000 caracteres)',
          })
          .eq('id', campaignContact.id);
        continue;
      }

      // Send message via Evolution API
      const evolutionResponse = await fetch(
        `${instance.api_url}/message/sendText/${instance.instance_name}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': instance.api_key,
          },
          body: JSON.stringify({
            number: contact.phone_number,
            text: message,
          }),
        }
      );

      if (evolutionResponse.ok) {
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', campaignContact.id);

        await supabase.rpc('increment', {
          table_name: 'campaigns',
          column_name: 'sent_count',
          row_id: campaign.id,
        });

        // Increment daily counter
        await supabase
          .from('evolution_settings')
          .update({
            messages_sent_today: currentInstance.messages_sent_today + 1,
          })
          .eq('id', instance.id);

        consecutiveErrors = 0;
        totalSent++;
        console.log(`Message sent to ${contact.phone_number}`);
      } else {
        throw new Error('Failed to send via Evolution API');
      }

    } catch (error) {
      console.error(`Error sending to ${contact.phone_number}:`, error);
      consecutiveErrors++;
      
      await supabase
        .from('campaign_contacts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', campaignContact.id);

      await supabase.rpc('increment', {
        table_name: 'campaigns',
        column_name: 'failed_count',
        row_id: campaign.id,
      });

      // Pause if too many consecutive errors
      if (consecutiveErrors >= 5) {
        console.log('Too many consecutive errors, pausing campaign');
        await supabase
          .from('campaigns')
          .update({ status: 'paused' })
          .eq('id', campaign.id);
        break;
      }
    }

    // Calculate delivery rate
    if (totalSent > 0) {
      const deliveryRate = ((totalSent - consecutiveErrors) / totalSent) * 100;
      await supabase
        .from('evolution_settings')
        .update({ delivery_rate: deliveryRate.toFixed(2) })
        .eq('id', instance.id);
    }

    // O delay agora é aplicado no início do loop (antes de cada mensagem)
  }

  console.log(`Campaign ${campaign.id} finished processing. Total sent: ${totalSent}`);
}
