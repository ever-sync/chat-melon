import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from './useCompanyQuery';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  sku: string | null;
  category: string | null;
  category_id: string | null;
  custom_field_values: Record<string, any> | null;
  images: string[] | null;
  is_active: boolean | null;
  company_id: string;
}

export const useProducts = () => {
  const { companyId } = useCompanyQuery();
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['products', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!companyId,
  });

  const createProduct = useMutation({
    mutationFn: async (product: TablesInsert<'products'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          company_id: companyId!,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto');
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: TablesUpdate<'products'> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto desativado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao desativar produto:', error);
      toast.error('Erro ao desativar produto');
    },
  });

  return {
    products,
    isLoading,
    refetch,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
  };
};
