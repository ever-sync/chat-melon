import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

interface AsaasPaymentEvent {
  event: string;
  payment: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    netValue: number;
    status: string;
    billingType: string;
    dueDate: string;
    paymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixTransaction?: {
      qrCode?: {
        encodedImage?: string;
        payload?: string;
      };
    };
  };
}

interface AsaasSubscriptionEvent {
  event: string;
  subscription: {
    id: string;
    customer: string;
    status: string;
    nextDueDate: string;
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

    const body = await req.json();
    console.log('Asaas webhook received:', JSON.stringify(body, null, 2));

    const event = body.event;

    // Handle payment events
    if (event.startsWith('PAYMENT_')) {
      const paymentData = body.payment as AsaasPaymentEvent['payment'];
      
      // Find company by Asaas customer ID
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, subscription_status')
        .eq('asaas_customer_id', paymentData.customer)
        .single();

      if (companyError || !company) {
        console.error('Company not found for Asaas customer:', paymentData.customer);
        return new Response(JSON.stringify({ error: 'Company not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upsert payment history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .upsert({
          company_id: company.id,
          asaas_payment_id: paymentData.id,
          amount: paymentData.value,
          status: paymentData.status,
          payment_method: paymentData.billingType,
          due_date: paymentData.dueDate,
          payment_date: paymentData.paymentDate,
          invoice_url: paymentData.invoiceUrl,
          boleto_url: paymentData.bankSlipUrl,
          pix_qr_code: paymentData.pixTransaction?.qrCode?.encodedImage,
          pix_copy_paste: paymentData.pixTransaction?.qrCode?.payload,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'asaas_payment_id',
        });

      if (paymentError) {
        console.error('Error upserting payment history:', paymentError);
      }

      // Update company subscription status based on payment status
      let newSubscriptionStatus = company.subscription_status;

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          newSubscriptionStatus = 'active';
          break;
        case 'PAYMENT_OVERDUE':
          newSubscriptionStatus = 'suspended';
          break;
        case 'PAYMENT_REFUNDED':
        case 'PAYMENT_DELETED':
          // Keep current status, maybe notify admin
          break;
      }

      if (newSubscriptionStatus !== company.subscription_status) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            subscription_status: newSubscriptionStatus,
            subscription_started_at: event === 'PAYMENT_RECEIVED' ? new Date().toISOString() : undefined,
          })
          .eq('id', company.id);

        if (updateError) {
          console.error('Error updating company subscription status:', updateError);
        }
      }

      console.log(`Payment ${event} processed for company ${company.id}`);
    }

    // Handle subscription events
    if (event.startsWith('SUBSCRIPTION_')) {
      const subscriptionData = body.subscription as AsaasSubscriptionEvent['subscription'];

      // Find company by Asaas subscription ID
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('asaas_subscription_id', subscriptionData.id)
        .single();

      if (companyError || !company) {
        console.log('Company not found for Asaas subscription:', subscriptionData.id);
        // Try to find by customer ID
        const { data: companyByCustomer } = await supabase
          .from('companies')
          .select('id')
          .eq('asaas_customer_id', subscriptionData.customer)
          .single();

        if (!companyByCustomer) {
          return new Response(JSON.stringify({ error: 'Company not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const targetCompanyId = company?.id;

      switch (event) {
        case 'SUBSCRIPTION_CREATED':
          console.log(`Subscription created for company ${targetCompanyId}`);
          break;
        case 'SUBSCRIPTION_UPDATED':
          console.log(`Subscription updated for company ${targetCompanyId}`);
          break;
        case 'SUBSCRIPTION_DELETED':
        case 'SUBSCRIPTION_INACTIVATED':
          if (targetCompanyId) {
            await supabase
              .from('companies')
              .update({
                subscription_status: 'cancelled',
                asaas_subscription_id: null,
              })
              .eq('id', targetCompanyId);
          }
          break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Asaas webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
