import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopilotToggleProps {
  conversationId: string;
  onToggle?: (enabled: boolean) => void;
}

export function CopilotToggle({ conversationId, onToggle }: CopilotToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [conversationId]);

  const loadStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('ai_enabled')
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      const enabled = data?.ai_enabled || false;
      setIsEnabled(enabled);
      onToggle?.(enabled);
    } catch (error) {
      console.error('Erro ao carregar status do Copilot:', error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          ai_enabled: checked,
          ai_paused_at: checked ? null : new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;

      setIsEnabled(checked);
      onToggle?.(checked);
      toast.success(
        checked ? 'Copilot ativado' : 'Copilot desativado',
        {
          description: checked
            ? 'O Copilot voltará a responder automaticamente'
            : 'O Copilot não responderá mais nesta conversa',
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar Copilot:', error);
      toast.error('Erro ao atualizar o Copilot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
            <Sparkles
              className={`h-4 w-4 ${isEnabled ? 'text-violet-600' : 'text-gray-400'}`}
            />
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isLoading}
              className="data-[state=checked]:bg-violet-600"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isEnabled ? 'Desativar Copilot' : 'Ativar Copilot'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
