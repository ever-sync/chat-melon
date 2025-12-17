import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { useGamification, type Goal } from '@/hooks/useGamification';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GoalTracker = () => {
  const { goals, createGoal } = useGamification();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'revenue',
    target_value: 0,
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const activeGoals = goals.filter((g) => g.status === 'active');

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getDaysRemaining = (goal: Goal) => {
    return differenceInDays(new Date(goal.end_date), new Date());
  };

  const handleCreate = async () => {
    await createGoal(formData);
    setShowCreateDialog(false);
    setFormData({
      goal_type: 'revenue',
      target_value: 0,
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      revenue: 'Receita',
      deals: 'Negócios',
      calls: 'Ligações',
      meetings: 'Reuniões',
      response_time: 'Tempo de Resposta',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas Metas</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeGoals.map((goal) => {
          const progress = getProgress(goal);
          const daysLeft = getDaysRemaining(goal);

          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {getGoalTypeLabel(goal.goal_type)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Atual</span>
                    <span className="font-semibold">
                      {goal.goal_type === 'revenue'
                        ? formatCurrency(goal.current_value)
                        : goal.current_value.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meta</span>
                    <span className="font-semibold">
                      {goal.goal_type === 'revenue'
                        ? formatCurrency(goal.target_value)
                        : goal.target_value.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  {daysLeft > 0 ? (
                    <span>{daysLeft} dias restantes</span>
                  ) : (
                    <span className="text-destructive">Meta expirada</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {activeGoals.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma meta ativa</p>
              <p className="text-sm">Crie sua primeira meta para começar!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Criar Meta */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Meta</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="deals">Número de Negócios</SelectItem>
                  <SelectItem value="calls">Ligações</SelectItem>
                  <SelectItem value="meetings">Reuniões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor da Meta</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                placeholder="10000"
              />
            </div>

            <div>
              <Label>Período</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full">
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
