import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScoringRules } from "@/hooks/useScoringRules";

interface ScoringRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any;
}

const CONDITION_TYPES = [
  { value: 'has_email', label: 'Tem Email', needsValue: false },
  { value: 'has_company', label: 'Tem Empresa', needsValue: false },
  { value: 'response_time', label: 'Tempo de Resposta', needsValue: true, valuePlaceholder: 'Minutos' },
  { value: 'messages_count', label: 'Quantidade de Mensagens', needsValue: true, valuePlaceholder: 'Número' },
  { value: 'has_open_deal', label: 'Tem Deal Aberto', needsValue: false },
  { value: 'deal_value', label: 'Valor do Deal', needsValue: true, valuePlaceholder: 'Valor em R$' },
  { value: 'days_inactive', label: 'Dias Inativo', needsValue: true, valuePlaceholder: 'Dias' },
];

export const ScoringRuleModal = ({ open, onOpenChange, rule }: ScoringRuleModalProps) => {
  const { createRule, updateRule } = useScoringRules();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    condition_type: '',
    condition_value: '',
    points: 0,
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        condition_type: rule.condition_type || '',
        condition_value: rule.condition_value || '',
        points: rule.points || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        condition_type: '',
        condition_value: '',
        points: 0,
      });
    }
  }, [rule, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rule) {
      updateRule({
        id: rule.id,
        ...formData,
      });
    } else {
      createRule(formData as any);
    }
    
    onOpenChange(false);
  };

  const selectedCondition = CONDITION_TYPES.find(t => t.value === formData.condition_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tem Email"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da regra"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="condition_type">Tipo de Condição</Label>
            <Select
              value={formData.condition_type}
              onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a condição" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCondition?.needsValue && (
            <div>
              <Label htmlFor="condition_value">Valor</Label>
              <Input
                id="condition_value"
                type="number"
                value={formData.condition_value}
                onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                placeholder={selectedCondition.valuePlaceholder}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="points">Pontos</Label>
            <Input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 10 ou -20"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use valores positivos para aumentar o score e negativos para diminuir
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {rule ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};