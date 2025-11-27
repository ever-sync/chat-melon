import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatFilters, SavedFilter } from '@/types/chatFilters';
import { useCompany } from '@/contexts/CompanyContext';

export const useSavedFilters = () => {
  const { currentCompany } = useCompany();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedFilters = async () => {
    if (!currentCompany?.id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFilters((data as unknown as SavedFilter[]) || []);
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedFilters();
  }, [currentCompany?.id]);

  const saveFilter = async (name: string, filters: ChatFilters, isDefault: boolean = false) => {
    if (!currentCompany?.id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('company_id', currentCompany.id)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          company_id: currentCompany.id,
          name,
          filters: filters as any,
          is_default: isDefault,
        });

      if (error) throw error;

      toast.success(`"${name}" foi salvo com sucesso`);

      await loadSavedFilters();
    } catch (error) {
      console.error('Erro ao salvar filtro:', error);
      toast.error('Não foi possível salvar o filtro');
    }
  };

  const deleteFilter = async (filterId: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;

      toast.success('O filtro foi removido com sucesso');

      await loadSavedFilters();
    } catch (error) {
      console.error('Erro ao remover filtro:', error);
      toast.error('Não foi possível remover o filtro');
    }
  };

  const setAsDefault = async (filterId: string) => {
    if (!currentCompany?.id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all defaults first
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('company_id', currentCompany.id)
        .eq('user_id', user.id);

      // Set the selected one as default
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: true })
        .eq('id', filterId);

      if (error) throw error;

      toast.success('Este filtro será aplicado automaticamente');

      await loadSavedFilters();
    } catch (error) {
      console.error('Erro ao definir filtro padrão:', error);
      toast.error('Não foi possível definir o filtro padrão');
    }
  };

  return {
    savedFilters,
    loading,
    saveFilter,
    deleteFilter,
    setAsDefault,
    reload: loadSavedFilters,
  };
};
