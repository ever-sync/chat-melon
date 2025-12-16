import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixChargeRequest {
  orderId: string;
  amount: number;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  expirationMinutes?: number;
}

interface PixChargeResponse {
  success: boolean;
  payment_id?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  pix_code?: string;
  expiration_date?: string;
  error?: string;
}

// Mercado Pago PIX Integration
async function createMercadoPagoPixCharge(
  accessToken: string,
  orderId: string,
  amount: number,
  description: string,
  customerEmail: string,
  expirationMinutes: number
): Promise<PixChargeResponse> {
  try {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `pix-${orderId}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: description || `Pedido #${orderId}`,
        payment_method_id: "pix",
        payer: {
          email: customerEmail || "customer@example.com",
        },
        external_reference: orderId,
        date_of_expiration: expirationDate.toISOString(),
      }),
    });

    const payment = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", payment);
      return {
        success: false,
        error: payment.message || "Erro ao criar cobrança PIX",
      };
    }

    const transactionData = payment.point_of_interaction?.transaction_data;

    return {
      success: true,
      payment_id: payment.id?.toString(),
      qr_code: transactionData?.qr_code,
      qr_code_base64: transactionData?.qr_code_base64,
      ticket_url: transactionData?.ticket_url,
      pix_code: transactionData?.qr_code, // "copia e cola"
      expiration_date: expirationDate.toISOString(),
    };
  } catch (error) {
    console.error("Error creating Mercado Pago PIX charge:", error);
    return {
      success: false,
      error: error.message || "Erro ao conectar com Mercado Pago",
    };
  }
}

// PagSeguro PIX Integration (alternative)
async function createPagSeguroPixCharge(
  accessToken: string,
  orderId: string,
  amount: number,
  description: string,
  customerEmail: string,
  expirationMinutes: number
): Promise<PixChargeResponse> {
  try {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);

    // PagSeguro uses amount in cents
    const amountInCents = Math.round(amount * 100);

    const response = await fetch("https://api.pagseguro.com/instant-payments/cob", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        calendario: {
          expiracao: expirationMinutes * 60, // seconds
        },
        valor: {
          original: (amountInCents / 100).toFixed(2),
        },
        chave: Deno.env.get("PAGSEGURO_PIX_KEY"), // Chave PIX cadastrada
        solicitacaoPagador: description || `Pedido #${orderId}`,
        infoAdicionais: [
          {
            nome: "Pedido",
            valor: orderId,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PagSeguro error:", data);
      return {
        success: false,
        error: data.mensagem || "Erro ao criar cobrança PIX",
      };
    }

    return {
      success: true,
      payment_id: data.txid,
      qr_code: data.pixCopiaECola,
      pix_code: data.pixCopiaECola,
      expiration_date: expirationDate.toISOString(),
    };
  } catch (error) {
    console.error("Error creating PagSeguro PIX charge:", error);
    return {
      success: false,
      error: error.message || "Erro ao conectar com PagSeguro",
    };
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

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const body: PixChargeRequest = await req.json();
    const {
      orderId,
      amount,
      description,
      customerEmail,
      customerName,
      expirationMinutes = 30,
    } = body;

    if (!orderId || !amount) {
      throw new Error("orderId e amount são obrigatórios");
    }

    // Get order details
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
      throw new Error("Pedido não encontrado");
    }

    // Get payment provider settings
    const provider = Deno.env.get("PIX_PROVIDER") || "mercadopago";
    let result: PixChargeResponse;

    switch (provider.toLowerCase()) {
      case "mercadopago": {
        const mpAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
        if (!mpAccessToken) {
          throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
        }

        result = await createMercadoPagoPixCharge(
          mpAccessToken,
          orderId,
          amount,
          description || `Pedido #${order.order_number} - ${order.company?.name || "MelonChat"}`,
          customerEmail || order.contact?.email || "cliente@example.com",
          expirationMinutes
        );
        break;
      }

      case "pagseguro": {
        const psAccessToken = Deno.env.get("PAGSEGURO_ACCESS_TOKEN");
        if (!psAccessToken) {
          throw new Error("PAGSEGURO_ACCESS_TOKEN não configurado");
        }

        result = await createPagSeguroPixCharge(
          psAccessToken,
          orderId,
          amount,
          description || `Pedido #${order.order_number}`,
          customerEmail || order.contact?.email || "cliente@example.com",
          expirationMinutes
        );
        break;
      }

      default:
        throw new Error(`Provider PIX não suportado: ${provider}`);
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update order with PIX info
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_method: "pix",
        payment_status: "processing",
        payment_provider: provider,
        payment_id: result.payment_id,
        pix_code: result.pix_code,
        pix_qrcode_url: result.qr_code_base64
          ? `data:image/png;base64,${result.qr_code_base64}`
          : null,
        pix_expiration: result.expiration_date,
        status: "awaiting_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    // Log the payment attempt
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "awaiting_payment",
      notes: `Cobrança PIX criada via ${provider}. Payment ID: ${result.payment_id}`,
      changed_by: user.id,
    });

    // Send PIX to customer via WhatsApp if contact has phone
    if (order.contact?.phone_number && order.conversation_id) {
      const pixMessage = `💳 *PIX para Pagamento*\n\n` +
        `Pedido: #${order.order_number}\n` +
        `Valor: R$ ${amount.toFixed(2)}\n\n` +
        `📱 *Código PIX (copia e cola):*\n${result.pix_code}\n\n` +
        `⏰ Válido por ${expirationMinutes} minutos\n\n` +
        `Após o pagamento, você receberá a confirmação automaticamente! ✅`;

      // Call Evolution API to send message
      const apiUrl = Deno.env.get("EVOLUTION_API_URL");
      const apiKey = Deno.env.get("EVOLUTION_API_KEY");

      if (apiUrl && apiKey) {
        const { data: company } = await supabase
          .from("companies")
          .select("evolution_instance_name")
          .eq("id", order.company_id)
          .single();

        if (company?.evolution_instance_name) {
          try {
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
                  text: pixMessage,
                }),
              }
            );

            // Save message to conversation
            await supabase.from("messages").insert({
              conversation_id: order.conversation_id,
              company_id: order.company_id,
              content: pixMessage,
              is_from_me: true,
              status: "sent",
              metadata: { type: "pix_charge", order_id: orderId },
            });
          } catch (error) {
            console.error("Error sending PIX message via WhatsApp:", error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: result.payment_id,
        qr_code: result.qr_code,
        qr_code_base64: result.qr_code_base64,
        pix_code: result.pix_code,
        ticket_url: result.ticket_url,
        expiration_date: result.expiration_date,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating PIX charge:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao criar cobrança PIX",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
