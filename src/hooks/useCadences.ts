import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/contexts/CompanyContext';
import type {
  Cadence,
  CadenceEnrollment,
  CreateCadenceInput,
  UpdateCadenceInput,
  EnrollContactInput,
  CadenceStep,
} from '@/types/cadences';

// =====================================================
// Cadences CRUD Hook
// =====================================================

export function useCadences() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const cadencesQuery = useQuery({
    queryKey: ['cadences', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('cadences')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Cadence[];
    },
    enabled: !!currentCompany?.id,
  });

  const createCadence = useMutation({
    mutationFn: async (input: CreateCadenceInput) => {
      if (!currentCompany?.id) throw new Error('Company not found');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const defaultSteps: CadenceStep[] = input.steps || [
        {
          id: 'step_1',
          day: 0,
          time: '09:00',
          channel: 'whatsapp',
          message_content: 'Olá {{nome}}, tudo bem?',
        },
      ];

      const { data, error } = await supabase
        .from('cadences')
        .insert({
          company_id: currentCompany.id,
          name: input.name,
          description: input.description,
          steps: defaultSteps,
          settings: input.settings || {},
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const updateCadence = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCadenceInput & { id: string }) => {
      const { data, error } = await supabase
        .from('cadences')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const deleteCadence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cadences').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const duplicateCadence = useMutation({
    mutationFn: async (id: string) => {
      if (!currentCompany?.id) throw new Error('Company not found');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get original cadence
      const { data: original, error: fetchError } = await supabase
        .from('cadences')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !original) throw fetchError || new Error('Cadence not found');

      // Create copy
      const { data, error } = await supabase
        .from('cadences')
        .insert({
          company_id: currentCompany.id,
          name: `${original.name} (cópia)`,
          description: original.description,
          steps: original.steps,
          settings: original.settings,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const activateCadence = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('cadences')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const pauseCadence = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('cadences')
        .update({ status: 'paused' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  return {
    cadences: cadencesQuery.data || [],
    isLoading: cadencesQuery.isLoading,
    error: cadencesQuery.error,
    createCadence,
    updateCadence,
    deleteCadence,
    duplicateCadence,
    activateCadence,
    pauseCadence,
  };
}

// =====================================================
// Single Cadence Hook
// =====================================================

export function useCadence(id: string | undefined) {
  const queryClient = useQueryClient();

  const cadenceQuery = useQuery({
    queryKey: ['cadence', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase.from('cadences').select('*').eq('id', id).single();

      if (error) throw error;
      return data as Cadence;
    },
    enabled: !!id,
  });

  const saveSteps = useMutation({
    mutationFn: async (steps: CadenceStep[]) => {
      if (!id) throw new Error('Cadence ID required');

      const { data, error } = await supabase
        .from('cadences')
        .update({ steps, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Cadence;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cadence', id], data);
    },
  });

  return {
    cadence: cadenceQuery.data,
    isLoading: cadenceQuery.isLoading,
    error: cadenceQuery.error,
    saveSteps,
  };
}

// =====================================================
// Cadence Enrollments Hook
// =====================================================

export function useCadenceEnrollments(cadenceId?: string) {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const enrollmentsQuery = useQuery({
    queryKey: ['cadence-enrollments', cadenceId],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let query = supabase
        .from('cadence_enrollments')
        .select(
          `
          *,
          contact:contacts(name, phone_number),
          cadence:cadences(name)
        `
        )
        .order('created_at', { ascending: false });

      if (cadenceId) {
        query = query.eq('cadence_id', cadenceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CadenceEnrollment[];
    },
    enabled: !!currentCompany?.id,
  });

  const enrollContact = useMutation({
    mutationFn: async (input: EnrollContactInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Calculate next step time
      const nextStepAt = new Date();
      nextStepAt.setHours(9, 0, 0, 0); // Default to 9 AM
      if (nextStepAt < new Date()) {
        nextStepAt.setDate(nextStepAt.getDate() + 1);
      }

      const { data, error } = await supabase
        .from('cadence_enrollments')
        .insert({
          cadence_id: input.cadence_id,
          contact_id: input.contact_id,
          deal_id: input.deal_id,
          enrolled_by: user?.id,
          next_step_at: nextStepAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update cadence metrics
      await supabase.rpc('increment_cadence_enrolled', { cadence_id: input.cadence_id });

      return data as CadenceEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['cadences'] });
    },
  });

  const unenrollContact = useMutation({
    mutationFn: async ({ enrollmentId, reason }: { enrollmentId: string; reason?: string }) => {
      const { error } = await supabase
        .from('cadence_enrollments')
        .update({
          status: 'exited',
          exit_reason: reason || 'Manual exit',
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-enrollments'] });
    },
  });

  const pauseEnrollment = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('cadence_enrollments')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-enrollments'] });
    },
  });

  const resumeEnrollment = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('cadence_enrollments')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadence-enrollments'] });
    },
  });

  return {
    enrollments: enrollmentsQuery.data || [],
    isLoading: enrollmentsQuery.isLoading,
    error: enrollmentsQuery.error,
    enrollContact,
    unenrollContact,
    pauseEnrollment,
    resumeEnrollment,
  };
}

// =====================================================
// Cadence Analytics Hook
// =====================================================

export function useCadenceAnalytics(cadenceId: string | undefined) {
  const analyticsQuery = useQuery({
    queryKey: ['cadence-analytics', cadenceId],
    queryFn: async () => {
      if (!cadenceId) return null;

      // Get cadence with metrics
      const { data: cadence, error: cadenceError } = await supabase
        .from('cadences')
        .select('total_enrolled, total_completed, total_replied, total_converted')
        .eq('id', cadenceId)
        .single();

      if (cadenceError) throw cadenceError;

      // Get enrollments by status
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('cadence_enrollments')
        .select('status, current_step')
        .eq('cadence_id', cadenceId);

      if (enrollmentsError) throw enrollmentsError;

      // Calculate stats
      const statusCounts =
        enrollments?.reduce(
          (acc, e) => {
            acc[e.status] = (acc[e.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      const avgStep =
        enrollments?.length > 0
          ? enrollments.reduce((sum, e) => sum + e.current_step, 0) / enrollments.length
          : 0;

      return {
        ...cadence,
        active: statusCounts['active'] || 0,
        completed: statusCounts['completed'] || 0,
        replied: statusCounts['replied'] || 0,
        converted: statusCounts['converted'] || 0,
        paused: statusCounts['paused'] || 0,
        exited: statusCounts['exited'] || 0,
        avgStep,
        replyRate:
          cadence.total_enrolled > 0 ? (cadence.total_replied / cadence.total_enrolled) * 100 : 0,
        conversionRate:
          cadence.total_enrolled > 0 ? (cadence.total_converted / cadence.total_enrolled) * 100 : 0,
      };
    },
    enabled: !!cadenceId,
  });

  return {
    analytics: analyticsQuery.data,
    isLoading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
  };
}
