import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstanceManagerRequest {
  action: 'create' | 'delete' | 'get-qrcode' | 'check-status' | 'restart' | 'configure-webhook';
  companyId: string;
  instanceName?: string;
}

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

    const { action, companyId, instanceName }: InstanceManagerRequest = await req.json();

    console.log(`Evolution Instance Manager - Action: ${action}, Company: ${companyId}`);

    // Usar segredos globais
    const apiUrl = Deno.env.get('EVOLUTION_API_URL');
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nos segredos do backend.');
    }

    // Buscar ou criar configurações da Evolution para esta empresa
    let { data: settings, error: settingsError } = await supabase
      .from('evolution_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    // Se não existir configuração e a ação é criar, criar nova
    if (!settings && action === 'create') {
      if (!instanceName) {
        throw new Error('Nome da instância é obrigatório');
      }

      const { data: newSettings, error: createError } = await supabase
        .from('evolution_settings')
        .insert({
          user_id: user.id,
          company_id: companyId,
          instance_name: instanceName,
          instance_status: 'creating',
          auto_created: true,
        })
        .select()
        .single();

      if (createError) throw createError;
      settings = newSettings;
    }

    if (!settings) {
      // Se não houver configurações para esta empresa, em vez de lançar erro
      // retornamos um estado "not_created" para que o frontend trate corretamente
      if (action === 'check-status') {
        return new Response(
          JSON.stringify({ success: true, status: 'not_created', isConnected: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'get-qrcode') {
        return new Response(
          JSON.stringify({ success: true, status: 'not_created', qrCode: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'restart' || action === 'delete') {
        return new Response(
          JSON.stringify({ success: true, status: 'not_created', message: 'Instância ainda não existe para esta empresa' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const instance = settings.instance_name;

    switch (action) {
      case 'create': {
        console.log(`Criando instância: ${instance}`);
        
        // URL do webhook para receber eventos da Evolution API
        const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;
        
        // Criar instância na Evolution API
        const createResponse = await fetch(`${apiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            instanceName: instance,
            token: apiKey,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        // Configurar webhook separadamente após criar a instância
        if (createResponse.ok) {
          console.log('Configurando webhook para:', instance);

          try {
            const webhookResponse = await fetch(`${apiUrl}/webhook/set/${instance}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
              },
              body: JSON.stringify({
                url: webhookUrl,
                webhook_by_events: true,
                webhook_base64: true,
                events: [
                  'APPLICATION_STARTUP',
                  'QRCODE_UPDATED',
                  'MESSAGES_SET',
                  'MESSAGES_UPSERT',
                  'MESSAGES_UPDATE',
                  'MESSAGES_DELETE',
                  'SEND_MESSAGE',
                  'CONTACTS_SET',
                  'CONTACTS_UPSERT',
                  'CONTACTS_UPDATE',
                  'PRESENCE_UPDATE',
                  'CHATS_SET',
                  'CHATS_UPSERT',
                  'CHATS_UPDATE',
                  'CHATS_DELETE',
                  'CONNECTION_UPDATE',
                  'GROUPS_UPSERT',
                  'GROUP_UPDATE',
                  'GROUP_PARTICIPANTS_UPDATE',
                  'CALL',
                  'NEW_JWT_TOKEN',
                ],
              }),
            });

            if (webhookResponse.ok) {
              console.log('✅ Webhook configurado com sucesso!');
            } else {
              console.error('⚠️ Erro ao configurar webhook:', await webhookResponse.text());
            }
          } catch (webhookError) {
            console.error('⚠️ Erro ao configurar webhook:', webhookError);
          }
        }

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Erro ao criar instância:', errorText);
          
          // Parse error to check if it's a duplicate name
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          
          // Check if error is about duplicate instance name
          const isDuplicateName = errorData?.response?.message?.some(
            (msg: string) => msg.includes('already in use')
          );
          
          if (isDuplicateName) {
            // Delete the settings record we just created since instance creation failed
            await supabase
              .from('evolution_settings')
              .delete()
              .eq('id', settings.id);
            
            return new Response(
              JSON.stringify({ 
                error: 'Nome da instância já está em uso. Por favor, escolha outro nome.',
                code: 'DUPLICATE_INSTANCE_NAME'
              }),
              {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
          
          // For other errors, update status and return generic error
          await supabase
            .from('evolution_settings')
            .update({ instance_status: 'error' })
            .eq('id', settings.id);

          return new Response(
            JSON.stringify({ 
              error: 'Erro ao criar instância na Evolution API. Tente novamente.',
              details: errorData
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const createData = await createResponse.json();
        console.log('Instância criada:', createData);

        // Buscar QR Code
        const qrResponse = await fetch(`${apiUrl}/instance/connect/${instance}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });

        let qrCode = null;
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCode = qrData.base64 || qrData.qrcode?.base64;
        }

        // Atualizar status
        await supabase
          .from('evolution_settings')
          .update({
            instance_status: 'created',
            qr_code: qrCode,
            qr_code_updated_at: new Date().toISOString(),
            is_connected: false,
          })
          .eq('id', settings.id);

        return new Response(
          JSON.stringify({ success: true, qrCode, data: createData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-qrcode': {
        console.log(`Buscando QR Code para: ${instance}`);
        
        const qrResponse = await fetch(`${apiUrl}/instance/connect/${instance}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });

        if (!qrResponse.ok) {
          throw new Error('Erro ao buscar QR Code');
        }

        const qrData = await qrResponse.json();
        const qrCode = qrData.base64 || qrData.qrcode?.base64;

        await supabase
          .from('evolution_settings')
          .update({
            qr_code: qrCode,
            qr_code_updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        return new Response(
          JSON.stringify({ success: true, qrCode }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-status': {
        console.log(`Verificando status de: ${instance}`);
        
        const statusResponse = await fetch(`${apiUrl}/instance/connectionState/${instance}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });

        if (!statusResponse.ok) {
          throw new Error('Erro ao verificar status');
        }

        const statusData = await statusResponse.json();
        const state = statusData.state || statusData.instance?.state;
        
        let newStatus = 'created';
        let isConnected = false;

        if (state === 'open' || state === 'connected') {
          newStatus = 'connected';
          isConnected = true;
        } else if (state === 'close' || state === 'disconnected') {
          newStatus = 'disconnected';
          isConnected = false;
        }

        await supabase
          .from('evolution_settings')
          .update({
            instance_status: newStatus,
            is_connected: isConnected,
            last_connection_check: new Date().toISOString(),
          })
          .eq('id', settings.id);

        return new Response(
          JSON.stringify({ success: true, status: newStatus, state, isConnected }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'restart': {
        console.log(`Reiniciando instância: ${instance}`);

        const restartResponse = await fetch(`${apiUrl}/instance/restart/${instance}`, {
          method: 'PUT',
          headers: {
            'apikey': apiKey,
          },
        });

        if (!restartResponse.ok) {
          throw new Error('Erro ao reiniciar instância');
        }

        // Reconfigurar webhook ao reiniciar
        const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;
        try {
          const webhookResponse = await fetch(`${apiUrl}/webhook/set/${instance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
            },
            body: JSON.stringify({
              url: webhookUrl,
              webhook_by_events: true,
              webhook_base64: true,
              events: [
                'APPLICATION_STARTUP',
                'QRCODE_UPDATED',
                'MESSAGES_SET',
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'MESSAGES_DELETE',
                'SEND_MESSAGE',
                'CONTACTS_SET',
                'CONTACTS_UPSERT',
                'CONTACTS_UPDATE',
                'PRESENCE_UPDATE',
                'CHATS_SET',
                'CHATS_UPSERT',
                'CHATS_UPDATE',
                'CHATS_DELETE',
                'CONNECTION_UPDATE',
                'GROUPS_UPSERT',
                'GROUP_UPDATE',
                'GROUP_PARTICIPANTS_UPDATE',
                'CALL',
                'NEW_JWT_TOKEN',
              ],
            }),
          });

          if (webhookResponse.ok) {
            console.log('✅ Webhook reconfigurado após restart!');
          } else {
            console.error('⚠️ Erro ao reconfigurar webhook:', await webhookResponse.text());
          }
        } catch (webhookError) {
          console.error('⚠️ Erro ao reconfigurar webhook:', webhookError);
        }

        await supabase
          .from('evolution_settings')
          .update({
            instance_status: 'created',
            last_connection_check: new Date().toISOString(),
          })
          .eq('id', settings.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Instância reiniciada e webhook reconfigurado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'configure-webhook': {
        console.log(`Configurando webhook para: ${instance}`);

        const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;

        const webhookResponse = await fetch(`${apiUrl}/webhook/set/${instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: true,
            events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED',
              'MESSAGES_SET',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'MESSAGES_DELETE',
              'SEND_MESSAGE',
              'CONTACTS_SET',
              'CONTACTS_UPSERT',
              'CONTACTS_UPDATE',
              'PRESENCE_UPDATE',
              'CHATS_SET',
              'CHATS_UPSERT',
              'CHATS_UPDATE',
              'CHATS_DELETE',
              'CONNECTION_UPDATE',
              'GROUPS_UPSERT',
              'GROUP_UPDATE',
              'GROUP_PARTICIPANTS_UPDATE',
              'CALL',
              'NEW_JWT_TOKEN',
            ],
          }),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Erro ao configurar webhook:', errorText);
          throw new Error('Erro ao configurar webhook');
        }

        const webhookData = await webhookResponse.json();
        console.log('✅ Webhook configurado:', webhookData);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Webhook configurado com sucesso',
            webhookUrl,
            data: webhookData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        console.log(`Deletando instância: ${instance}`);
        
        const deleteResponse = await fetch(`${apiUrl}/instance/delete/${instance}`, {
          method: 'DELETE',
          headers: {
            'apikey': apiKey,
          },
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error('Erro ao deletar instância:', errorText);
        }

        // Atualizar status mesmo se houve erro ao deletar da API
        await supabase
          .from('evolution_settings')
          .update({
            instance_status: 'not_created',
            qr_code: null,
            is_connected: false,
          })
          .eq('id', settings.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Instância deletada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Ação inválida');
    }

  } catch (error) {
    console.error('Erro no Evolution Instance Manager:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    // Tratar erro conhecido de nome de instância já em uso
    if (errorMessage.includes('already in use')) {
      return new Response(
        JSON.stringify({
          error: 'Nome da instância já está em uso. Por favor, escolha outro nome.',
          code: 'DUPLICATE_INSTANCE_NAME',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});