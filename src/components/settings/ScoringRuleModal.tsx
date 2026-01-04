import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScoringRules } from '@/hooks/useScoringRules';
import { 
  Trophy, 
  Info, 
  Settings2, 
  PlusCircle, 
  Save, 
  Sparkles,
  Mail,
  Building2,
  Zap,
  MessageSquare,
  Briefcase,
  DollarSign,
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ScoringRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any;
}

const CONDITION_TYPES = [
  { value: 'has_email', label: 'Tem Email', icon: Mail, description: 'Pontua se o contato tiver um e-mail válido.', needsValue: false },
  { value: 'has_company', label: 'Tem Empresa', icon: Building2, description: 'Pontua se o nome da empresa estiver preenchido.', needsValue: false },
  {
    value: 'response_time',
    label: 'Tempo de Resposta',
    icon: Zap,
    description: 'Pontua se o lead responder em menos de X minutos.',
    needsValue: true,
    valuePlaceholder: 'Minutos',
  },
  {
    value: 'messages_count',
    label: 'Qtd. de Mensagens',
    icon: MessageSquare,
    description: 'Pontua se o total de mensagens for maior que X.',
    needsValue: true,
    valuePlaceholder: 'Número de mensagens',
  },
  { value: 'has_open_deal', label: 'Tem Deal Aberto', icon: Briefcase, description: 'Pontua se houver um negócio "Open" vinculado.', needsValue: false },
  {
    value: 'deal_value',
    label: 'Valor do Deal',
    icon: DollarSign,
    description: 'Pontua se o valor do negócio for maior que R$ X.',
    needsValue: true,
    valuePlaceholder: 'Valor mínimo em R$',
  },
  { 
    value: 'days_inactive', 
    label: 'Dias Inativo', 
    icon: Clock,
    description: 'Pontua (geralmente negativo) se o lead sumir por X dias.',
    needsValue: true, 
    valuePlaceholder: 'Quantidade de dias'
  },
];

export const ScoringRuleModal = ({ open, onOpenChange, rule }: ScoringRuleModalProps) => {
  const { createRule, updateRule } = useScoringRules();
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.condition_type) {
      toast.error('Por favor, selecione um tipo de condição');
      return;
    }

    setIsSaving(true);
    try {
      if (rule) {
        await updateRule({
          id: rule.id,
          ...formData,
        });
      } else {
        await createRule(formData as any);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar a regra. Verifique o console.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCondition = CONDITION_TYPES.find((c) => c.value === formData.condition_type);

  return (
    <Dialog open={open} onOpenChange={(val) => !isSaving && onOpenChange(val)}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            <Trophy size={120} />
          </div>
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                {rule ? <Settings2 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              </div>
              <DialogTitle className="text-2xl font-bold">{rule ? 'Editar Regra' : 'Nova Regra de Pontuação'}</DialogTitle>
            </div>
            <p className="text-indigo-100/80">
              Configure critérios inteligentes para qualificar seus contatos automaticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
                  Nome da Regra
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Engajamento VIP"
                  className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all px-4"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 ml-1">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explique o propósito desta regra..."
                  className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all px-4 py-3 min-h-[100px] resize-none"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condition_type" className="text-sm font-semibold text-gray-700 ml-1">Tipo de Condição</Label>
                <Select
                  value={formData.condition_type}
                  onValueChange={(value) => setFormData({ ...formData, condition_type: value, condition_value: '' })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all px-4 bg-gray-50/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl p-1">
                    {CONDITION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="rounded-lg py-3 focus:bg-indigo-50 focus:text-indigo-700 group">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-gray-100 group-focus:bg-indigo-100/50 transition-colors">
                            <type.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCondition && (
                  <p className="text-[11px] text-indigo-500/80 mt-1.5 ml-1 italic flex items-center gap-1.5">
                    <Info className="h-3 w-3" />
                    {selectedCondition.description}
                  </p>
                )}
              </div>

              {selectedCondition?.needsValue && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Label htmlFor="condition_value" className="text-sm font-semibold text-gray-700 ml-1">
                    {selectedCondition.valuePlaceholder}
                  </Label>
                  <Input
                    id="condition_value"
                    type="number"
                    value={formData.condition_value}
                    onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                    placeholder="0"
                    className="h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all px-4"
                    required
                    disabled={isSaving}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="points" className="text-sm font-semibold text-gray-700 ml-1">Impacto no Score (Pontos)</Label>
                <div className="relative group">
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 10 ou -20"
                    className={cn(
                      "h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all px-4 font-bold text-lg",
                      formData.points > 0 ? "text-green-600" : formData.points < 0 ? "text-red-600" : "text-gray-400"
                    )}
                    required
                    disabled={isSaving}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    {formData.points > 0 ? <TrendingUp className="h-5 w-5 text-green-200" /> : <TrendingDown className="h-5 w-5 text-red-200" />}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 ml-1 mt-1 leading-tight">
                  Valores **positivos** aumentam o score e **negativos** diminuem a pontuação do lead.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-xl hover:bg-gray-50 text-gray-500 transition-all"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 font-bold"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {rule ? 'Salvar Alterações' : 'Criar Regra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
