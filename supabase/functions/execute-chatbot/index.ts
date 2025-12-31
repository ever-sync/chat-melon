import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatbotNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    content?: string;
    question?: string;
    variableName?: string;
    validation?: string;
    title?: string;
    options?: Array<{ id: string; label: string; value: string }>;
    message?: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    tagName?: string;
    condition?: string;
    trueLabel?: string;
    falseLabel?: string;
  };
}

interface ChatbotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface ChatbotExecution {
  id: string;
  chatbot_id: string;
  chatbot_version: number;
  conversation_id: string;
  contact_id: string;
  current_node_id: string | null;
  status: string;
  session_variables: Record<string, any>;
  execution_log: any[];
  messages_sent: number;
  messages_received: number;
  chatbot: {
    id: string;
    company_id: string;
    name: string;
    nodes: ChatbotNode[];
    edges: ChatbotEdge[];
    variables: Record<string, any>;
    settings: {
      typing_delay_ms?: number;
      default_fallback_message?: string;
      max_retries?: number;
      session_timeout_minutes?: number;
    };
    successful_completions?: number;
    handoffs_count?: number;
  };
  conversation: {
    id: string;
    contact_number: string;
    company_id: string;
  };
  contact: {
    id: string;
    name: string;
    email?: string;
    phone_number: string;
  };
}

// Interpolate variables in content
function interpolateVariables(
  content: string, 
  variables: Record<string, any>, 
  contact: any, 
  customFields: Record<string, any> = {}
): string {
  let result = content;

  // Session variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    result = result.replace(regex, String(value || ""));
  }

  // Contact variables (standard)
  if (contact) {
    result = result.replace(/\{\{nome\}\}/gi, contact.name || "");
    result = result.replace(/\{\{name\}\}/gi, contact.name || "");
    result = result.replace(/\{\{email\}\}/gi, contact.email || "");
    result = result.replace(/\{\{telefone\}\}/gi, contact.phone_number || "");
    result = result.replace(/\{\{phone\}\}/gi, contact.phone_number || "");
    result = result.replace(/\{\{primeiro_nome\}\}/gi, (contact.name || "").split(" ")[0]);
  }

  // Custom Fields (including contato_ prefix)
  for (const [key, value] of Object.entries(customFields)) {
    const regex1 = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    const regex2 = new RegExp(`\\{\\{contato_${key}\\}\\}`, "gi");
    result = result.replace(regex1, String(value || ""));
    result = result.replace(regex2, String(value || ""));
  }

  // Clean up any remaining unmatched variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result.trim();
}

// Find next node based on edge
function findNextNode(edges: ChatbotEdge[], currentNodeId: string, sourceHandle?: string): string | null {
  const edge = edges.find(e =>
    e.source === currentNodeId &&
    (!sourceHandle || e.sourceHandle === sourceHandle)
  );
  return edge?.target || null;
}

// Find start node
function findStartNode(nodes: ChatbotNode[]): ChatbotNode | null {
  return nodes.find(n => n.type === "start") || nodes[0] || null;
}

