import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
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

const COPILOT_STORAGE_KEY = 'copilot_enabled';

export function CopilotToggle({ conversationId, onToggle }: CopilotToggleProps) {
  const [isEnabled, setIsEnabled] = useState(() => {
    // Carregar estado do localStorage
    const stored = localStorage.getItem(COPILOT_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Notificar o componente pai sobre o estado inicial
    onToggle?.(isEnabled);
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      // Salvar no localStorage (configuração global do usuário)
      localStorage.setItem(COPILOT_STORAGE_KEY, checked.toString());

      setIsEnabled(checked);
      onToggle?.(checked);
      toast.success(
        checked ? 'Copiloto ativado' : 'Copiloto desativado',
        {
          description: checked
            ? 'Assistente de análise de conversas ativado'
            : 'Assistente de análise de conversas desativado',
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar Copiloto:', error);
      toast.error('Erro ao atualizar o Copiloto');
      // Reverter o estado em caso de erro
      localStorage.setItem(COPILOT_STORAGE_KEY, (!checked).toString());
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
            {isEnabled ? 'Desativar Copiloto' : 'Ativar Copiloto'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
