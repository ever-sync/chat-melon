import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { useAssistantSettings } from '@/hooks/ai-assistant';
import { useCompany } from '@/contexts/CompanyContext';

interface CopilotToggleProps {
  conversationId: string;
  onToggle?: (enabled: boolean) => void;
  isActive?: boolean;
}

export function CopilotToggle({ conversationId, onToggle, isActive = false }: CopilotToggleProps) {
  const { currentCompany } = useCompany();
  const { settings, updateSettings, ensureSettings, isUpdating, isLoading } = useAssistantSettings();

  // Garantir que settings existam quando company estiver disponível
  useEffect(() => {
    if (currentCompany?.id && !settings && !isLoading) {
      ensureSettings(currentCompany.id);
    }
  }, [currentCompany?.id, settings, isLoading, ensureSettings]);

  // Notificar o componente pai sobre o estado inicial
  useEffect(() => {
    if (settings) {
      onToggle?.(settings.is_enabled);
    }
  }, [settings?.is_enabled]);

  const handleClick = async () => {
    if (!currentCompany?.id) {
      toast.error('Erro ao atualizar configurações', {
        description: 'Empresa não encontrada',
      });
      return;
    }

    try {
      // Se settings não existir, criar primeiro
      let currentSettings = settings;
      if (!currentSettings) {
        currentSettings = await ensureSettings(currentCompany.id);
        if (!currentSettings) {
          throw new Error('Não foi possível criar configurações');
        }
      }

      const newState = !isActive;

      // Atualizar no banco de dados
      updateSettings({ is_enabled: newState });

      onToggle?.(newState);
      toast.success(
        newState ? 'Copiloto ativado' : 'Copiloto desativado',
        {
          description: newState
            ? 'Assistente de análise de conversas ativado'
            : 'Assistente de análise de conversas desativado',
        }
      );
    } catch (error) {
      console.error('Erro ao atualizar Copiloto:', error);
      toast.error('Erro ao atualizar o Copiloto');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isUpdating || isLoading}
      className={isActive ? 'bg-violet-600 hover:bg-violet-700' : 'hover:bg-primary/10'}
      title="Painel do Copiloto (Assistente de IA)"
    >
      <Sparkles className="w-5 h-5" />
    </Button>
  );
}