// Send WhatsApp message
async function sendWhatsAppMessage(
  contactNumber: string,
  message: string,
  companyId: string,
  conversationId: string,
  supabase: any
): Promise<boolean> {
  try {
    const apiUrl = Deno.env.get("EVOLUTION_API_URL");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY");

    // Get company's Evolution instance
    let instanceName: string | null = null;

    // First try evolution_settings
    const { data: settings } = await supabase
      .from("evolution_settings")
      .select("instance_name")
      .eq("company_id", companyId)
      .maybeSingle();
      
    if (settings?.instance_name) {
      instanceName = settings.instance_name;
    } else {
      // Fallback to companies table
      const { data: company } = await supabase
        .from("companies")
        .select("evolution_instance_name")
        .eq("id", companyId)
        .single();
      instanceName = company?.evolution_instance_name;
    }

    if (!apiUrl || !apiKey || !instanceName) {
      console.error(`Evolution API not configured for company ${companyId}. InstanceName: ${instanceName}`);
      return false;
    }

    const response = await fetch(
      `${apiUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          number: contactNumber,
          text: message,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Save message to database
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        company_id: companyId,
        content: message,
        is_from_me: true,
        status: "sent",
        external_id: data?.key?.id,
        metadata: { source: "chatbot" },
      });

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message: message,
          last_message_time: new Date().toISOString(),
        })
        .eq("id", conversationId);

      return true;
    }

    console.error("Failed to send WhatsApp message:", await response.text());
    return false;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}

// Process node
async function processNode(
  node: ChatbotNode,
  execution: ChatbotExecution,
  userMessage: string | null,
  supabase: any,
  customFields: Record<string, any> = {}
): Promise<{
  nextNodeId: string | null;
  waitForInput: boolean;
  updatedVariables: Record<string, any>;
  logEntry: any;
  messageSent: boolean;
}> {
  const variables = { ...execution.session_variables };
  const contact = execution.contact;
  const conversation = execution.conversation;
  let waitForInput = false;
  let nextNodeId: string | null = null;
  let messageSent = false;
  const logEntry: any = {
    node_id: node.id,
    type: node.type,
    timestamp: new Date().toISOString(),
  };

  const settings = execution.chatbot.settings || {};
  const typingDelay = settings.typing_delay_ms || 1000;

  switch (node.type) {
    case "start":
      // Just move to next node
      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "message":
      // Send message and move to next
      const messageContent = interpolateVariables(
        node.data.content || "",
        variables,
        contact,
        customFields
      );

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      await sendWhatsAppMessage(
        conversation.contact_number,
        messageContent,
        execution.chatbot.company_id,
        conversation.id,
        supabase
      );

      messageSent = true;
      logEntry.content = messageContent;
      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "question":
      if (!userMessage) {
        // Send question and wait for response
        const questionText = interpolateVariables(
          node.data.question || "",
          variables,
          contact,
          customFields
        );

        await new Promise(resolve => setTimeout(resolve, typingDelay));

        await sendWhatsAppMessage(
          conversation.contact_number,
          questionText,
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.question = questionText;
      } else {
        // Process answer and move to next
        const variableName = node.data.variableName || "answer";
        variables[variableName] = userMessage;

        // Validate if needed
        const validation = node.data.validation;
        let isValid = true;

        if (validation === "email") {
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userMessage);
        } else if (validation === "phone") {
          isValid = /^\d{10,15}$/.test(userMessage.replace(/\D/g, ""));
        } else if (validation === "number") {
          isValid = !isNaN(Number(userMessage));
        }

        if (!isValid) {
          // Invalid response, ask again
          const fallbackMessage = settings.default_fallback_message ||
            "Desculpe, resposta inválida. Por favor, tente novamente.";

          await sendWhatsAppMessage(
            conversation.contact_number,
            fallbackMessage,
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );

          messageSent = true;
          waitForInput = true;
          logEntry.validation_failed = true;
        } else {
          logEntry.answer = userMessage;
          nextNodeId = findNextNode(execution.chatbot.edges, node.id);
        }
      }
      break;

    case "menu":
      if (!userMessage) {
        // Send menu options and wait for selection
        const menuTitle = interpolateVariables(
          node.data.title || "Escolha uma opção:",
          variables,
          contact,
          customFields
        );

        const options = node.data.options || [];
        const optionsText = options
          .map((opt, idx) => `${idx + 1}. ${opt.label}`)
          .join("\n");

        const menuMessage = `${menuTitle}\n\n${optionsText}`;

        await new Promise(resolve => setTimeout(resolve, typingDelay));

        await sendWhatsAppMessage(
          conversation.contact_number,
          menuMessage,
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.menu = menuTitle;
      } else {
        // Process selection
        const options = node.data.options || [];
        const userInput = userMessage.trim().toLowerCase();

        // Find matching option
        const selectedOption = options.find((opt, idx) => {
          const optNum = String(idx + 1);
          return (
            userInput === optNum ||
            userInput === opt.value.toLowerCase() ||
            userInput === opt.label.toLowerCase() ||
            userInput === opt.id
          );
        });

        if (selectedOption) {
          variables[node.data.variableName || "menu_selection"] = selectedOption.value;
          logEntry.selected = selectedOption.value;
          nextNodeId = findNextNode(
            execution.chatbot.edges,
            node.id,
            selectedOption.value
          );

          // If no specific edge, try default
          if (!nextNodeId) {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id);
          }
        } else {
          // Invalid selection
          const fallbackMessage = settings.default_fallback_message ||
            "Opção inválida. Por favor, escolha uma das opções listadas.";

          await sendWhatsAppMessage(
            conversation.contact_number,
            fallbackMessage,
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );

          messageSent = true;
          waitForInput = true;
          logEntry.invalid_selection = userMessage;
        }
      }
      break;

    case "condition":
      // Evaluate condition
      const condition = node.data.condition || "";
      let result = false;

      try {
        // Simple condition evaluation
        // Support: {{var}} == "value", {{var}} > 10, etc.
        let evalCondition = condition;

        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
          evalCondition = evalCondition.replace(regex, JSON.stringify(value));
        }

        // Safe evaluation (basic operations only)
        result = eval(evalCondition);
      } catch {
        result = false;
      }

      logEntry.condition = condition;
      logEntry.result = result;

      // Follow appropriate edge
      nextNodeId = findNextNode(
        execution.chatbot.edges,
        node.id,
        result ? "true" : "false"
      );
      break;

    case "api_call":
      // Make API call
      try {
        const url = interpolateVariables(node.data.url || "", variables, contact, customFields);
        const method = node.data.method || "GET";
        const headers = node.data.headers || {};
        let body = node.data.body;

        if (body) {
          body = interpolateVariables(body, variables, contact, customFields);
        }

        const apiResponse = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          body: method !== "GET" ? body : undefined,
        });

        const responseData = await apiResponse.json();
        variables["api_response"] = responseData;

        logEntry.url = url;
        logEntry.status = apiResponse.status;
        logEntry.response = responseData;
      } catch (error) {
        logEntry.error = error.message;
        variables["api_error"] = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "tag_contact":
      // Add tag to contact
      const tagName = node.data.tagName || node.data.content;

      if (tagName) {
        try {
          // Get or create tag
          let tag;
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .eq("company_id", execution.chatbot.company_id)
            .maybeSingle();

          if (existingTag) {
            tag = existingTag;
          } else {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({
                name: tagName,
                company_id: execution.chatbot.company_id,
                color: "#3B82F6",
              })
              .select()
              .single();
            tag = newTag;
          }

          if (tag) {
            // Add tag to contact
            await supabase
              .from("contact_tags")
              .insert({
                contact_id: contact.id,
                tag_id: tag.id,
              })
              .onConflict(["contact_id", "tag_id"])
              .ignore();

            logEntry.tag = tagName;
          }
        } catch (error) {
          console.error("Error adding tag:", error);
          logEntry.error = error.message;
        }
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "webhook":
      // Call external webhook
      try {
        const webhookUrl = interpolateVariables(
          node.data.url || "",
          variables,
          contact,
          customFields
        );

        const webhookBody = {
          contact: {
            id: contact.id,
            name: contact.name,
            phone: contact.phone_number,
            email: contact.email,
          },
          conversation_id: conversation.id,
          chatbot_id: execution.chatbot_id,
          variables,
          timestamp: new Date().toISOString(),
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookBody),
        });

        logEntry.webhook_url = webhookUrl;
        logEntry.status = webhookResponse.status;
      } catch (error) {
        logEntry.error = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "handoff":
      // Transfer to human agent
      const handoffMessage = interpolateVariables(
        node.data.message || "Transferindo para um atendente...",
        variables,
        contact,
        customFields
      );

      await sendWhatsAppMessage(
        conversation.contact_number,
        handoffMessage,
        execution.chatbot.company_id,
        conversation.id,
        supabase
      );

      messageSent = true;
      logEntry.handoff_message = handoffMessage;

      // Mark conversation as needing human attention
      await supabase
        .from("conversations")
        .update({
          status: "open",
          priority: "high",
          needs_attention: true,
        })
        .eq("id", conversation.id);

      // Don't set nextNodeId - this ends the chatbot
      break;

    case "end":
      // End of flow
      logEntry.completed = true;
      break;

    // ===== CONTROLE DE FLUXO =====
    case "delay":
      // Simular digitação com delay
      const delayMs = node.data.duration || 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Opcional: enviar status "digitando..." via Evolution API
      if (node.data.showTyping) {
        try {
          const apiUrl = Deno.env.get("EVOLUTION_API_URL");
          const apiKey = Deno.env.get("EVOLUTION_API_KEY");

          const { data: settings } = await supabase
            .from("evolution_settings")
            .select("instance_name")
            .eq("company_id", execution.chatbot.company_id)
            .maybeSingle();

          const instanceName = settings?.instance_name;

          if (apiUrl && apiKey && instanceName) {
            await fetch(`${apiUrl}/chat/presence/${instanceName}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": apiKey,
              },
              body: JSON.stringify({
                number: conversation.contact_number,
                state: "composing",
              }),
            });
          }
        } catch (error) {
          console.error("Error sending typing status:", error);
        }
      }

      logEntry.delay = delayMs;
      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "goto":
      // Saltar para outro nó
      const targetNodeId = node.data.targetNodeId;
      if (!targetNodeId) {
        throw new Error('Goto node missing targetNodeId');
      }
      logEntry.goto_target = targetNodeId;
      nextNodeId = targetNodeId;
      break;

    case "random":
      // Escolha aleatória entre múltiplos caminhos
      const randomEdges = execution.chatbot.edges.filter(e => e.source === node.id);
      if (randomEdges.length > 0) {
        const randomEdge = randomEdges[Math.floor(Math.random() * randomEdges.length)];
        nextNodeId = randomEdge.target;
        logEntry.random_choice = randomEdge.sourceHandle || randomEdge.target;
      }
      break;

    case "split":
      // Divisão de fluxo baseado em porcentagem
      const splitType = node.data.splitType || 'percentage';

      if (splitType === 'percentage') {
        const random = Math.random() * 100;
        const paths = node.data.paths || [];

        let accumulated = 0;
        for (const path of paths) {
          accumulated += path.percentage;
          if (random <= accumulated) {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, path.id);
            logEntry.split_path = path.id;
            logEntry.split_percentage = path.percentage;
            break;
          }
        }
      }

      if (!nextNodeId) {
        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    // ===== MULTIMÍDIA =====
    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker":
      // Enviar mídia via Evolution API
      try {
        const mediaUrl = interpolateVariables(node.data.url || node.data.mediaUrl || "", variables, contact, customFields);
        const caption = interpolateVariables(node.data.caption || "", variables, contact, customFields);

        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        const { data: settings } = await supabase
          .from("evolution_settings")
          .select("instance_name")
          .eq("company_id", execution.chatbot.company_id)
          .maybeSingle();

        const instanceName = settings?.instance_name;

        if (!apiUrl || !apiKey || !instanceName) {
          throw new Error(`Evolution API not configured for company ${execution.chatbot.company_id}`);
        }

        // Determinar tipo de mídia
        let mediaType = node.type;
        if (mediaType === 'document') {
          mediaType = 'document';
        }

        // Simular digitação antes de enviar mídia
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        const mediaResponse = await fetch(
          `${apiUrl}/message/sendMedia/${instanceName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({
              number: conversation.contact_number,
              mediatype: mediaType,
              media: mediaUrl,
              caption: caption || undefined,
              fileName: node.data.fileName || undefined,
            }),
          }
        );

        if (mediaResponse.ok) {
          const data = await mediaResponse.json();

          // Salvar mensagem no banco
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            company_id: execution.chatbot.company_id,
            content: caption || `[${mediaType.toUpperCase()}]`,
            is_from_me: true,
            status: "sent",
            external_id: data?.key?.id,
            metadata: {
              source: "chatbot",
              media_type: mediaType,
              media_url: mediaUrl,
            },
          });

          // Atualizar conversa
          await supabase
            .from("conversations")
            .update({
              last_message: caption || `[${mediaType.toUpperCase()}]`,
              last_message_time: new Date().toISOString(),
            })
            .eq("id", conversation.id);

          messageSent = true;
          logEntry.media_type = mediaType;
          logEntry.media_url = mediaUrl;
          logEntry.caption = caption;
        } else {
          throw new Error(`Failed to send ${mediaType}: ${await mediaResponse.text()}`);
        }
      } catch (error) {
        console.error(`Error sending ${node.type}:`, error);
        logEntry.error = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    // ===== INTERAÇÃO AVANÇADA =====
    case "quick_reply":
      if (!userMessage) {
        // Enviar mensagem com botões de resposta rápida
        const qrMessage = interpolateVariables(node.data.message || "", variables, contact, customFields);
        const replies = node.data.replies || [];

        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        const { data: settings } = await supabase
          .from("evolution_settings")
          .select("instance_name")
          .eq("company_id", execution.chatbot.company_id)
          .maybeSingle();

        const instanceName = settings?.instance_name;

        if (apiUrl && apiKey && instanceName) {
          await new Promise(resolve => setTimeout(resolve, typingDelay));

          const buttons = replies.slice(0, 3).map(r => ({
            buttonId: r.id,
            buttonText: { displayText: `${r.emoji || ''} ${r.label}`.trim() }
          }));

          await fetch(`${apiUrl}/message/sendButtons/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({
              number: conversation.contact_number,
              text: qrMessage,
              buttons: buttons,
            }),
          });

          // Salvar mensagem no banco
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            company_id: execution.chatbot.company_id,
            content: qrMessage,
            is_from_me: true,
            status: "sent",
            metadata: { source: "chatbot", type: "quick_reply", buttons: replies },
          });

          messageSent = true;
          waitForInput = true;
          logEntry.message = qrMessage;
          logEntry.buttons = replies;
        }
      } else {
        // Processar resposta
        const replies = node.data.replies || [];
        const selectedReply = replies.find(r =>
          userMessage.toLowerCase().includes(r.label.toLowerCase()) ||
          userMessage === r.id ||
          userMessage === r.value
        );

        if (selectedReply) {
          variables[node.data.variableName || 'quick_reply_response'] = selectedReply.value;
          logEntry.selected = selectedReply.value;
          nextNodeId = findNextNode(execution.chatbot.edges, node.id, selectedReply.value);
        }

        if (!nextNodeId) {
          nextNodeId = findNextNode(execution.chatbot.edges, node.id);
        }
      }
      break;

    case "list":
      if (!userMessage) {
        // Enviar lista
        const listTitle = interpolateVariables(node.data.title || "", variables, contact);
        const sections = node.data.sections || [];

        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        const { data: settings } = await supabase
          .from("evolution_settings")
          .select("instance_name")
          .eq("company_id", execution.chatbot.company_id)
          .maybeSingle();

        const instanceName = settings?.instance_name;

        if (apiUrl && apiKey && instanceName) {
          await new Promise(resolve => setTimeout(resolve, typingDelay));

          const formattedSections = sections.map(section => ({
            title: section.title,
            rows: section.items.map(item => ({
              rowId: item.id,
              title: item.title,
              description: item.description || ''
            }))
          }));

          await fetch(`${apiUrl}/message/sendList/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({
              number: conversation.contact_number,
              title: listTitle,
              description: node.data.subtitle || '',
              buttonText: node.data.buttonText || 'Ver opções',
              sections: formattedSections,
            }),
          });

          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            company_id: execution.chatbot.company_id,
            content: listTitle,
            is_from_me: true,
            status: "sent",
            metadata: { source: "chatbot", type: "list", sections: sections },
          });

          messageSent = true;
          waitForInput = true;
          logEntry.title = listTitle;
        }
      } else {
        // Processar seleção
        const sections = node.data.sections || [];
        let selectedItem = null;

        for (const section of sections) {
          selectedItem = section.items.find(item =>
            userMessage.toLowerCase().includes(item.title.toLowerCase()) ||
            userMessage === item.id ||
            userMessage === item.value
          );
          if (selectedItem) break;
        }

        if (selectedItem) {
          variables[node.data.variableName || 'list_selection'] = selectedItem.value;
          logEntry.selected = selectedItem.value;
          nextNodeId = findNextNode(execution.chatbot.edges, node.id, selectedItem.value);
        }

        if (!nextNodeId) {
          nextNodeId = findNextNode(execution.chatbot.edges, node.id);
        }
      }
      break;

    case "carousel":
      // Enviar carrossel de cards
      const cards = node.data.cards || [];

      for (const card of cards) {
        const cardImage = interpolateVariables(card.imageUrl || "", variables, contact);
        const cardTitle = interpolateVariables(card.title || "", variables, contact);
        const cardSubtitle = interpolateVariables(card.subtitle || "", variables, contact);

        let caption = `*${cardTitle}*`;
        if (cardSubtitle) caption += `\n${cardSubtitle}`;
        if (card.price) caption += `\n\n💰 R$ ${card.price}`;
        if (card.originalPrice && card.originalPrice > card.price) {
          caption += ` ~R$ ${card.originalPrice}~`;
        }
        if (card.badge) caption += `\n🏷️ ${card.badge}`;

        // Enviar imagem do card
        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        const { data: settings } = await supabase
          .from("evolution_settings")
          .select("instance_name")
          .eq("company_id", execution.chatbot.company_id)
          .maybeSingle();

        const instanceName = settings?.instance_name;

        if (apiUrl && apiKey && instanceName && cardImage) {
          await new Promise(resolve => setTimeout(resolve, 500));

          await fetch(`${apiUrl}/message/sendMedia/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({
              number: conversation.contact_number,
              mediatype: "image",
              media: cardImage,
              caption: caption,
            }),
          });
        }
      }

      messageSent = true;
      logEntry.cards_count = cards.length;
      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "file_upload":
      if (!userMessage) {
        // Solicitar upload de arquivo
        const uploadPrompt = interpolateVariables(node.data.prompt || "Por favor, envie o arquivo", variables, contact);

        await sendWhatsAppMessage(
          conversation.contact_number,
          uploadPrompt,
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.prompt = uploadPrompt;
      } else {
        // Arquivo será processado pelo webhook
        // Por enquanto, apenas salvar a URL se fornecida
        variables[node.data.variableName || 'uploaded_file'] = userMessage;
        logEntry.file_received = userMessage;
        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    case "location":
      if (node.data.requestType === 'request' || !node.data.requestType) {
        // Solicitar localização do usuário
        if (!userMessage) {
          const locationPrompt = interpolateVariables(
            node.data.prompt || "Por favor, compartilhe sua localização",
            variables,
            contact
          );

          await sendWhatsAppMessage(
            conversation.contact_number,
            locationPrompt,
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );

          messageSent = true;
          waitForInput = true;
          logEntry.prompt = locationPrompt;
        } else {
          // Localização recebida (será processada pelo webhook)
          variables[node.data.variableName || 'location'] = userMessage;
          logEntry.location_received = true;
          nextNodeId = findNextNode(execution.chatbot.edges, node.id);
        }
      } else {
        // Enviar localização
        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        const { data: settings } = await supabase
          .from("evolution_settings")
          .select("instance_name")
          .eq("company_id", execution.chatbot.company_id)
          .maybeSingle();

        const instanceName = settings?.instance_name;

        if (apiUrl && apiKey && instanceName) {
          await new Promise(resolve => setTimeout(resolve, typingDelay));

          await fetch(`${apiUrl}/message/sendLocation/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
            },
            body: JSON.stringify({
              number: conversation.contact_number,
              latitude: node.data.latitude,
              longitude: node.data.longitude,
              name: node.data.address || '',
              address: node.data.address || '',
            }),
          });

          messageSent = true;
          logEntry.location_sent = { lat: node.data.latitude, lng: node.data.longitude };
        }

        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    case "contact_card":
      // Enviar cartão de contato
      const apiUrl2 = Deno.env.get("EVOLUTION_API_URL");
      const apiKey2 = Deno.env.get("EVOLUTION_API_KEY");

      const { data: settings2 } = await supabase
        .from("evolution_settings")
        .select("instance_name")
        .eq("company_id", execution.chatbot.company_id)
        .maybeSingle();

      const instanceName2 = settings2?.instance_name;

      if (apiUrl2 && apiKey2 && instanceName2) {
        await new Promise(resolve => setTimeout(resolve, typingDelay));

        await fetch(`${apiUrl2}/message/sendContact/${instanceName2}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": apiKey2,
          },
          body: JSON.stringify({
            number: conversation.contact_number,
            contact: {
              fullName: interpolateVariables(node.data.name || "", variables, contact),
              organization: interpolateVariables(node.data.company || "", variables, contact),
              phoneNumber: interpolateVariables(node.data.phone || "", variables, contact),
              email: interpolateVariables(node.data.email || "", variables, contact),
            },
          }),
        });

        messageSent = true;
        logEntry.contact_sent = node.data.name;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "rating":
      if (!userMessage) {
        // Enviar solicitação de avaliação
        const ratingQuestion = interpolateVariables(
          node.data.question || "Como você avalia nosso atendimento?",
          variables,
          contact
        );
        const maxRating = node.data.maxRating || 5;
        const ratingType = node.data.ratingType || 'stars';

        let ratingMessage = ratingQuestion + '\n\n';

        if (ratingType === 'stars') {
          for (let i = 1; i <= maxRating; i++) {
            ratingMessage += `${i} - ${'⭐'.repeat(i)}\n`;
          }
        } else if (ratingType === 'numbers') {
          ratingMessage += `Digite um número de 1 a ${maxRating}`;
        } else if (ratingType === 'emoji') {
          const emojis = ['😠', '😟', '😐', '🙂', '😊'];
          for (let i = 1; i <= Math.min(maxRating, 5); i++) {
            ratingMessage += `${i} - ${emojis[i - 1]}\n`;
          }
        }

        await sendWhatsAppMessage(
          conversation.contact_number,
          ratingMessage,
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.question = ratingQuestion;
      } else {
        // Processar avaliação
        const rating = parseInt(userMessage);
        const maxRating = node.data.maxRating || 5;

        if (!isNaN(rating) && rating >= 1 && rating <= maxRating) {
          variables[node.data.variableName || 'rating'] = rating;

          // Salvar avaliação no banco
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            company_id: execution.chatbot.company_id,
            content: `Avaliação: ${rating}/${maxRating}`,
            is_from_me: false,
            metadata: {
              source: "chatbot",
              type: "rating",
              rating: rating,
              max_rating: maxRating
            },
          });

          logEntry.rating = rating;

          // Verificar threshold para baixa avaliação
          if (node.data.lowRatingThreshold && rating <= node.data.lowRatingThreshold) {
            if (node.data.lowRatingAction === 'handoff') {
              nextNodeId = null;
              // Trigger handoff
            } else {
              nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'low');
            }
          } else {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'high') ||
                        findNextNode(execution.chatbot.edges, node.id);
          }
        } else {
          // Avaliação inválida
          await sendWhatsAppMessage(
            conversation.contact_number,
            `Por favor, digite um número de 1 a ${maxRating}`,
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );
          messageSent = true;
          waitForInput = true;
        }
      }
      break;

    case "nps":
      if (!userMessage) {
        // Enviar pergunta NPS
        const npsQuestion = interpolateVariables(
          node.data.question || "De 0 a 10, qual a probabilidade de você nos recomendar?",
          variables,
          contact,
          customFields
        );

        await sendWhatsAppMessage(
          conversation.contact_number,
          npsQuestion + "\n\n0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟",
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.question = npsQuestion;
      } else {
        // Processar NPS
        const score = parseInt(userMessage);

        if (!isNaN(score) && score >= 0 && score <= 10) {
          variables[node.data.variableName || 'nps_score'] = score;

          // Classificar NPS
          let npsCategory = '';
          let followUpMsg = '';

          if (score <= 6) {
            npsCategory = 'detractor';
            followUpMsg = node.data.followUpDetractor || '';
          } else if (score <= 8) {
            npsCategory = 'passive';
            followUpMsg = node.data.followUpPassive || '';
          } else {
            npsCategory = 'promoter';
            followUpMsg = node.data.followUpPromoter || '';
          }

          variables['nps_category'] = npsCategory;

          // Salvar NPS no banco
          await supabase.from("messages").insert({
            conversation_id: conversation.id,
            company_id: execution.chatbot.company_id,
            content: `NPS: ${score}/10 (${npsCategory})`,
            is_from_me: false,
            metadata: {
              source: "chatbot",
              type: "nps",
              score: score,
              category: npsCategory
            },
          });

          // Enviar mensagem de follow-up se configurada
          if (followUpMsg) {
            await sendWhatsAppMessage(
              conversation.contact_number,
              interpolateVariables(followUpMsg, variables, contact, customFields),
              execution.chatbot.company_id,
              conversation.id,
              supabase
            );
            messageSent = true;
          }

          logEntry.nps_score = score;
          logEntry.nps_category = npsCategory;

          nextNodeId = findNextNode(execution.chatbot.edges, node.id, npsCategory) ||
                      findNextNode(execution.chatbot.edges, node.id);
        } else {
          // Resposta inválida
          await sendWhatsAppMessage(
            conversation.contact_number,
            "Por favor, digite um número de 0 a 10",
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );
          messageSent = true;
          waitForInput = true;
        }
      }
      break;

    case "calendar":
      // Agendamento - implementação simplificada
      if (!userMessage) {
        const calendarPrompt = interpolateVariables(
          node.data.prompt || "Escolha uma data e horário para o agendamento",
          variables,
          contact,
          customFields
        );

        // Aqui poderia integrar com APIs de calendário
        // Por ora, solicita data/hora por texto
        await sendWhatsAppMessage(
          conversation.contact_number,
          calendarPrompt + "\n\nExemplo: 25/12/2024 14:00",
          execution.chatbot.company_id,
          conversation.id,
          supabase
        );

        messageSent = true;
        waitForInput = true;
        logEntry.prompt = calendarPrompt;
      } else {
        // Salvar agendamento
        variables[node.data.variableName || 'appointment'] = userMessage;

        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          company_id: execution.chatbot.company_id,
          content: `Agendamento: ${userMessage}`,
          is_from_me: false,
          metadata: {
            source: "chatbot",
            type: "calendar",
            appointment: userMessage
          },
        });

        logEntry.appointment = userMessage;
        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    // ===== LÓGICA =====
    case "switch":
      // Switch case baseado em variável
      const switchVariable = variables[node.data.variable];
      const cases = node.data.cases || [];

      let matchedCase = null;
      for (const caseItem of cases) {
        if (String(switchVariable) === String(caseItem.value)) {
          matchedCase = caseItem;
          break;
        }
      }

      if (matchedCase) {
        nextNodeId = findNextNode(execution.chatbot.edges, node.id, matchedCase.id);
        logEntry.matched_case = matchedCase.value;
      } else {
        nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'default') ||
                    findNextNode(execution.chatbot.edges, node.id);
        logEntry.matched_case = 'default';
      }
      break;

    case "ab_test":
      // Teste A/B com rastreamento
      const testName = node.data.testName || node.id;
      const variants = node.data.variants || [];

      // Verificar se o contato já tem uma variante atribuída
      let assignedVariant = null;
      const { data: existingTest } = await supabase
        .from("chatbot_ab_tests")
        .select("variant_id")
        .eq("contact_id", contact.id)
        .eq("test_name", testName)
        .maybeSingle();

      if (existingTest) {
        assignedVariant = existingTest.variant_id;
      } else {
        // Atribuir variante baseado em peso
        const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
        const random = Math.random() * totalWeight;

        let accumulated = 0;
        for (const variant of variants) {
          accumulated += variant.weight || 1;
          if (random <= accumulated) {
            assignedVariant = variant.id;
            break;
          }
        }

        // Salvar atribuição
        await supabase.from("chatbot_ab_tests").insert({
          contact_id: contact.id,
          chatbot_id: execution.chatbot_id,
          test_name: testName,
          variant_id: assignedVariant,
          assigned_at: new Date().toISOString(),
        });
      }

      variables[`ab_test_${testName}`] = assignedVariant;
      logEntry.ab_test = testName;
      logEntry.variant = assignedVariant;

      nextNodeId = findNextNode(execution.chatbot.edges, node.id, assignedVariant) ||
                  findNextNode(execution.chatbot.edges, node.id);
      break;

    // ===== INTELIGÊNCIA ARTIFICIAL =====
    case "ai_response":
      // Gerar resposta com IA
      try {
        const aiPrompt = interpolateVariables(node.data.userPromptTemplate || node.data.prompt || "", variables, contact, customFields);
        const systemPrompt = node.data.systemPrompt || "Você é um assistente útil e amigável.";
        const model = node.data.model || "gpt-3.5-turbo";

        // Buscar API key da empresa
        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        // Construir histórico se configurado
        const messages = [{ role: "system", content: systemPrompt }];

        if (node.data.useConversationHistory && node.data.historyMessages) {
          // Buscar últimas mensagens
          const { data: recentMessages } = await supabase
            .from("messages")
            .select("content, is_from_me")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(node.data.historyMessages);

          if (recentMessages) {
            recentMessages.reverse().forEach(msg => {
              messages.push({
                role: msg.is_from_me ? "assistant" : "user",
                content: msg.content
              });
            });
          }
        }

        messages.push({ role: "user", content: aiPrompt });

        // Chamar OpenAI
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: node.data.temperature || 0.7,
            max_tokens: node.data.maxTokens || 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiMessage = aiData.choices[0]?.message?.content;

          if (aiMessage) {
            // Enviar resposta da IA
            await sendWhatsAppMessage(
              conversation.contact_number,
              aiMessage,
              execution.chatbot.company_id,
              conversation.id,
              supabase
            );

            messageSent = true;
            variables[node.data.saveToVariable || 'ai_response'] = aiMessage;
            logEntry.ai_response = aiMessage;
            logEntry.model = model;
          }
        } else {
          throw new Error(`OpenAI API error: ${await aiResponse.text()}`);
        }
      } catch (error) {
        console.error("AI Response error:", error);
        logEntry.error = error.message;

        // Enviar mensagem fallback se configurada
        if (node.data.fallbackMessage) {
          await sendWhatsAppMessage(
            conversation.contact_number,
            node.data.fallbackMessage,
            execution.chatbot.company_id,
            conversation.id,
            supabase
          );
          messageSent = true;
        }
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "ai_classifier":
      // Classificar texto com IA
      try {
        const textToClassify = variables[node.data.inputVariable || 'last_message'] || userMessage || '';
        const categories = node.data.categories || [];

        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        const categoryList = categories.map(c => `- ${c.name}: ${c.description}`).join('\n');
        const prompt = `Classifique o seguinte texto em uma das categorias abaixo. Responda APENAS com o nome da categoria, nada mais.

Categorias:
${categoryList}

Texto: "${textToClassify}"

Categoria:`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: node.data.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 50,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const classification = aiData.choices[0]?.message?.content.trim();

          // Encontrar categoria correspondente
          const matchedCategory = categories.find(c =>
            classification.toLowerCase().includes(c.name.toLowerCase())
          );

          if (matchedCategory) {
            variables['ai_classification'] = matchedCategory.name;
            logEntry.classification = matchedCategory.name;
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, matchedCategory.id) ||
                        findNextNode(execution.chatbot.edges, node.id);
          } else {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id);
          }
        }
      } catch (error) {
        console.error("AI Classifier error:", error);
        logEntry.error = error.message;
        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    case "ai_sentiment":
      // Análise de sentimento
      try {
        const sentimentText = variables[node.data.inputVariable || 'last_message'] || userMessage || '';

        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        const prompt = `Analise o sentimento do seguinte texto e responda APENAS com uma palavra: "positive", "neutral" ou "negative".

Texto: "${sentimentText}"

Sentimento:`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 10,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const sentiment = aiData.choices[0]?.message?.content.trim().toLowerCase();

          variables[node.data.resultVariable || 'sentiment'] = sentiment;
          logEntry.sentiment = sentiment;

          // Rotear baseado no sentimento
          if (sentiment.includes('positive')) {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'positive');
          } else if (sentiment.includes('negative')) {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'negative');
          } else {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id, 'neutral');
          }

          if (!nextNodeId) {
            nextNodeId = findNextNode(execution.chatbot.edges, node.id);
          }
        }
      } catch (error) {
        console.error("AI Sentiment error:", error);
        logEntry.error = error.message;
        nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      }
      break;

    case "ai_extract":
      // Extrair dados com IA
      try {
        const extractText = variables[node.data.inputVariable || 'last_message'] || userMessage || '';
        const extractions = node.data.extractions || [];

        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        const fieldsList = extractions.map(e => `- ${e.name}: ${e.description} (tipo: ${e.type})`).join('\n');
        const prompt = `Extraia as seguintes informações do texto abaixo. Retorne APENAS um JSON válido com os campos solicitados.

Campos:
${fieldsList}

Texto: "${extractText}"

JSON:`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: node.data.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const jsonText = aiData.choices[0]?.message?.content;

          try {
            const extracted = JSON.parse(jsonText);

            // Salvar cada campo extraído em variável
            extractions.forEach(extraction => {
              if (extracted[extraction.name]) {
                variables[extraction.variableName] = extracted[extraction.name];
              }
            });

            logEntry.extracted = extracted;
          } catch (parseError) {
            console.error("Error parsing AI extraction:", parseError);
            logEntry.error = "Failed to parse AI response";
          }
        }
      } catch (error) {
        console.error("AI Extract error:", error);
        logEntry.error = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "ai_summarize":
      // Resumir texto
      try {
        const textToSummarize = variables[node.data.inputVariable || 'conversation'] || '';
        const maxLength = node.data.maxLength || 100;

        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        const prompt = `Resuma o seguinte texto em no máximo ${maxLength} palavras:\n\n${textToSummarize}`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: maxLength * 2,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const summary = aiData.choices[0]?.message?.content;

          variables[node.data.resultVariable || 'summary'] = summary;
          logEntry.summary = summary;
        }
      } catch (error) {
        console.error("AI Summarize error:", error);
        logEntry.error = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    case "ai_translate":
      // Traduzir texto
      try {
        const textToTranslate = variables[node.data.inputVariable || 'last_message'] || userMessage || '';
        const targetLang = node.data.targetLanguage || 'en';

        const { data: apiKeyData } = await supabase
          .from("api_keys")
          .select("key_value")
          .eq("company_id", execution.chatbot.company_id)
          .eq("service", "openai")
          .eq("is_active", true)
          .maybeSingle();

        if (!apiKeyData?.key_value) {
          throw new Error("OpenAI API key not configured");
        }

        const langNames = {
          'en': 'inglês',
          'es': 'espanhol',
          'fr': 'francês',
          'de': 'alemão',
          'it': 'italiano',
          'pt': 'português'
        };

        const prompt = `Traduza o seguinte texto para ${langNames[targetLang] || targetLang}. Retorne APENAS a tradução, sem explicações:\n\n${textToTranslate}`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyData.key_value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const translated = aiData.choices[0]?.message?.content;

          variables[node.data.resultVariable || 'translated_text'] = translated;
          logEntry.translated = translated;
        }
      } catch (error) {
        console.error("AI Translate error:", error);
        logEntry.error = error.message;
      }

      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
      break;

    default:
      console.log(`Unknown node type: ${node.type}`);
      nextNodeId = findNextNode(execution.chatbot.edges, node.id);
  }

  return {
    nextNodeId,
    waitForInput,
    updatedVariables: variables,
    logEntry,
    messageSent,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { executionId, userMessage, companyId: _companyId } = await req.json();

    if (!executionId) {
      throw new Error("executionId is required");
    }

    console.log(`Processing chatbot execution: ${executionId}`);

    // Fetch execution with chatbot and contact data
    const { data: execution, error: execError } = await supabase
      .from("chatbot_executions")
      .select(`
        *,
        chatbot:chatbots(*),
        conversation:conversations(*),
        contact:contacts(*)
      `)
      .eq("id", executionId)
      .single();

    if (execError || !execution) {
      console.error("Execution not found:", execError);
      return new Response(
        JSON.stringify({ success: false, error: "Execution not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Fetch custom fields separately for better reliability
    const { data: customValues } = await supabase
      .from("custom_field_values")
      .select("value, custom_fields(field_name)")
      .eq("entity_id", execution.contact_id);

    const customFields: Record<string, any> = {};
    if (customValues) {
      customValues.forEach((cv: any) => {
        const fieldName = cv.custom_fields?.field_name;
        if (fieldName) {
          customFields[fieldName] = cv.value;
        }
      });
    }

    const typedExecution = execution as unknown as ChatbotExecution;

    // Check if execution is in valid state
    if (!["running", "waiting_input"].includes(typedExecution.status)) {
      return new Response(
        JSON.stringify({ success: false, error: "Execution is not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const nodes = typedExecution.chatbot.nodes as ChatbotNode[];
    const edges = typedExecution.chatbot.edges as ChatbotEdge[];

    // Determine starting node
    let currentNode: ChatbotNode | null = null;

    if (typedExecution.current_node_id) {
      currentNode = nodes.find(n => n.id === typedExecution.current_node_id) || null;
    }

    if (!currentNode) {
      // Start from beginning
      currentNode = findStartNode(nodes);
    }

    if (!currentNode) {
      console.error("No start node found");
      return new Response(
        JSON.stringify({ success: false, error: "No start node found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Process nodes until we need to wait for input or reach end
    let variables = { ...typedExecution.session_variables };
    const executionLog = [...(typedExecution.execution_log || [])];
    let messagesSent = typedExecution.messages_sent || 0;
    let messagesReceived = typedExecution.messages_received || 0;
    let status = "running";
    let handoffReason: string | null = null;
    let currentNodeId = currentNode.id;
    let processedUserMessage = false;

    // If we have user input, increment received count
    if (userMessage) {
      messagesReceived++;
    }

    // Process up to 20 nodes to prevent infinite loops
    for (let i = 0; i < 20; i++) {
      const node = nodes.find(n => n.id === currentNodeId);

      if (!node) {
        // No more nodes, end execution
        status = "completed";
        break;
      }

      // Process user message only once for question/menu nodes
      const inputForNode = !processedUserMessage &&
        ["question", "menu"].includes(node.type) &&
        typedExecution.status === "waiting_input"
        ? userMessage
        : null;

      if (inputForNode) {
        processedUserMessage = true;
      }

      const result = await processNode(
        node,
        { ...typedExecution, session_variables: variables },
        inputForNode,
        supabase,
        customFields
      );

      // Update state
      variables = result.updatedVariables;
      executionLog.push(result.logEntry);

      if (result.messageSent) {
        messagesSent++;
      }

      if (node.type === "handoff") {
        status = "handoff";
        handoffReason = node.data.message || "User requested human agent";
        break;
      }

      if (result.waitForInput) {
        status = "waiting_input";
        currentNodeId = node.id;
        break;
      }

      if (!result.nextNodeId || node.type === "end") {
        status = "completed";
        break;
      }

      currentNodeId = result.nextNodeId;
    }

    // Update execution in database
    const updateData: any = {
      current_node_id: currentNodeId,
      status,
      session_variables: variables,
      execution_log: executionLog,
      messages_sent: messagesSent,
      messages_received: messagesReceived,
      last_interaction_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();

      // Update chatbot completion stats
      await supabase
        .from("chatbots")
        .update({
          successful_completions: (typedExecution.chatbot.successful_completions || 0) + 1,
        })
        .eq("id", typedExecution.chatbot_id);
    }

    if (status === "handoff") {
      updateData.handoff_at = new Date().toISOString();
      updateData.handoff_reason = handoffReason;

      // Update chatbot handoff stats
      await supabase
        .from("chatbots")
        .update({
          handoffs_count: (typedExecution.chatbot.handoffs_count || 0) + 1,
        })
        .eq("id", typedExecution.chatbot_id);
    }

    await supabase
      .from("chatbot_executions")
      .update(updateData)
      .eq("id", executionId);

    console.log(`Chatbot execution ${executionId} updated: status=${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: executionId,
        status,
        current_node_id: currentNodeId,
        messages_sent: messagesSent,
        messages_received: messagesReceived,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error executing chatbot:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
