import React from 'react';
import { Bot, X, BarChart2, Lightbulb, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAssistant } from '@/hooks/ai-assistant';
import { PerformanceMonitor } from './PerformanceMonitor';
import { ContextualSuggestions } from './ContextualSuggestions';
import { CoachingInsights } from './CoachingInsights';
import { AlertsPanel } from './AlertsPanel';
import { AssistantTab } from '@/types/ai-assistant';

interface AssistantPanelProps {
  onClose: () => void;
}

export function AssistantPanel({ onClose }: AssistantPanelProps) {
  const { activeTab, setActiveTab, alertCount, urgentAlerts } = useAssistant();

  const tabs: {
    id: AssistantTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    urgent?: boolean;
  }[] = [
    {
      id: 'performance',
      label: 'Performance',
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      id: 'suggestions',
      label: 'Sugestões',
      icon: <Target className="h-4 w-4" />,
    },
    {
      id: 'tips',
      label: 'Dicas',
      icon: <Lightbulb className="h-4 w-4" />,
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: alertCount,
      urgent: urgentAlerts.length > 0,
    },
  ];

  return (
    <div
      className={cn(
        'w-[400px] max-h-[600px] rounded-lg shadow-2xl',
        'bg-background border border-border',
        'animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente IA</h3>
            <p className="text-xs text-muted-foreground">Monitorando seu atendimento</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AssistantTab)}
        className="flex flex-col"
      >
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-4 bg-muted/50">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="relative flex items-center gap-1.5 text-xs"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <Badge
                  variant={tab.urgent ? 'destructive' : 'secondary'}
                  className="ml-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="h-[480px]">
          <div className="p-4">
            <TabsContent value="performance" className="m-0">
              <PerformanceMonitor />
            </TabsContent>

            <TabsContent value="suggestions" className="m-0">
              <ContextualSuggestions />
            </TabsContent>

            <TabsContent value="tips" className="m-0">
              <CoachingInsights />
            </TabsContent>

            <TabsContent value="alerts" className="m-0">
              <AlertsPanel />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

export default AssistantPanel;
