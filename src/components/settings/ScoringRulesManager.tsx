import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useScoringRules } from '@/hooks/useScoringRules';
import { ScoringRuleModal } from './ScoringRuleModal';

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

  const getConditionLabel = (type: string, value: string | null) => {
    switch (type) {
      case 'has_email':
        return 'Tem email';
      case 'has_company':
        return 'Tem empresa';
      case 'response_time':
        return `Resposta < ${value} min`;
      case 'messages_count':
        return `> ${value} mensagens`;
      case 'has_open_deal':
        return 'Tem deal aberto';
      case 'deal_value':
        return `Deal > R$ ${value}`;
      case 'days_inactive':
        return `Inativo > ${value} dias`;
      default:
        return type;
    }
  };

  if (isLoading) {
    return <div>Carregando regras...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regras de Lead Scoring</h3>
          <p className="text-sm text-muted-foreground">
            Configure as regras para calcular automaticamente o score dos contatos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {rule.name}
                    <Badge variant={rule.points > 0 ? 'default' : 'destructive'}>
                      {rule.points > 0 ? '+' : ''}
                      {rule.points} pts
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {rule.description ||
                      getConditionLabel(rule.condition_type, rule.condition_value)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggleActive(rule)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta regra?')) {
                        deleteRule(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
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
