import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MercadoPagoWebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: number;
}

// Fetch payment details from Mercado Pago
async function fetchPaymentDetails(paymentId: string, accessToken: string) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch payment: ${response.status}`);
  }

  return await response.json();
}

// Send WhatsApp confirmation message
async function sendConfirmationMessage(
  supabase: any,
  order: any,
  payment: any
) {
  try {
    if (!order.contact?.phone_number || !order.conversation_id) {
      console.log("No phone or conversation to send confirmation");
      return;
    }

    const apiUrl = Deno.env.get("EVOLUTION_API_URL");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY");

    if (!apiUrl || !apiKey) {
      console.log("Evolution API not configured");
      return;
    }

    const { data: company } = await supabase
      .from("companies")
      .select("evolution_instance_name, name")
      .eq("id", order.company_id)
      .single();

    if (!company?.evolution_instance_name) {
      console.log("No Evolution instance for company");
      return;
    }

    const confirmationMessage =
      `✅ *Pagamento Confirmado!*\n\n` +
      `Pedido: #${order.order_number}\n` +
      `Valor: R$ ${order.total?.toFixed(2) || payment.transaction_amount?.toFixed(2)}\n` +
      `Forma: PIX\n\n` +
      `Obrigado pela sua compra! 🎉\n` +
      `${company.name || 'MelonChat'}`;

    await fetch(
      `${apiUrl}/message/sendText/${company.evolution_instance_name}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          number: order.contact.phone_number,
          text: confirmationMessage,
        }),
      }
    );

    // Save message to conversation
    await supabase.from("messages").insert({
      conversation_id: order.conversation_id,
      company_id: order.company_id,
      content: confirmationMessage,
      is_from_me: true,
      status: "sent",
      metadata: { type: "payment_confirmation", order_id: order.id },
    });

    console.log("Confirmation message sent");
  } catch (error) {
    console.error("Error sending confirmation message:", error);
  }
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

    const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const payload: MercadoPagoWebhookPayload = await req.json();
    console.log("Mercado Pago webhook received:", JSON.stringify(payload, null, 2));

    // Only process payment notifications
    if (payload.type !== "payment") {
      return new Response(
        JSON.stringify({ ok: true, message: "Ignored non-payment event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentId = payload.data.id;

    // Fetch payment details
    const payment = await fetchPaymentDetails(paymentId, mpAccessToken);
    console.log("Payment details:", JSON.stringify(payment, null, 2));

    const orderId = payment.external_reference;
    const paymentStatus = payment.status;

    if (!orderId) {
      console.log("No external_reference (order ID) in payment");
      return new Response(
        JSON.stringify({ ok: true, message: "No order reference" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        contact:contacts(name, email, phone_number),
        company:companies(id, name)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ ok: true, message: "Order not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map Mercado Pago status to order status
    let newOrderStatus = order.status;
    let newPaymentStatus = order.payment_status;
    let statusNote = "";

    switch (paymentStatus) {
      case "approved":
        newOrderStatus = "paid";
        newPaymentStatus = "paid";
        statusNote = `Pagamento PIX aprovado. ID: ${paymentId}`;
        break;

      case "pending":
      case "in_process":
        newOrderStatus = "awaiting_payment";
        newPaymentStatus = "processing";
        statusNote = `Pagamento PIX em processamento. ID: ${paymentId}`;
        break;

      case "rejected":
        newOrderStatus = "pending";
        newPaymentStatus = "failed";
        statusNote = `Pagamento PIX rejeitado. Motivo: ${payment.status_detail}`;
        break;

      case "cancelled":
        newOrderStatus = "pending";
        newPaymentStatus = "failed";
        statusNote = `Pagamento PIX cancelado`;
        break;

      case "refunded":
      case "charged_back":
        newOrderStatus = "refunded";
        newPaymentStatus = "refunded";
        statusNote = `Pagamento PIX estornado`;
        break;

      default:
        console.log(`Unknown payment status: ${paymentStatus}`);
        return new Response(
          JSON.stringify({ ok: true, message: `Unknown status: ${paymentStatus}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Update order
    const updateData: any = {
      status: newOrderStatus,
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (paymentStatus === "approved") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    // Log status change
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: newOrderStatus,
      notes: statusNote,
    });

    // Send confirmation message if payment approved
    if (paymentStatus === "approved") {
      await sendConfirmationMessage(supabase, order, payment);
    }

    console.log(`Order ${orderId} updated: status=${newOrderStatus}, payment=${newPaymentStatus}`);

    return new Response(
      JSON.stringify({
        ok: true,
        order_id: orderId,
        order_status: newOrderStatus,
        payment_status: newPaymentStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
