import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { executionId } = await req.json();

    // Buscar execução
    const { data: execution, error: executionError } = await supabase
      .from("playbook_executions")
      .select(`
        *,
        playbooks(*),
        deals(*, contacts(*))
      `)
      .eq("id", executionId)
      .single();

    if (executionError) throw executionError;
    if (!execution || !execution.playbooks) {
      throw new Error("Execution or playbook not found");
    }

    const playbook = execution.playbooks;
    const steps = playbook.steps as any[];
    const currentStep = execution.current_step || 0;

    if (currentStep >= steps.length) {
      // Todas as etapas concluídas
      await supabase
        .from("playbook_executions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      return new Response(
        JSON.stringify({ success: true, message: "Playbook completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const step = steps[currentStep];
    const stepsLog = execution.steps_log || [];

    try {
      // Executar step
      await executeStep(supabase, step, execution);

      // Atualizar log
      stepsLog.push({
        step: currentStep,
        type: step.type,
        status: "success",
        timestamp: new Date().toISOString(),
      });

      // Atualizar execução
      await supabase
        .from("playbook_executions")
        .update({
          current_step: currentStep + 1,
          steps_log: stepsLog,
        })
        .eq("id", executionId);

      // Se houver mais steps, executar o próximo
      if (currentStep + 1 < steps.length) {
        // Chamar recursivamente para próximo step
        await fetch(req.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ executionId }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, step: currentStep }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      // Log de erro
      stepsLog.push({
        step: currentStep,
        type: step.type,
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      await supabase
        .from("playbook_executions")
        .update({
          status: "failed",
          error_message: error.message,
          steps_log: stepsLog,
        })
        .eq("id", executionId);

      throw error;
    }
  } catch (error: any) {
    console.error("Error executing playbook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function executeStep(supabase: any, step: any, execution: any) {
  const deal = execution.deals;
  const contact = deal?.contacts;

  // Substituir variáveis
  const replaceVars = (text: string) => {
    if (!text) return text;
    return text
      .replace(/\{\{nome\}\}/g, contact?.name || "Cliente")
      .replace(/\{\{empresa\}\}/g, contact?.company || "")
      .replace(/\{\{titulo\}\}/g, deal?.title || "")
      .replace(/\{\{valor\}\}/g, deal?.value?.toString() || "0");
  };

  switch (step.type) {
    case "send_whatsapp":
      // TODO: Integrar com Evolution API
      console.log("Send WhatsApp:", replaceVars(step.config.message));
      break;

    case "create_task":
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (step.config.due_in_days || 1));

      await supabase.from("tasks").insert({
        company_id: deal.company_id,
        assigned_to: step.config.assign_to || deal.assigned_to,
        contact_id: deal.contact_id,
        deal_id: deal.id,
        title: replaceVars(step.config.title || "Tarefa automática"),
        task_type: step.config.task_type || "follow_up",
        priority: step.config.priority || "medium",
        due_date: dueDate.toISOString(),
        status: "pending",
      });
      break;

    case "move_stage":
      if (step.config.target_stage) {
        await supabase
          .from("deals")
          .update({ stage_id: step.config.target_stage })
          .eq("id", deal.id);
      }
      break;

    case "wait":
      // Aguardar seria implementado com um scheduler/cron
      console.log("Wait:", step.config.wait_days, "days");
      break;

    case "webhook":
      if (step.config.url) {
        await fetch(step.config.url, {
          method: step.config.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ execution, deal, contact }),
        });
      }
      break;

    case "notify_user":
      await supabase.rpc("create_notification", {
        p_user_id: step.config.user_id || deal.assigned_to,
        p_company_id: deal.company_id,
        p_title: "🤖 Notificação Automática",
        p_message: replaceVars(step.config.message || "Ação do playbook"),
        p_type: "info",
        p_entity_type: "deal",
        p_entity_id: deal.id,
        p_action_url: "/crm",
      });
      break;

    case "update_field":
      if (step.config.entity === "contact") {
        await supabase
          .from("contacts")
          .update({ [step.config.field_name]: step.config.new_value })
          .eq("id", contact.id);
      } else if (step.config.entity === "deal") {
        await supabase
          .from("deals")
          .update({ [step.config.field_name]: step.config.new_value })
          .eq("id", deal.id);
      }
      break;

    case "update_score":
      if (step.config.score_change) {
        const currentScore = contact?.lead_score || 0;
        const newScore = currentScore + parseInt(step.config.score_change);
        await supabase
          .from("contacts")
          .update({ lead_score: newScore })
          .eq("id", contact.id);
      }
      break;

    case "add_label":
      if (step.config.label_id && execution.conversation_id) {
        await supabase.from("conversation_labels").insert({
          conversation_id: execution.conversation_id,
          label_id: step.config.label_id,
        });
      }
      break;

    case "add_note":
      if (step.config.note && execution.conversation_id) {
        await supabase.from("conversation_notes").insert({
          conversation_id: execution.conversation_id,
          user_id: deal.assigned_to,
          content: replaceVars(step.config.note),
          note_type: "automation",
        });
      }
      break;

    case "assign_to":
      if (step.config.user_id && execution.conversation_id) {
        await supabase
          .from("conversations")
          .update({ assigned_to: step.config.user_id })
          .eq("id", execution.conversation_id);
      }
      if (step.config.user_id && deal) {
        await supabase
          .from("deals")
          .update({ assigned_to: step.config.user_id })
          .eq("id", deal.id);
      }
      break;

    case "send_to_n8n":
      if (step.config.n8n_url) {
        const response = await fetch(step.config.n8n_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            execution_id: execution.id,
            deal,
            contact,
            timestamp: new Date().toISOString(),
          }),
        });

        if (step.config.wait_response === "yes") {
          const responseData = await response.json();
          console.log("N8N Response:", responseData);
          // Poderia armazenar a resposta no execution metadata
        }
      }
      break;

    case "send_email":
      // TODO: Integrar com serviço de email (Resend)
      console.log("Send Email:", replaceVars(step.config.message));
      break;
  }
}
