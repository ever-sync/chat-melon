import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  companyId: string;
  planId: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  customerPhone?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const ASAAS_SANDBOX = Deno.env.get('ASAAS_SANDBOX') === 'true';
    const ASAAS_BASE_URL = ASAAS_SANDBOX 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    const body: CreateSubscriptionRequest = await req.json();
    console.log('Create subscription request:', JSON.stringify(body, null, 2));

    // 1. Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', body.planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // 2. Fetch company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', body.companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    // 3. Create or get Asaas customer
    let asaasCustomerId = company.asaas_customer_id;

    if (!asaasCustomerId) {
      // Create customer in Asaas
      const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: body.customerName,
          email: body.customerEmail,
          cpfCnpj: body.customerCpfCnpj,
          phone: body.customerPhone,
          externalReference: body.companyId,
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json();
        console.error('Asaas customer creation error:', errorData);
        throw new Error(`Failed to create Asaas customer: ${JSON.stringify(errorData)}`);
      }

      const customerData = await customerResponse.json();
      asaasCustomerId = customerData.id;

      // Save customer ID to company
      await supabase
        .from('companies')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', body.companyId);

      console.log('Created Asaas customer:', asaasCustomerId);
    }

    // 4. Create subscription in Asaas
    const subscriptionPayload: any = {
      customer: asaasCustomerId,
      billingType: body.billingType,
      value: plan.price_monthly,
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      cycle: 'MONTHLY',
      description: `Assinatura ${plan.name}`,
      externalReference: `${body.companyId}:${body.planId}`,
    };

    // Add credit card info if applicable
    if (body.billingType === 'CREDIT_CARD' && body.creditCard) {
      subscriptionPayload.creditCard = body.creditCard;
      subscriptionPayload.creditCardHolderInfo = body.creditCardHolderInfo;
    }

    const subscriptionResponse = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Asaas subscription creation error:', errorData);
      throw new Error(`Failed to create Asaas subscription: ${JSON.stringify(errorData)}`);
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('Created Asaas subscription:', subscriptionData);

    // 5. Update company with subscription info
    await supabase
      .from('companies')
      .update({
        asaas_subscription_id: subscriptionData.id,
        asaas_payment_method: body.billingType,
        plan_id: body.planId,
        subscription_status: 'trial', // Will be updated to 'active' when payment is confirmed
      })
      .eq('id', body.companyId);

    // 6. Get first payment details (for PIX/Boleto)
    let paymentDetails = null;
    
    if (body.billingType !== 'CREDIT_CARD') {
      // Fetch the first payment to get PIX/Boleto details
      const paymentsResponse = await fetch(
        `${ASAAS_BASE_URL}/payments?subscription=${subscriptionData.id}&limit=1`,
        {
          headers: {
            'access_token': ASAAS_API_KEY,
          },
        }
      );

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.data && paymentsData.data.length > 0) {
          const payment = paymentsData.data[0];
          
          if (body.billingType === 'PIX') {
            // Get PIX QR Code
            const pixResponse = await fetch(
              `${ASAAS_BASE_URL}/payments/${payment.id}/pixQrCode`,
              {
                headers: {
                  'access_token': ASAAS_API_KEY,
                },
              }
            );
            
            if (pixResponse.ok) {
              const pixData = await pixResponse.json();
              paymentDetails = {
                paymentId: payment.id,
                invoiceUrl: payment.invoiceUrl,
                pixQrCode: pixData.encodedImage,
                pixCopyPaste: pixData.payload,
                dueDate: payment.dueDate,
                value: payment.value,
              };
            }
          } else if (body.billingType === 'BOLETO') {
            paymentDetails = {
              paymentId: payment.id,
              invoiceUrl: payment.invoiceUrl,
              boletoUrl: payment.bankSlipUrl,
              dueDate: payment.dueDate,
              value: payment.value,
            };
          }

          // Save to payment history
          await supabase
            .from('payment_history')
            .insert({
              company_id: body.companyId,
              asaas_payment_id: payment.id,
              amount: payment.value,
              status: payment.status,
              payment_method: body.billingType,
              due_date: payment.dueDate,
              invoice_url: payment.invoiceUrl,
              boleto_url: payment.bankSlipUrl,
              pix_qr_code: paymentDetails?.pixQrCode,
              pix_copy_paste: paymentDetails?.pixCopyPaste,
            });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscriptionData.id,
      customerId: asaasCustomerId,
      paymentDetails,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
