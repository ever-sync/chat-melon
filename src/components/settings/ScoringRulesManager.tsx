import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Trophy, 
  Mail, 
  Building2, 
  Zap, 
  MessageSquare, 
  Briefcase, 
  Handshake, 
  DollarSign, 
  Clock,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { useScoringRules } from '@/hooks/useScoringRules';
import { ScoringRuleModal } from './ScoringRuleModal';
import { cn } from '@/lib/utils';

export const ScoringRulesManager = () => {
  const { rules, isLoading, updateRule, deleteRule } = useScoringRules();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleToggleActive = (rule: any) => {
    updateRule({
      id: rule.id,
      is_active: !rule.is_active,
    });
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'has_email': return <Mail className="h-4 w-4" />;
      case 'has_company': return <Building2 className="h-4 w-4" />;
      case 'response_time': return <Zap className="h-4 w-4" />;
      case 'messages_count': return <MessageSquare className="h-4 w-4" />;
      case 'has_open_deal': return <Briefcase className="h-4 w-4" />;
      case 'deal_value': return <DollarSign className="h-4 w-4" />;
      case 'days_inactive': return <Clock className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getConditionLabel = (type: string, value: string | null) => {
    switch (type) {
      case 'has_email':
        return 'Contato possui email cadastrado';
      case 'has_company':
        return 'Contato possui empresa cadastrada';
      case 'response_time':
        return `Resposta rápida (menos de ${value} min)`;
      case 'messages_count':
        return `Engajamento alto (mais de ${value} msgs)`;
      case 'has_open_deal':
        return 'Possui negócio em andamento';
      case 'deal_value':
        return `Negócio de alto valor (R$ ${value}+)`;
      case 'days_inactive':
        return `Inatividade detectada (${value}+ dias)`;
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
        <div className="p-4 rounded-full bg-indigo-50 text-indigo-200">
          <Trophy className="h-8 w-8" />
        </div>
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">Lead Scoring</h3>
          </div>
          <p className="text-gray-500 max-w-lg">
            Defina regras inteligentes para qualificar automaticamente seus leads com base no comportamento e dados.
          </p>
        </div>
        
        <Button
          onClick={() => {
            setEditingRule(null);
            setShowModal(true);
          }}
          className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 gap-2"
        >
          <Plus className="h-5 w-5" />
          Nova Regra de Pontuação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => {
          const isPositive = rule.points > 0;
          
          return (
            <Card 
              key={rule.id} 
              className={cn(
                "group relative overflow-hidden transition-all duration-300 border-2 hover:shadow-xl hover:-translate-y-1",
                rule.is_active 
                  ? "bg-white border-indigo-50" 
                  : "bg-gray-50/50 border-gray-100 grayscale-[0.5]"
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-125",
                isPositive ? "bg-green-600" : "bg-red-600"
              )} />
              
              <CardHeader className="pb-3 border-b border-gray-50/50 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0 transition-colors",
                    isPositive 
                      ? "bg-green-50 text-green-600 group-hover:bg-green-100" 
                      : "bg-red-50 text-red-600 group-hover:bg-red-100"
                  )}>
                    {getRuleIcon(rule.condition_type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                      className="data-[state=checked]:bg-indigo-600 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-gray-900">{rule.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "rounded-lg font-bold border-2",
                        isPositive 
                          ? "bg-green-50/30 text-green-700 border-green-100/50" 
                          : "bg-red-50/30 text-red-700 border-red-100/50"
                      )}
                    >
                      {isPositive ? '+' : ''}{rule.points} pontos
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="outline" className="rounded-lg bg-gray-100 text-gray-500 border-gray-200">
                        Inativa
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-2 text-sm text-gray-500 min-h-[40px] leading-relaxed italic">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0 opacity-40" />
                  {rule.description || getConditionLabel(rule.condition_type, rule.condition_value)}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(rule)}
                      className="h-9 px-3 rounded-xl text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta regra?')) {
                        deleteRule(rule.id);
                      }
                    }}
                    className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State / Add Card */}
        <button
          onClick={() => {
            setEditingRule(null);
            setShowModal(true);
          }}
          className="group flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-300 gap-4 min-h-[280px]"
        >
          <div className="p-4 rounded-full bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-md transition-all">
            <Plus className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">Nova Regra</p>
            <p className="text-sm text-gray-500">Adicione mais critérios de pontuação</p>
          </div>
        </button>
      </div>

      <ScoringRuleModal
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setEditingRule(null);
        }}
        rule={editingRule}
      />
    </div>
  );
};
