import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CadenceStep {
  day: number;
  channel: "whatsapp" | "email" | "task";
  template_id?: string;
  message_content?: string;
  subject?: string;
  time?: string;
  task_type?: string;
  task_title?: string;
}

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  company_name?: string;
  [key: string]: any;
}

interface Enrollment {
  id: string;
  cadence_id: string;
  contact_id: string;
  deal_id?: string;
  current_step: number;
  status: string;
  next_step_at: string;
  step_history: any[];
  cadence: {
    id: string;
    company_id: string;
    name: string;
    steps: CadenceStep[];
    settings: {
      businessHoursOnly?: boolean;
      timezone?: string;
    };
  };
  contact: Contact;
}

// Interpolate variables in message content
function interpolateVariables(content: string, contact: Contact, deal?: any): string {
  let result = content;

  // Contact variables
  result = result.replace(/\{\{nome\}\}/gi, contact.name || "");
  result = result.replace(/\{\{name\}\}/gi, contact.name || "");
  result = result.replace(/\{\{email\}\}/gi, contact.email || "");
  result = result.replace(/\{\{telefone\}\}/gi, contact.phone_number || "");
  result = result.replace(/\{\{phone\}\}/gi, contact.phone_number || "");
  result = result.replace(/\{\{empresa\}\}/gi, contact.company_name || "");
  result = result.replace(/\{\{company\}\}/gi, contact.company_name || "");

  // Deal variables (if available)
  if (deal) {
    result = result.replace(/\{\{deal_name\}\}/gi, deal.name || "");
    result = result.replace(/\{\{deal_value\}\}/gi, deal.value?.toString() || "");
  }

  // Clean up any remaining unmatched variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result.trim();
}

// Check if current time is within business hours
function isBusinessHours(timezone: string = "America/Sao_Paulo"): boolean {
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: "numeric",
      weekday: "short"
    };
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);

    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
    const weekday = parts.find(p => p.type === "weekday")?.value || "";

    // Business hours: Mon-Fri, 9:00-18:00
    const isWeekday = !["Sat", "Sun"].includes(weekday);
    const isWorkingHour = hour >= 9 && hour < 18;

    return isWeekday && isWorkingHour;
  } catch {
    return true; // Default to allowing if timezone parsing fails
  }
}

