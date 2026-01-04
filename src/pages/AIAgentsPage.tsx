import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  MessageSquare,
  BarChart3,
  Settings2,
  Zap,
  BookOpen,
  Users,
  ArrowLeft,
  Rocket,
  Play,
  Pause,
  Activity,
} from 'lucide-react';
import {
  AgentList,
  AgentForm,
  AgentChannelConfig,
  AgentSkillsConfig,
  AgentKnowledgeBase,
  AgentMetrics,
  AgentHandoffRules,
} from '@/components/ai-agents';
import { useCreateAIAgent, useUpdateAIAgent, usePublishAIAgent, useActiveAIAgentSessions } from '@/hooks/ai-agents';
import { AIAgent, AIAgentFormData } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

type View = 'list' | 'create' | 'edit' | 'configure' | 'metrics';

export default function AIAgentsPage() {
  const [view, setView] = useState<View>('list');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [configTab, setConfigTab] = useState('channels');

  const createAgent = useCreateAIAgent();
  const updateAgent = useUpdateAIAgent();
  const publishAgent = usePublishAIAgent();
  const { data: activeSessions } = useActiveAIAgentSessions();

  const handleCreateAgent = async (data: AIAgentFormData) => {
    const result = await createAgent.mutateAsync(data);
    setSelectedAgent(result as AIAgent);
    setView('configure');
  };

  const handleUpdateAgent = async (data: AIAgentFormData) => {
    if (!selectedAgent) return;
    await updateAgent.mutateAsync({ id: selectedAgent.id, ...data });
    setView('configure');
  };

  const handleEditAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setView('edit');
  };

  const handleConfigureChannels = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setConfigTab('channels');
    setView('configure');
  };

  const handleViewMetrics = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setView('metrics');
  };

  const handleBack = () => {
    if (view === 'configure' || view === 'metrics') {
      setView('list');
      setSelectedAgent(null);
    } else if (view === 'edit') {
      setView('configure');
    } else {
      setView('list');
      setSelectedAgent(null);
    }
  };

  const totalActiveSessions = activeSessions?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              {view !== 'list' && (
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm">
                <Bot className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Agentes de IA
                  </h1>
                  {totalActiveSessions > 0 && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      {totalActiveSessions} ativo{totalActiveSessions > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500 mt-1 text-base">
                  {view === 'list' && 'Crie e gerencie agentes de IA para atendimento automatizado'}
                  {view === 'create' && 'Configure um novo agente de atendimento'}
                  {view === 'edit' && `Editando: ${selectedAgent?.name}`}
                  {view === 'configure' && `Configurando: ${selectedAgent?.name}`}
                  {view === 'metrics' && `Métricas: ${selectedAgent?.name}`}
                </p>
              </div>
            </div>
          </div>

          {view === 'configure' && selectedAgent && (
            <div className="flex items-center gap-2">
              {selectedAgent.status === 'draft' && (
                <Button
                  onClick={() => publishAgent.mutate(selectedAgent.id)}
                  disabled={publishAgent.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  {publishAgent.isPending ? 'Publicando...' : 'Publicar Agente'}
                </Button>
              )}
              {selectedAgent.status === 'active' && (
                <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                  <Play className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              )}
              {selectedAgent.status === 'paused' && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1">
                  <Pause className="h-3 w-3 mr-1" />
                  Pausado
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm min-h-[600px]">
          {/* View: Lista de Agentes */}
          {view === 'list' && (
            <div className="p-6">
              <AgentList
                onCreateAgent={() => setView('create')}
                onEditAgent={handleEditAgent}
                onViewMetrics={handleViewMetrics}
                onConfigureChannels={handleConfigureChannels}
              />
            </div>
          )}

          {/* View: Criar Agente */}
          {view === 'create' && (
            <div className="p-6">
              <AgentForm
                onSubmit={handleCreateAgent}
                onCancel={() => setView('list')}
                isSubmitting={createAgent.isPending}
              />
            </div>
          )}

          {/* View: Editar Agente */}
          {view === 'edit' && selectedAgent && (
            <div className="p-6">
              <AgentForm
                agent={selectedAgent}
                onSubmit={handleUpdateAgent}
                onCancel={() => setView('configure')}
                isSubmitting={updateAgent.isPending}
              />
            </div>
          )}

          {/* View: Configurar Agente */}
          {view === 'configure' && selectedAgent && (
            <Tabs value={configTab} onValueChange={setConfigTab} className="flex flex-col">
              <div className="border-b px-6 pt-4">
                <TabsList className="grid w-full max-w-4xl grid-cols-6 gap-2 bg-transparent">
                  <TabsTrigger
                    value="channels"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden md:inline">Canais</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="skills"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <Zap className="h-4 w-4" />
                    <span className="hidden md:inline">Skills</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="knowledge"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden md:inline">Conhecimento</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="handoff"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline">Handoff</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="metrics"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden md:inline">Métricas</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="settings"
                    className={cn(
                      'flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300'
                    )}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden md:inline">Configurações</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="channels" className="mt-0">
                  <AgentChannelConfig agent={selectedAgent} />
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <AgentSkillsConfig agent={selectedAgent} />
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0">
                  <AgentKnowledgeBase agent={selectedAgent} />
                </TabsContent>

                <TabsContent value="handoff" className="mt-0">
                  <AgentHandoffRules agent={selectedAgent} />
                </TabsContent>

                <TabsContent value="metrics" className="mt-0">
                  <AgentMetrics agent={selectedAgent} />
                </TabsContent>

                <TabsContent value="settings" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Configurações do Agente</h3>
                        <p className="text-sm text-muted-foreground">
                          Edite as configurações principais do agente
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setView('edit')}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Editar Configurações
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}

          {/* View: Métricas (fullscreen) */}
          {view === 'metrics' && selectedAgent && (
            <div className="p-6">
              <AgentMetrics agent={selectedAgent} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
