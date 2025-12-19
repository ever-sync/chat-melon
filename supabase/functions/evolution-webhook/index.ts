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

    const webhookData = await req.json();
    console.log('Webhook sem tratamento (raw):', JSON.stringify(webhookData).substring(0, 200));

    // LOGGING SYSTEM (NOVO)
    try {
      await supabase.from('webhook_logs').insert({
        event_type: webhookData.event || 'unknown',
        payload: webhookData,
        status: 'received'
      });
    } catch (logError) {
      console.error('Falha ao salvar log:', logError);
    }

    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    const event = webhookData.event;
    const instanceName = webhookData.instance;

    // ============= QRCODE UPDATED =============
    if (event === 'qrcode.updated') {
      console.log('QR Code atualizado:', instanceName);

      const qrCode = webhookData.data?.qrcode?.base64 || webhookData.data?.base64;

      if (instanceName && qrCode) {
        await supabase
          .from('evolution_settings')
          .update({
            qr_code: qrCode,
            qr_code_updated_at: new Date().toISOString(),
          })
          .eq('instance_name', instanceName);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'QR Code atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= CONNECTION UPDATE =============
    if (event === 'connection.update') {
      console.log('Evento de conexão detectado:', webhookData.data);

      const state = webhookData.data?.state || webhookData.data?.connection;

      if (instanceName) {
        let newStatus = 'created';
        let isConnected = false;

        if (state === 'open' || state === 'connected') {
          newStatus = 'connected';
          isConnected = true;
          console.log(`Instância ${instanceName} conectada!`);
        } else if (state === 'close' || state === 'disconnected') {
          newStatus = 'disconnected';
          isConnected = false;
          console.log(`Instância ${instanceName} desconectada`);
        }

        await supabase
          .from('evolution_settings')
          .update({
            instance_status: newStatus,
            is_connected: isConnected,
            last_connection_check: new Date().toISOString(),
          })
          .eq('instance_name', instanceName);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Status atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= MESSAGES UPDATE (status) =============
    if (event === 'messages.update') {
      console.log('Status de mensagem atualizado:', webhookData.data);

      const messageId = webhookData.data?.key?.id;
      const statusCode = webhookData.data?.update?.status;

      const statusMap: Record<number, string> = {
        0: 'error',
        1: 'pending',
        2: 'sent',
        3: 'delivered',
        4: 'read',
        5: 'played'
      };

      const newStatus = statusMap[statusCode] || 'sent';

      if (messageId) {
        const updateData: any = { status: newStatus };

        if (newStatus === 'delivered') {
          updateData.delivered_at = new Date().toISOString();
        } else if (newStatus === 'read') {
          updateData.read_at = new Date().toISOString();
        } else if (newStatus === 'played') {
          updateData.played_at = new Date().toISOString();
        }

        await supabase
          .from('messages')
          .update(updateData)
          .eq('external_id', messageId);

        console.log(`Mensagem ${messageId} atualizada para ${newStatus}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Status atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= SEND MESSAGE (confirmação) =============
    if (event === 'send.message') {
      console.log('Confirmação de envio:', webhookData.data);

      const messageId = webhookData.data?.key?.id;

      if (messageId) {
        await supabase
          .from('messages')
          .update({
            status: 'sent',
            external_id: messageId
          })
          .eq('id', webhookData.data?.metadata?.messageDbId);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Envio confirmado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= PRESENCE UPDATE =============
    if (event === 'presence.update') {
      console.log('Presença atualizada:', webhookData.data);

      const remoteJid = webhookData.data?.remoteJid;
      const phone = remoteJid?.replace('@s.whatsapp.net', '');

      if (phone) {
        const updateData: any = {};

        if (webhookData.data?.isOnline !== undefined) {
          updateData.is_online = webhookData.data.isOnline;
        }
        if (webhookData.data?.lastSeen) {
          updateData.last_seen = new Date(webhookData.data.lastSeen * 1000).toISOString();
        }
        if (webhookData.data?.isTyping !== undefined) {
          updateData.is_typing = webhookData.data.isTyping;
        }
        if (webhookData.data?.isRecording !== undefined) {
          updateData.is_recording = webhookData.data.isRecording;
        }

        await supabase
          .from('conversations')
          .update(updateData)
          .eq('contact_number', phone);

        // Broadcast via Realtime para mostrar "digitando..." na interface
        const channel = supabase.channel('presence');
        await channel.send({
          type: 'broadcast',
          event: 'presence_update',
          payload: {
            phone,
            isTyping: webhookData.data?.isTyping,
            isRecording: webhookData.data?.isRecording,
            isOnline: webhookData.data?.isOnline,
          }
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Presença atualizada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= CHATS UPDATE =============
    if (event === 'chats.update') {
      console.log('Chat atualizado:', webhookData.data);

      const chatJid = webhookData.data?.id;
      const phone = chatJid?.replace('@s.whatsapp.net', '');

      if (phone) {
        const updateData: any = {};

        // Atualizar informações do chat
        if (webhookData.data?.unreadCount !== undefined) {
          updateData.unread_count = webhookData.data.unreadCount;
        }
        if (webhookData.data?.name) {
          updateData.contact_name = webhookData.data.name;
        }

        await supabase
          .from('conversations')
          .update(updateData)
          .eq('contact_number', phone);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Chat atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= MESSAGES DELETE =============
    if (event === 'messages.delete') {
      console.log('Mensagem deletada:', webhookData.data);

      const messageId = webhookData.data?.key?.id;
      const deleteForEveryone = webhookData.data?.deleteForEveryone || false;

      if (messageId) {
        await supabase
          .from('messages')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_for_everyone: deleteForEveryone
          })
          .eq('external_id', messageId);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Mensagem deletada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= MESSAGES UPSERT (nova mensagem) =============
    if (event === 'messages.upsert') {
      const messageData = webhookData.data;

      if (!messageData) {
        return new Response(
          JSON.stringify({ message: 'Dados de mensagem ausentes' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isFromMe = messageData.key.fromMe || false;

      let remoteJid = messageData.key.remoteJid;

      // Se for lista ou grupo, tentar usar o remoteJidAlt (número real do contato)
      if (remoteJid.includes('@lid') || remoteJid.includes('@g.us')) {
        const altJid = messageData.key.remoteJidAlt;

        if (altJid && altJid.includes('@s.whatsapp.net')) {
          console.log('Usando remoteJidAlt para lista/grupo:', { original: remoteJid, alt: altJid });
          remoteJid = altJid;
        } else {
          console.log('Mensagem ignorada: lista/grupo sem remoteJidAlt válido:', remoteJid);
          return new Response(
            JSON.stringify({ message: 'Lista/grupo sem contato alternativo válido' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Processar contato individual
      const fromNumber = remoteJid.replace('@s.whatsapp.net', '');

      // Extrair pushName corretamente
      // Se a mensagem for de mim (fromMe = true), o pushName é do sistema, não do contato
      // Então só usamos pushName se for mensagem RECEBIDA (fromMe = false)
      const pushName = !isFromMe && messageData.pushName ? messageData.pushName : fromNumber;

      const externalId = messageData.key.id;

      // Verificar se mensagem já existe (evitar duplicatas)
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('external_id', externalId)
        .maybeSingle();

      if (existingMessage) {
        console.log('Mensagem já existe, ignorando duplicata:', externalId);
        return new Response(
          JSON.stringify({ message: 'Mensagem duplicada ignorada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================
      // BUSCAR CONFIGURAÇÃO GLOBAL DA EVOLUTION API
      // ============================================
      const { data: globalConfig, error: configError } = await supabase
        .from('evolution_global_config')
        .select('api_url, api_key')
        .eq('is_active', true)
        .maybeSingle();

      if (configError || !globalConfig) {
        console.error('❌ Configuração global da Evolution API não encontrada:', configError);
        throw new Error('Evolution API não configurada. Configure em Configurações > Evolution API');
      }

      const evolutionApiUrl = globalConfig.api_url;
      const evolutionApiKey = globalConfig.api_key;

      console.log('🔧 Usando Evolution API Global:', evolutionApiUrl);

      // ============================================
      // BUSCAR EMPRESA PELA INSTÂNCIA
      // ============================================
      let companyId: string | null = null;
      let userId: string | null = null;

      if (instanceName) {
        const { data: settings } = await supabase
          .from('evolution_settings')
          .select('user_id, company_id')
          .eq('instance_name', instanceName)
          .maybeSingle();

        if (settings) {
          userId = settings.user_id;
          companyId = settings.company_id;
        }
      }

      if (!companyId || !userId) {
        const { data: allSettings } = await supabase
          .from('evolution_settings')
          .select('user_id, company_id')
          .limit(1);

        if (!allSettings || allSettings.length === 0) {
          throw new Error('Nenhum usuário configurado');
        }

        userId = allSettings[0].user_id;
        companyId = allSettings[0].company_id;
      }

      // ============================================
      // FUNÇÃO: DOWNLOAD E ARMAZENAMENTO DE MÍDIAS
      // ============================================
      const downloadAndStoreMedia = async (remoteUrl: string, mimeType: string, fileName: string) => {
        try {
          console.log('📥 Baixando mídia:', remoteUrl);

          // Download do arquivo remoto
          const response = await fetch(remoteUrl);
          if (!response.ok) {
            console.error('❌ Erro ao baixar mídia:', response.status, response.statusText);
            return { url: remoteUrl, path: null }; // Fallback para URL original
          }

          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);

          // Gerar nome único
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const fileExtension = fileName.split('.').pop() || 'bin';
          // Remover extensão do nome original para evitar duplicação
          const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
          const sanitizedFileName = fileNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);

          // Caminho: company_id/contact_number/timestamp_random_filename.ext (sem duplicação)
          const filePath = `${companyId}/${fromNumber}/${timestamp}_${randomStr}_${sanitizedFileName}.${fileExtension}`;

          // Upload para Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message-media')
            .upload(filePath, buffer, {
              contentType: mimeType,
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('❌ Erro ao fazer upload:', uploadError);
            return { url: remoteUrl, path: null }; // Fallback
          }

          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('message-media')
            .getPublicUrl(uploadData.path);

          console.log('✅ Mídia armazenada:', urlData.publicUrl);
          return { url: urlData.publicUrl, path: uploadData.path };
        } catch (error) {
          console.error('❌ Erro ao processar mídia:', error);
          return { url: remoteUrl, path: null }; // Fallback
        }
      };

      // ============================================
      // INICIALIZAR VARIÁVEIS DE MENSAGEM
      // ============================================
      const message = messageData.message;
      let messageType = 'text';
      let mediaUrl = null;
      let mediaType = null;
      let mediaStoragePath = null;

      // ============================================
      // PROCESSAR MÍDIAS COM DOWNLOAD AUTOMÁTICO
      // ============================================
      if (message?.imageMessage) {
        const remoteUrl = message.imageMessage.url;
        const fileName = message.imageMessage.fileName || 'image.jpg';
        const mimeType = message.imageMessage.mimetype || 'image/jpeg';

        if (remoteUrl) {
          const stored = await downloadAndStoreMedia(remoteUrl, mimeType, fileName);
          mediaUrl = stored.url;
          mediaStoragePath = stored.path;
          mediaType = 'image';
        }
      } else if (message?.videoMessage) {
        const remoteUrl = message.videoMessage.url;
        const fileName = message.videoMessage.fileName || 'video.mp4';
        const mimeType = message.videoMessage.mimetype || 'video/mp4';

        if (remoteUrl) {
          const stored = await downloadAndStoreMedia(remoteUrl, mimeType, fileName);
          mediaUrl = stored.url;
          mediaStoragePath = stored.path;
          mediaType = 'video';
        }
      } else if (message?.audioMessage || message?.pttMessage) {
        const audioMsg = message.audioMessage || message.pttMessage;
        const remoteUrl = audioMsg.url;
        const fileName = audioMsg.fileName || 'audio.ogg';
        const mimeType = audioMsg.mimetype || 'audio/ogg';

        if (remoteUrl) {
          const stored = await downloadAndStoreMedia(remoteUrl, mimeType, fileName);
          mediaUrl = stored.url;
          mediaStoragePath = stored.path;
          mediaType = 'audio';
        }
      } else if (message?.stickerMessage) {
        const remoteUrl = message.stickerMessage.url;
        const fileName = 'sticker.webp';
        const mimeType = message.stickerMessage.mimetype || 'image/webp';

        if (remoteUrl) {
          const stored = await downloadAndStoreMedia(remoteUrl, mimeType, fileName);
          mediaUrl = stored.url;
          mediaStoragePath = stored.path;
          mediaType = 'sticker';
        }
      } else if (message?.documentMessage) {
        const remoteUrl = message.documentMessage.url;
        const fileName = message.documentMessage.fileName || 'document.pdf';
        const mimeType = message.documentMessage.mimetype || 'application/pdf';

        if (remoteUrl) {
          const stored = await downloadAndStoreMedia(remoteUrl, mimeType, fileName);
          mediaUrl = stored.url;
          mediaStoragePath = stored.path;
          mediaType = 'document';
        }
      } else if (message?.pollCreationMessage) {
        messageType = 'poll';
      } else if (message?.listMessage) {
        messageType = 'list';
      } else if (message?.contactMessage) {
        messageType = 'contact';
      } else if (message?.locationMessage) {
        messageType = 'location';
      }

      // ============================================
      // GERAR CONTEÚDO DA MENSAGEM
      // ============================================
      let messageContent = '';

      if (messageData.message?.conversation) {
        messageContent = messageData.message.conversation;
      } else if (messageData.message?.extendedTextMessage?.text) {
        messageContent = messageData.message.extendedTextMessage.text;
      } else if (messageData.message?.imageMessage) {
        messageContent = messageData.message.imageMessage.caption || '📷 Imagem';
      } else if (messageData.message?.videoMessage) {
        messageContent = messageData.message.videoMessage.caption || '🎥 Vídeo';
      } else if (messageData.message?.audioMessage || messageData.message?.pttMessage) {
        messageContent = '🎵 Áudio';
      } else if (messageData.message?.stickerMessage) {
        messageContent = '🎨 Figurinha';
      } else if (messageData.message?.documentMessage) {
        messageContent = `📄 ${messageData.message.documentMessage.fileName || 'Documento'}`;
      } else if (messageData.message?.pollCreationMessage) {
        messageContent = `📊 ${messageData.message.pollCreationMessage.name || 'Enquete'}`;
      } else if (messageData.message?.listMessage) {
        messageContent = `📋 ${messageData.message.listMessage.title || 'Lista'}`;
      } else if (messageData.message?.contactMessage) {
        messageContent = `👤 ${messageData.message.contactMessage.displayName || 'Contato'}`;
      } else if (messageData.message?.locationMessage) {
        messageContent = '📍 Localização';
      } else {
        messageContent = 'Mensagem não textual';
      }

      // Buscar ou criar contato
      let contact;
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('phone_number', fromNumber)
        .maybeSingle();

      if (!existingContact) {
        // Buscar foto de perfil da Evolution API
        let profilePicUrl = null;
        if (evolutionApiUrl && evolutionApiKey && instanceName) {
          try {
            const profilePicResponse = await fetch(
              `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionApiKey,
                },
                body: JSON.stringify({ number: fromNumber }),
              }
            );

            if (profilePicResponse.ok) {
              const profilePicData = await profilePicResponse.json();
              profilePicUrl = profilePicData.profilePictureUrl || null;
              console.log('✅ Foto de perfil obtida:', profilePicUrl ? 'SIM' : 'NÃO');
            }
          } catch (error) {
            console.log('⚠️ Erro ao buscar foto de perfil:', error);
          }
        }

        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            company_id: companyId,
            phone_number: fromNumber,
            push_name: pushName,
            name: pushName !== fromNumber ? pushName : null,
            profile_pic_url: profilePicUrl,
            profile_pic_updated_at: profilePicUrl ? new Date().toISOString() : null,
          })
          .select()
          .single();

        contact = newContact;
      } else {
        contact = existingContact;

        // Preparar dados para atualização
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Atualizar push_name se mudou
        if (pushName && pushName !== contact.push_name) {
          updateData.push_name = pushName;
          // Atualizar name apenas se não estava definido ou era igual ao push_name antigo
          if (!contact.name || contact.name === contact.push_name) {
            updateData.name = pushName !== fromNumber ? pushName : null;
          }
        }

        // Atualizar foto se não existir ou estiver desatualizada (mais de 7 dias)
        const shouldUpdatePhoto = !contact.profile_pic_url ||
          !contact.profile_pic_updated_at ||
          (new Date().getTime() - new Date(contact.profile_pic_updated_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

        if (shouldUpdatePhoto && evolutionApiUrl && evolutionApiKey && instanceName) {
          try {
            const profilePicResponse = await fetch(
              `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionApiKey,
                },
                body: JSON.stringify({ number: fromNumber }),
              }
            );

            if (profilePicResponse.ok) {
              const profilePicData = await profilePicResponse.json();
              const profilePicUrl = profilePicData.profilePictureUrl || null;

              if (profilePicUrl) {
                updateData.profile_pic_url = profilePicUrl;
                updateData.profile_pic_updated_at = new Date().toISOString();
                contact.profile_pic_url = profilePicUrl;
                console.log('✅ Foto de perfil atualizada');
              }
            }
          } catch (error) {
            console.log('⚠️ Erro ao atualizar foto de perfil:', error);
          }
        }

        // Aplicar atualizações se houver
        if (Object.keys(updateData).length > 1) { // mais de 1 porque updated_at sempre existe
          await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contact.id);

          // Atualizar objeto local com novos dados
          contact = { ...contact, ...updateData };
          console.log('✅ Contato atualizado:', Object.keys(updateData).filter(k => k !== 'updated_at'));
        }
      }

      // Buscar ou criar conversa
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('contact_number', fromNumber);

      let conversationId;
      if (!conversations || conversations.length === 0) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            company_id: companyId,
            contact_id: contact?.id || null,
            contact_name: contact?.name || pushName,
            contact_number: fromNumber,
            profile_pic_url: contact?.profile_pic_url || null,
            last_message: messageContent,
            last_message_time: new Date().toISOString(),
            unread_count: isFromMe ? 0 : 1,
            status: 'waiting'
          })
          .select()
          .single();

        conversationId = newConversation!.id;
      } else {
        conversationId = conversations[0].id;

        // Atualizar conversa
        const updateData: any = {
          last_message: messageContent,
          last_message_time: new Date().toISOString(),
        };

        // Atualizar foto de perfil se disponível e diferente
        if (contact?.profile_pic_url && contact.profile_pic_url !== conversations[0].profile_pic_url) {
          updateData.profile_pic_url = contact.profile_pic_url;
        }

        // Só incrementar unread_count se for mensagem recebida (não enviada por mim)
        if (!isFromMe) {
          updateData.unread_count = conversations[0].unread_count + 1;
        }

        await supabase
          .from('conversations')
          .update(updateData)
          .eq('id', conversationId);
      }

      // Salvar mensagem
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          company_id: companyId,
          content: messageContent,
          is_from_me: isFromMe,
          status: isFromMe ? 'sent' : 'received',
          message_type: messageType,
          media_url: mediaUrl,
          media_type: mediaType,
          external_id: externalId,
        });

      if (insertError) {
        console.error('❌ Erro ao salvar mensagem:', insertError);
        throw insertError;
      }

      console.log('Mensagem processada com sucesso');

      // ========================================
      // CHAMAR N8N PARA PROCESSAR COM IA
      // ========================================

      // Buscar configurações de IA da empresa
      const { data: aiSettings } = await supabase
        .from('ai_settings')
        .select('is_enabled, n8n_webhook_url, n8n_api_key, default_mode')
        .eq('company_id', companyId)
        .maybeSingle();

      // Verificar se a conversa tem IA habilitada
      const { data: conversationAI } = await supabase
        .from('conversations')
        .select('ai_enabled, ai_mode')
        .eq('id', conversationId)
        .maybeSingle();

      // Só chama N8N se:
      // 1. IA está habilitada globalmente (ai_settings.is_enabled)
      // 2. IA está habilitada na conversa (ai_enabled = true ou null)
      // 3. Tem URL do N8N configurada
      // 4. NÃO é mensagem enviada por mim (isFromMe = false)
      const aiEnabled = !isFromMe &&
        aiSettings?.is_enabled &&
        (conversationAI?.ai_enabled !== false) &&
        aiSettings?.n8n_webhook_url;

      if (aiEnabled) {
        console.log('🤖 Chamando N8N webhook:', aiSettings.n8n_webhook_url);

        try {
          const n8nPayload = {
            // Identificadores
            conversation_id: conversationId,
            contact_id: contact?.id,
            company_id: companyId,
            message_id: externalId,

            // Dados da mensagem
            message_content: messageContent,
            message_type: messageType,

            // Dados do contato
            contact_name: contact?.name || pushName,
            contact_phone: fromNumber,

            // Dados da instância
            instance_name: instanceName,
            external_id: externalId,

            // Metadados
            timestamp: new Date().toISOString(),
            ai_mode: conversationAI?.ai_mode || aiSettings?.default_mode || 'auto',
          };

          const n8nResponse = await fetch(aiSettings.n8n_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': aiSettings.n8n_api_key || '',
              'x-company-id': companyId || '',
            },
            body: JSON.stringify(n8nPayload),
          });

          if (n8nResponse.ok) {
            console.log('✅ N8N webhook chamado com sucesso');

            // Atualizar contador de mensagens processadas pela IA
            const { data: conv } = await supabase
              .from('conversations')
              .select('ai_messages_count')
              .eq('id', conversationId)
              .single();

            await supabase
              .from('conversations')
              .update({
                ai_messages_count: (conv?.ai_messages_count || 0) + 1
              })
              .eq('id', conversationId);
          } else {
            const errorText = await n8nResponse.text();
            console.error('❌ N8N retornou erro:', n8nResponse.status, errorText);
          }
        } catch (error) {
          console.error('❌ Erro ao chamar N8N webhook:', error);
          // Não falha o webhook principal, apenas loga o erro
        }
      } else {
        console.log('ℹ️ IA desabilitada ou N8N não configurado para esta empresa/conversa');
      }

      // Check for opt-out/opt-in keywords
      const normalizedContent = messageContent.toLowerCase().trim();
      const optOutKeywords = ['sair', 'parar', 'stop', 'cancelar', 'remover'];
      const optInKeywords = ['voltar', 'retornar', 'continuar'];

      if (optOutKeywords.some(keyword => normalizedContent === keyword)) {
        await supabase
          .from('blocked_contacts')
          .insert({
            company_id: companyId,
            user_id: userId,
            blocked_number: fromNumber,
            reason: 'Opt-out via mensagem: ' + messageContent,
          });

        await supabase
          .from('conversations')
          .update({ opted_in: false })
          .eq('id', conversationId);
      } else if (optInKeywords.some(keyword => normalizedContent === keyword)) {
        await supabase
          .from('blocked_contacts')
          .delete()
          .eq('company_id', companyId)
          .eq('blocked_number', fromNumber);

        await supabase
          .from('conversations')
          .update({ opted_in: true })
          .eq('id', conversationId);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Mensagem processada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= CONTACTS UPDATE =============
    if (event === 'contacts.update') {
      console.log('Contato atualizado:', webhookData.data);

      const contactJid = webhookData.data?.remoteJid || webhookData.data?.id;
      const phone = contactJid?.replace('@s.whatsapp.net', '');
      const newName = webhookData.data?.pushName || webhookData.data?.name;

      if (phone && newName) {
        await supabase
          .from('conversations')
          .update({ contact_name: newName })
          .eq('contact_number', phone);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Contato atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= GROUPS UPSERT =============
    if (event === 'groups.upsert') {
      console.log('Grupo criado/atualizado:', webhookData.data);
      // Implementar lógica de grupos se necessário

      return new Response(
        JSON.stringify({ success: true, message: 'Grupo processado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Evento não tratado
    console.log('Evento não tratado:', event);
    return new Response(
      JSON.stringify({ message: `Evento ${event} não implementado` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
