import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Goal = {
  id: string;
  user_id: string;
  company_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  period: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

export type Achievement = {
  id: string;
  company_id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  points: number;
  badge_url?: string;
  created_at: string;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievements: Achievement;
};

export const useGamification = () => {
  const queryClient = useQueryClient();

  // Buscar metas do usuário
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
  });

  // Buscar achievements da empresa
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Buscar achievements conquistados pelo usuário
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['userAchievements'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
  });

  // Buscar rankings (leaderboard)
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Buscar empresa do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser) return [];

      // Buscar deals ganhos no mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: deals } = await supabase
        .from('deals')
        .select('assigned_to, value, profiles!deals_assigned_to_fkey(*)')
        .eq('company_id', companyUser.company_id)
        .eq('status', 'won')
        .gte('won_at', startOfMonth.toISOString());

      if (!deals) return [];

      // Agrupar por usuário
      const grouped = deals.reduce((acc: any, deal: any) => {
        const userId = deal.assigned_to;
        if (!userId) return acc;

        if (!acc[userId]) {
          acc[userId] = {
            user: deal.profiles,
            totalValue: 0,
            dealsCount: 0,
          };
        }
        acc[userId].totalValue += Number(deal.value || 0);
        acc[userId].dealsCount += 1;
        return acc;
      }, {});

      return Object.values(grouped)
        .sort((a: any, b: any) => b.totalValue - a.totalValue)
        .slice(0, 10);
    },
  });

  // Criar meta
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase.from('goals').insert([
        {
          user_id: user.id,
          company_id: companyUser?.company_id,
          goal_type: goalData.goal_type,
          target_value: goalData.target_value,
          period: goalData.period,
          start_date: goalData.start_date,
          end_date: goalData.end_date,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar meta');
      console.error(error);
    },
  });

  // Atualizar progresso da meta
  const updateGoalProgressMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: number }) => {
      const { error } = await supabase
        .from('goals')
        .update({ current_value: currentValue })
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Verificar e desbloquear achievements
  const checkAchievements = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar deals ganhos do usuário
    const { data: wonDeals } = await supabase
      .from('deals')
      .select('*')
      .eq('assigned_to', user.id)
      .eq('status', 'won');

    const wonCount = wonDeals?.length || 0;

    // Verificar cada achievement
    for (const achievement of achievements) {
      // Pular se já conquistou
      const alreadyEarned = userAchievements.some((ua) => ua.achievement_id === achievement.id);
      if (alreadyEarned) continue;

      let earned = false;

      // Avaliar critério
      if (achievement.criteria.type === 'deals_won') {
        earned = wonCount >= achievement.criteria.count;
      }

      if (earned) {
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

        queryClient.invalidateQueries({ queryKey: ['userAchievements'] });

        // Mostrar notificação
        toast.success(`🏆 Achievement desbloqueado: ${achievement.name}!`, {
          description: achievement.description,
        });
      }
    }
  };

  return {
    goals,
    achievements,
    userAchievements,
    leaderboard,
    isLoading: goalsLoading || achievementsLoading || userAchievementsLoading || leaderboardLoading,
    createGoal: createGoalMutation.mutateAsync,
    updateGoalProgress: updateGoalProgressMutation.mutateAsync,
    checkAchievements,
  };
};
