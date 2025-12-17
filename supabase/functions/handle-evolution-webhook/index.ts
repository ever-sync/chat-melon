import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    const { event, instance, data } = payload;

    // Process different event types
    switch (event) {
      case "messages.upsert":
        await handleMessageUpsert(supabaseClient, instance, data);
        break;

      case "messages.update":
        await handleMessageUpdate(supabaseClient, instance, data);
        break;

      case "connection.update":
        await handleConnectionUpdate(supabaseClient, instance, data);
        break;

      case "qrcode.updated":
        await handleQRCodeUpdate(supabaseClient, instance, data);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleMessageUpsert(supabase: any, instance: string, data: any) {
  console.log("Processing message upsert:", data);

  const message = data.message || data;
  const key = message.key || {};
  const messageData = message.message || {};

  // Extract message info
  const remoteJid = key.remoteJid;
  const fromMe = key.fromMe;
  const messageId = key.id;
  const timestamp = message.messageTimestamp
    ? new Date(message.messageTimestamp * 1000).toISOString()
    : new Date().toISOString();

  // Extract contact number (remove @s.whatsapp.net)
  const contactNumber = remoteJid?.replace("@s.whatsapp.net", "");

  if (!contactNumber) {
    console.log("No contact number found, skipping");
    return;
  }

  // Find company by instance name
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("evolution_instance_name", instance)
    .single();

  if (companyError || !company) {
    console.error("Company not found for instance:", instance);
    return;
  }

  const companyId = company.id;

  // Find or create contact
  let contact = null;
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("phone_number", contactNumber)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingContact) {
    contact = existingContact;
  } else {
    // Create new contact
    const pushName = message.pushName || contactNumber;
    const { data: newContact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        company_id: companyId,
        phone_number: contactNumber,
        name: pushName,
        source: "whatsapp",
      })
      .select()
      .single();

    if (contactError) {
      console.error("Error creating contact:", contactError);
      return;
    }
    contact = newContact;
  }

  // Find or create conversation
  let conversation = null;
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("contact_number", contactNumber)
    .eq("company_id", companyId)
    .maybeSingle();

  if (existingConversation) {
    conversation = existingConversation;
  } else {
    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        company_id: companyId,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_number: contactNumber,
        status: "open",
        opted_in: true,
      })
      .select()
      .single();

    if (convError) {
      console.error("Error creating conversation:", convError);
      return;
    }
    conversation = newConversation;
  }

  // Extract message content
  let content = "";
  const mediaUrl = null;
  let mediaType = null;
  let messageType = "text";

  if (messageData.conversation) {
    content = messageData.conversation;
  } else if (messageData.extendedTextMessage) {
    content = messageData.extendedTextMessage.text;
  } else if (messageData.imageMessage) {
    content = messageData.imageMessage.caption || "[Imagem]";
    messageType = "image";
    mediaType = "image/jpeg";
    // Note: You'll need to download the media separately using Evolution API
  } else if (messageData.videoMessage) {
    content = messageData.videoMessage.caption || "[Vídeo]";
    messageType = "video";
    mediaType = "video/mp4";
  } else if (messageData.audioMessage) {
    content = "[Áudio]";
    messageType = "audio";
    mediaType = "audio/ogg";
  } else if (messageData.documentMessage) {
    content = messageData.documentMessage.fileName || "[Documento]";
    messageType = "document";
    mediaType = "application/octet-stream";
  } else {
    content = "[Mensagem não suportada]";
  }

  // Check if message already exists
  const { data: existingMessage } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversation.id)
    .eq("external_id", messageId)
    .maybeSingle();

  if (existingMessage) {
    console.log("Message already exists, skipping");
    return;
  }

  // Save message to database
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    company_id: companyId,
    content: content,
    message_type: messageType,
    media_url: mediaUrl,
    media_type: mediaType,
    is_from_me: fromMe,
    status: "delivered",
    external_id: messageId,
    created_at: timestamp,
  });

  if (messageError) {
    console.error("Error saving message:", messageError);
    return;
  }

  // Update conversation with last message
  await supabase
    .from("conversations")
    .update({
      last_message: content,
      last_message_time: timestamp,
      unread_count: fromMe ? 0 : supabase.rpc("increment_unread", { conv_id: conversation.id }),
    })
    .eq("id", conversation.id);

  console.log("Message saved successfully");

  // If incoming message (not from me), check for cadence replies and chatbot triggers
  if (!fromMe) {
    // Check and handle cadence replies
    await handleCadenceReply(supabase, contact.id, companyId);

    // Check and execute active chatbot
    await handleChatbotTrigger(supabase, companyId, conversation.id, contact.id, content, !existingContact);
  }
}