// Calculate next step date
function calculateNextStepAt(steps: CadenceStep[], currentStep: number): Date | null {
  const nextStep = steps[currentStep + 1];
  if (!nextStep) return null;

  const now = new Date();
  const daysDiff = nextStep.day - (steps[currentStep]?.day || 0);
  const nextDate = new Date(now.getTime() + daysDiff * 24 * 60 * 60 * 1000);

  // Set specific time if provided
  if (nextStep.time) {
    const [hours, minutes] = nextStep.time.split(":").map(Number);
    nextDate.setHours(hours, minutes, 0, 0);
  }

  return nextDate;
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

    const { enrollmentId } = await req.json();

    if (!enrollmentId) {
      throw new Error("enrollmentId is required");
    }

    console.log(`Processing cadence step for enrollment: ${enrollmentId}`);

    // Fetch enrollment with cadence and contact data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("cadence_enrollments")
      .select(`
        *,
        cadence:cadences(*),
        contact:contacts(*)
      `)
      .eq("id", enrollmentId)
      .eq("status", "active")
      .single();

    if (enrollmentError || !enrollment) {
      console.error("Enrollment not found or not active:", enrollmentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Enrollment not found or not active"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const typedEnrollment = enrollment as unknown as Enrollment;
    const { cadence, contact } = typedEnrollment;
    const steps = cadence.steps as CadenceStep[];
    const currentStepIndex = typedEnrollment.current_step;
    const currentStep = steps[currentStepIndex];

    if (!currentStep) {
      console.log("No more steps to execute, marking as completed");
      await supabase
        .from("cadence_enrollments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrollmentId);

      // Increment cadence completed count
      await supabase.rpc("increment_cadence_stat", {
        p_cadence_id: cadence.id,
        p_stat: "completed",
      }).catch(() => {
        // If RPC doesn't exist, update directly
        return supabase
          .from("cadences")
          .update({ total_completed: cadence.total_completed + 1 })
          .eq("id", cadence.id);
      });

      return new Response(
        JSON.stringify({ success: true, status: "completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check business hours if setting is enabled
    const settings = cadence.settings || {};
    if (settings.businessHoursOnly && !isBusinessHours(settings.timezone)) {
      console.log("Outside business hours, skipping execution");
      return new Response(
        JSON.stringify({
          success: false,
          reason: "outside_business_hours",
          message: "Execution skipped - outside business hours"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch deal if available
    let deal = null;
    if (typedEnrollment.deal_id) {
      const { data: dealData } = await supabase
        .from("deals")
        .select("*")
        .eq("id", typedEnrollment.deal_id)
        .single();
      deal = dealData;
    }

    // Execute step based on channel
    let executionResult: { success: boolean; error?: string; details?: any } = { success: false };

    switch (currentStep.channel) {
      case "whatsapp": {
        const messageContent = interpolateVariables(
          currentStep.message_content || "",
          contact,
          deal
        );

        if (!contact.phone_number) {
          executionResult = { success: false, error: "Contact has no phone number" };
          break;
        }

        // Find conversation for this contact
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("contact_id", contact.id)
          .eq("company_id", cadence.company_id)
          .maybeSingle();

        // Get Evolution API settings
        const apiUrl = Deno.env.get("EVOLUTION_API_URL");
        const apiKey = Deno.env.get("EVOLUTION_API_KEY");

        // Get company's Evolution instance
        const { data: company } = await supabase
          .from("companies")
          .select("evolution_instance_name")
          .eq("id", cadence.company_id)
          .single();

        if (!apiUrl || !apiKey || !company?.evolution_instance_name) {
          executionResult = { success: false, error: "Evolution API not configured" };
          break;
        }

        try {
          const evolutionResponse = await fetch(
            `${apiUrl}/message/sendText/${company.evolution_instance_name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": apiKey,
              },
              body: JSON.stringify({
                number: contact.phone_number,
                text: messageContent,
              }),
            }
          );

          if (evolutionResponse.ok) {
            const evolutionData = await evolutionResponse.json();

            // Save message to database if conversation exists
            if (conversation) {
              await supabase.from("messages").insert({
                conversation_id: conversation.id,
                company_id: cadence.company_id,
                content: messageContent,
                is_from_me: true,
                status: "sent",
                external_id: evolutionData?.key?.id,
                metadata: { source: "cadence", cadence_id: cadence.id, step: currentStepIndex },
              });

              await supabase
                .from("conversations")
                .update({
                  last_message: messageContent,
                  last_message_time: new Date().toISOString(),
                })
                .eq("id", conversation.id);
            }

            executionResult = { success: true, details: evolutionData };
          } else {
            const errorText = await evolutionResponse.text();
            executionResult = { success: false, error: `Evolution API error: ${errorText}` };
          }
        } catch (error) {
          executionResult = { success: false, error: `WhatsApp send error: ${error.message}` };
        }
        break;
      }

      case "email": {
        const subject = interpolateVariables(
          currentStep.subject || "Follow-up",
          contact,
          deal
        );
        const body = interpolateVariables(
          currentStep.message_content || "",
          contact,
          deal
        );

        if (!contact.email) {
          executionResult = { success: false, error: "Contact has no email" };
          break;
        }

        try {
          // Call send-email edge function
          const emailResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                to_email: contact.email,
                subject,
                body,
                contact_id: contact.id,
                deal_id: typedEnrollment.deal_id,
                company_id: cadence.company_id,
              }),
            }
          );

          if (emailResponse.ok) {
            executionResult = { success: true };
          } else {
            const errorData = await emailResponse.json();
            executionResult = { success: false, error: errorData.error || "Email send failed" };
          }
        } catch (error) {
          executionResult = { success: false, error: `Email send error: ${error.message}` };
        }
        break;
      }

      case "task": {
        const taskTitle = interpolateVariables(
          currentStep.task_title || "Follow-up task",
          contact,
          deal
        );

        try {
          // Create a task in the activities table
          const { error: taskError } = await supabase.from("activities").insert({
            company_id: cadence.company_id,
            contact_id: contact.id,
            deal_id: typedEnrollment.deal_id,
            type: currentStep.task_type || "call",
            title: taskTitle,
            status: "pending",
            due_date: new Date().toISOString(),
            metadata: { source: "cadence", cadence_id: cadence.id, step: currentStepIndex },
          });

          if (taskError) {
            executionResult = { success: false, error: `Task creation error: ${taskError.message}` };
          } else {
            executionResult = { success: true };
          }
        } catch (error) {
          executionResult = { success: false, error: `Task creation error: ${error.message}` };
        }
        break;
      }

      default:
        executionResult = { success: false, error: `Unknown channel: ${currentStep.channel}` };
    }

    // Update step history
    const newStepHistory = [
      ...(typedEnrollment.step_history || []),
      {
        step: currentStepIndex,
        channel: currentStep.channel,
        executed_at: new Date().toISOString(),
        status: executionResult.success ? "sent" : "failed",
        error: executionResult.error,
      },
    ];

    // Calculate next step
    const nextStepIndex = currentStepIndex + 1;
    const hasMoreSteps = nextStepIndex < steps.length;
    const nextStepAt = hasMoreSteps ? calculateNextStepAt(steps, currentStepIndex) : null;

    // Update enrollment
    const updateData: any = {
      current_step: nextStepIndex,
      step_history: newStepHistory,
      updated_at: new Date().toISOString(),
    };

    if (hasMoreSteps && nextStepAt) {
      updateData.next_step_at = nextStepAt.toISOString();
    } else if (!hasMoreSteps) {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
      updateData.next_step_at = null;
    }

    await supabase
      .from("cadence_enrollments")
      .update(updateData)
      .eq("id", enrollmentId);

    // Update cadence metrics if completed
    if (!hasMoreSteps) {
      await supabase
        .from("cadences")
        .update({
          total_completed: (cadence.total_completed || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cadence.id);
    }

    console.log(`Step ${currentStepIndex} executed for enrollment ${enrollmentId}:`, executionResult);

    return new Response(
      JSON.stringify({
        success: executionResult.success,
        enrollment_id: enrollmentId,
        step_executed: currentStepIndex,
        channel: currentStep.channel,
        next_step: hasMoreSteps ? nextStepIndex : null,
        next_step_at: nextStepAt?.toISOString() || null,
        error: executionResult.error,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error executing cadence step:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
