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

    // Buscar contatos do segmento
    let contactIds: string[] = [];
    
    if (campaign.segment_id) {
      const { data: segment } = await supabase
        .from('segments')
        .select('filters')
        .eq('id', campaign.segment_id)
        .single();

      if (segment) {
        // Buscar contatos que correspondem aos filtros
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, phone_number')
          .eq('company_id', campaign.company_id);
        
        if (contacts) {
          // Remove duplicates by phone number
          const uniquePhones = new Set<string>();
          const uniqueContacts: string[] = [];
          
          for (const contact of contacts) {
            if (!uniquePhones.has(contact.phone_number)) {
              uniquePhones.add(contact.phone_number);
              uniqueContacts.push(contact.id);
            }
          }
          
          contactIds = uniqueContacts;
          
          // Check for blocked contacts
          const { data: blockedContacts } = await supabase
            .from('blocked_contacts')
            .select('blocked_number')
            .eq('company_id', campaign.company_id);
          
          const blockedNumbers = new Set(
            blockedContacts?.map(b => b.blocked_number) || []
          );
          
          // Filter out blocked contacts
          const { data: validContacts } = await supabase
            .from('contacts')
            .select('id, phone_number')
            .in('id', contactIds);
          
          contactIds = validContacts
            ?.filter(c => !blockedNumbers.has(c.phone_number))
            .map(c => c.id) || [];
          
          console.log(`Filtered contacts: ${contacts.length} total, ${contactIds.length} valid (removed ${contacts.length - contactIds.length} blocked/duplicates)`);
        }
      }
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

    // Buscar instância WhatsApp
    const { data: instance } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('id', campaign.instance_id)
      .single();

    if (!instance || !instance.is_connected) {
      throw new Error('Instância WhatsApp não conectada');
    }

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
  
  const delayMs = (60 / campaign.sending_rate) * 1000;
  let consecutiveErrors = 0;
  let totalSent = 0;

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
      message = message.replace(/\{\{nome\}\}/g, contact.name || 'Cliente');
      message = message.replace(/\{\{empresa\}\}/g, contact.company_data?.name || '');
      message = message.replace(/\{\{telefone\}\}/g, contact.phone_number || '');

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

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