// Handle cadence reply detection
async function handleCadenceReply(supabase: any, contactId: string, companyId: string) {
  try {
    // Find active enrollments for this contact
    const { data: enrollments, error } = await supabase
      .from("cadence_enrollments")
      .select(`
        id,
        cadence_id,
        cadences (name, company_id)
      `)
      .eq("contact_id", contactId)
      .eq("status", "active");

    if (error || !enrollments || enrollments.length === 0) {
      return;
    }

    // Update each enrollment
    for (const enrollment of enrollments) {
      // Verify cadence belongs to this company
      if (enrollment.cadences?.company_id !== companyId) {
        continue;
      }

      console.log(`Cadence reply detected for enrollment ${enrollment.id}`);

      // Update enrollment status to replied
      await supabase
        .from("cadence_enrollments")
        .update({
          status: "replied",
          replied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollment.id);

      // Increment cadence total_replied
      await supabase
        .from("cadences")
        .update({
          total_replied: supabase.rpc("increment_field", { row_id: enrollment.cadence_id, field: "total_replied" }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollment.cadence_id);

      console.log(`Enrollment ${enrollment.id} marked as replied`);
    }
  } catch (error) {
    console.error("Error handling cadence reply:", error);
  }
}

// Handle chatbot trigger
async function handleChatbotTrigger(
  supabase: any,
  companyId: string,
  conversationId: string,
  contactId: string,
  messageContent: string,
  isNewContact: boolean
) {
  try {
    // Check if there's an active chatbot execution for this conversation
    const { data: activeExecution } = await supabase
      .from("chatbot_executions")
      .select("id, chatbot_id, current_node_id, status")
      .eq("conversation_id", conversationId)
      .in("status", ["running", "waiting_input"])
      .maybeSingle();

    if (activeExecution) {
      // Continue existing chatbot execution
      console.log(`Continuing chatbot execution ${activeExecution.id}`);
      await executeChatbot(supabase, companyId, activeExecution.id, messageContent);
      return;
    }

    // Check for chatbot triggers
    let triggerType: string | null = null;
    let triggerValue: string | null = null;

    // Check keyword triggers
    const messageLower = messageContent.toLowerCase();

    // Get active chatbots for this company
    const { data: chatbots } = await supabase
      .from("chatbots")
      .select("id, triggers, active_channels")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (!chatbots || chatbots.length === 0) {
      return;
    }

    let matchedChatbot = null;

    for (const chatbot of chatbots) {
      // Check if chatbot is active for WhatsApp
      if (!chatbot.active_channels?.includes("whatsapp") && !chatbot.active_channels?.includes("*")) {
        continue;
      }

      const triggers = chatbot.triggers || [];

      for (const trigger of triggers) {
        // Check first_message trigger for new contacts
        if (trigger.type === "first_message" && isNewContact) {
          matchedChatbot = chatbot;
          triggerType = "first_message";
          break;
        }

        // Check keyword trigger
        if (trigger.type === "keyword") {
          const keywords = Array.isArray(trigger.value)
            ? trigger.value
            : [trigger.value];

          for (const keyword of keywords) {
            if (messageLower.includes(keyword.toLowerCase())) {
              matchedChatbot = chatbot;
              triggerType = "keyword";
              triggerValue = keyword;
              break;
            }
          }
        }

        if (matchedChatbot) break;
      }

      if (matchedChatbot) break;
    }

    if (!matchedChatbot) {
      return;
    }

    console.log(`Chatbot triggered: ${matchedChatbot.id}, trigger: ${triggerType}`);

    // Create new chatbot execution
    const { data: newExecution, error: execError } = await supabase
      .from("chatbot_executions")
      .insert({
        chatbot_id: matchedChatbot.id,
        chatbot_version: 1, // TODO: Get current version
        conversation_id: conversationId,
        contact_id: contactId,
        status: "running",
        trigger_type: triggerType,
        trigger_value: triggerValue,
        channel_type: "whatsapp",
        session_variables: {},
        execution_log: [],
      })
      .select()
      .single();

    if (execError) {
      console.error("Error creating chatbot execution:", execError);
      return;
    }

    // Update chatbot execution count
    await supabase
      .from("chatbots")
      .update({
        total_executions: supabase.rpc("increment_field", { row_id: matchedChatbot.id, field: "total_executions" }),
      })
      .eq("id", matchedChatbot.id);

    // Execute chatbot
    await executeChatbot(supabase, companyId, newExecution.id, messageContent);

  } catch (error) {
    console.error("Error handling chatbot trigger:", error);
  }
}

// Execute chatbot step
async function executeChatbot(supabase: any, companyId: string, executionId: string, userMessage: string) {
  try {
    // Call execute-chatbot edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const response = await fetch(`${supabaseUrl}/functions/v1/execute-chatbot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        executionId,
        userMessage,
        companyId,
      }),
    });

    if (!response.ok) {
      console.error("Error calling execute-chatbot:", await response.text());
    }
  } catch (error) {
    console.error("Error executing chatbot:", error);
  }
}

async function handleMessageUpdate(supabase: any, instance: string, data: any) {
  console.log("Processing message update:", data);

  const message = data.message || data;
  const key = message.key || {};
  const messageId = key.id;

  if (!messageId) return;

  // Find company by instance name
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("evolution_instance_name", instance)
    .single();

  if (!company) return;

  // Update message status
  const status = message.status || data.status;
  let dbStatus = "sent";

  switch (status) {
    case 1:
    case "SERVER_ACK":
      dbStatus = "sent";
      break;
    case 2:
    case "DELIVERY_ACK":
      dbStatus = "delivered";
      break;
    case 3:
    case "READ":
      dbStatus = "read";
      break;
    case 0:
    case "ERROR":
      dbStatus = "error";
      break;
  }

  await supabase
    .from("messages")
    .update({ status: dbStatus })
    .eq("external_id", messageId)
    .eq("company_id", company.id);

  console.log(`Message ${messageId} status updated to ${dbStatus}`);
}

async function handleConnectionUpdate(supabase: any, instance: string, data: any) {
  console.log("Processing connection update:", data);

  const state = data.state;
  const connected = state === "open";

  await supabase
    .from("companies")
    .update({ evolution_connected: connected })
    .eq("evolution_instance_name", instance);

  console.log(`Instance ${instance} connection: ${connected ? "connected" : "disconnected"}`);
}

async function handleQRCodeUpdate(supabase: any, instance: string, data: any) {
  console.log("Processing QR code update");

  const qrCode = data.qrcode || data;

  await supabase
    .from("companies")
    .update({ evolution_qr_code: qrCode })
    .eq("evolution_instance_name", instance);

  console.log(`QR code updated for instance ${instance}`);
}
