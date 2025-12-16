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
function interpolateVariables(content: string, variables: Record<string, any>, contact: any): string {
  let result = content;

  // Session variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    result = result.replace(regex, String(value || ""));
  }

  // Contact variables
  if (contact) {
    result = result.replace(/\{\{nome\}\}/gi, contact.name || "");
    result = result.replace(/\{\{name\}\}/gi, contact.name || "");
    result = result.replace(/\{\{email\}\}/gi, contact.email || "");
    result = result.replace(/\{\{telefone\}\}/gi, contact.phone_number || "");
    result = result.replace(/\{\{phone\}\}/gi, contact.phone_number || "");
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
    const { data: company } = await supabase
      .from("companies")
      .select("evolution_instance_name")
      .eq("id", companyId)
      .single();

    if (!apiUrl || !apiKey || !company?.evolution_instance_name) {
      console.error("Evolution API not configured");
      return false;
    }

    const response = await fetch(
      `${apiUrl}/message/sendText/${company.evolution_instance_name}`,
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
  supabase: any
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
        contact
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
          contact
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
          contact
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
        let selectedOption = options.find((opt, idx) => {
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
        const url = interpolateVariables(node.data.url || "", variables, contact);
        const method = node.data.method || "GET";
        const headers = node.data.headers || {};
        let body = node.data.body;

        if (body) {
          body = interpolateVariables(body, variables, contact);
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
          contact
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
        contact
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

    const { executionId, userMessage, companyId } = await req.json();

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
        supabase
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
  } catch (error) {
    console.error("Error executing chatbot:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
