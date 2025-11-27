import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";
import { LabelBadge } from "./LabelBadge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LabelData {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  description?: string | null;
}

interface LabelsManagerProps {
  conversationId: string;
  currentLabels?: string[];
  onLabelsChange?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PRESET_COLORS = [
  { name: "Vermelho", color: "#EF4444" },
  { name: "Laranja", color: "#F97316" },
  { name: "Amarelo", color: "#F59E0B" },
  { name: "Verde", color: "#10B981" },
  { name: "Azul", color: "#3B82F6" },
  { name: "Roxo", color: "#8B5CF6" },
  { name: "Rosa", color: "#EC4899" },
  { name: "Cinza", color: "#6B7280" },
];

const PRESET_ICONS = [
  "AlertCircle", "CheckCircle", "Clock", "HeadphonesIcon", "ShoppingCart",
  "Tag", "Star", "Flag", "Zap", "Heart", "TrendingUp", "AlertTriangle",
  "Info", "Mail", "Phone", "MessageSquare", "Users", "Calendar"
];

export function LabelsManager({ 
  conversationId, 
  currentLabels = [], 
  onLabelsChange,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: LabelsManagerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [conversationLabelIds, setConversationLabelIds] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0].color);
  const [newLabelIcon, setNewLabelIcon] = useState<string>(PRESET_ICONS[0]);
  const [newLabelDescription, setNewLabelDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentCompany } = useCompany();

  // Usar controlledOpen se fornecido, senão usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (open) {
      loadLabels();
      loadConversationLabels();
    }
  }, [open]);

  const loadLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('company_id', currentCompany?.id)
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar labels:', error);
    }
  };

  const loadConversationLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_labels')
        .select('label_id')
        .eq('conversation_id', conversationId);

      if (error) throw error;
      setConversationLabelIds(data?.map(cl => cl.label_id) || []);
    } catch (error: any) {
      console.error('Erro ao carregar labels da conversa:', error);
    }
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('labels')
        .insert({
          company_id: currentCompany?.id,
          name: newLabelName.trim(),
          color: newLabelColor,
          icon: newLabelIcon,
          description: newLabelDescription.trim() || null,
        });

      if (error) throw error;

      toast.success("Label criada!", {
        description: "A label foi criada com sucesso"
      });

      setNewLabelName("");
      setNewLabelDescription("");
      setNewLabelColor(PRESET_COLORS[0].color);
      setNewLabelIcon(PRESET_ICONS[0]);
      loadLabels();
    } catch (error: any) {
      console.error('Erro ao criar label:', error);
      toast.error("Erro ao criar label: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteLabel = async (labelId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta label?")) return;
    
    try {
      const { error } = await supabase
        .from('labels')
        .delete()
        .eq('id', labelId);

      if (error) throw error;

      toast.success("Label removida!", {
        description: "A label foi removida com sucesso"
      });

      loadLabels();
    } catch (error: any) {
      console.error('Erro ao remover label:', error);
      toast.error("Erro ao remover label: " + error.message);
    }
  };

  const toggleLabel = async (labelId: string) => {
    try {
      const hasLabel = conversationLabelIds.includes(labelId);

      if (hasLabel) {
        const { error } = await supabase
          .from('conversation_labels')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('label_id', labelId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conversation_labels')
          .insert({
            conversation_id: conversationId,
            label_id: labelId,
          });

        if (error) throw error;
      }

      loadConversationLabels();
      onLabelsChange?.();
    } catch (error: any) {
      console.error('Erro ao atualizar label:', error);
      toast.error("Erro ao atualizar label: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Tag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Labels
          </DialogTitle>
          <DialogDescription>
            Organize suas conversas com etiquetas coloridas. Pressione "L" no chat para acesso rápido.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Preview da nova label */}
            {newLabelName && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <LabelBadge 
                  name={newLabelName}
                  color={newLabelColor}
                  icon={newLabelIcon}
                />
              </div>
            )}

            {/* Create new label */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Criar Nova Label</Label>
              </div>
              
              <div>
                <Label htmlFor="label-name">Nome *</Label>
                <Input
                  id="label-name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Ex: Urgente, Aguardando..."
                  onKeyPress={(e) => e.key === 'Enter' && createLabel()}
                />
              </div>

              <div>
                <Label htmlFor="label-description">Descrição</Label>
                <Textarea
                  id="label-description"
                  value={newLabelDescription}
                  onChange={(e) => setNewLabelDescription(e.target.value)}
                  placeholder="Descreva quando usar esta label..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="label-color">Cor</Label>
                  <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                    <SelectTrigger id="label-color">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: newLabelColor }}
                        />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_COLORS.map(({ name, color }) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border" 
                              style={{ backgroundColor: color }}
                            />
                            {name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="label-icon">Ícone</Label>
                  <Select value={newLabelIcon} onValueChange={setNewLabelIcon}>
                    <SelectTrigger id="label-icon">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = (LucideIcons as any)[newLabelIcon];
                          return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
                        })()}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_ICONS.map((iconName) => {
                        const IconComponent = (LucideIcons as any)[iconName];
                        return (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center gap-2">
                              {IconComponent && <IconComponent className="w-4 h-4" />}
                              {iconName}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={createLabel} 
                disabled={loading || !newLabelName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Label
              </Button>
            </div>

            {/* Labels da conversa atual */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Aplicar à Conversa</Label>
              <div className="grid grid-cols-2 gap-2">
                {labels.map(label => {
                  const isSelected = conversationLabelIds.includes(label.id);
                  return (
                    <div 
                      key={label.id} 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleLabel(label.id)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleLabel(label.id)}
                      />
                      <LabelBadge
                        name={label.name}
                        color={label.color}
                        icon={label.icon}
                        variant={isSelected ? "default" : "outline"}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLabel(label.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              {labels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma label criada ainda. Crie sua primeira label acima! 🏷️
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
