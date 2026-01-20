import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutOptions {
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

export function useAsaasCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = async (options: CheckoutOptions) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: options,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar assinatura');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSubscription,
    isLoading,
  };
}
