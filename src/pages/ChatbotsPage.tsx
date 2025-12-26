import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Bot,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Search,
  LayoutTemplate,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  MessageSquare,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/ui/use-toast';
import { useChatbots, useChatbotTemplates } from '@/hooks/chat/useChatbots';
import type { Chatbot, ChatbotTemplate } from '@/types/chatbot';

export default function ChatbotsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { chatbots, isLoading, createChatbot, updateChatbot, deleteChatbot, duplicateChatbot } =
    useChatbots();
  const { templates, createFromTemplate } = useChatbotTemplates();

  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [newBotName, setNewBotName] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ChatbotTemplate | null>(null);

  const filteredChatbots = chatbots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(search.toLowerCase()) ||
      bot.description?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = chatbots.filter((b) => b.status === 'active').length;
  const totalExecutions = chatbots.reduce((sum, b) => sum + b.total_executions, 0);
  const totalCompletions = chatbots.reduce((sum, b) => sum + b.successful_completions, 0);

  const handleCreate = async () => {
    if (!newBotName.trim()) return;

    try {
      let newBot: Chatbot;
      if (selectedTemplate) {
        newBot = await createFromTemplate.mutateAsync({
          templateId: selectedTemplate.id,
          name: newBotName,
        });
      } else {
        newBot = await createChatbot.mutateAsync({
          name: newBotName,
          description: newBotDescription,
        });
      }
      setCreateDialogOpen(false);
      setNewBotName('');
      setNewBotDescription('');
      setSelectedTemplate(null);
      navigate(`/chatbots/${newBot.id}`);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o chatbot.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async (bot: Chatbot) => {
    try {
      const duplicate = await duplicateChatbot.mutateAsync(bot.id);
      toast({ title: 'Duplicado', description: 'Chatbot duplicado com sucesso.' });
      navigate(`/chatbots/${duplicate.id}`);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o chatbot.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedChatbot) return;

    try {
      await deleteChatbot.mutateAsync(selectedChatbot.id);
      setDeleteDialogOpen(false);
      setSelectedChatbot(null);
      toast({ title: 'Excluído', description: 'Chatbot excluído com sucesso.' });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o chatbot.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (bot: Chatbot) => {
    try {
      const newStatus = bot.status === 'active' ? 'paused' : 'active';
      await updateChatbot.mutateAsync({ id: bot.id, status: newStatus });
      toast({
        title: newStatus === 'active' ? 'Ativado' : 'Pausado',
        description: `Chatbot ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      });
    }
  };

  const statusConfig = {
    draft: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Rascunho', dot: 'bg-slate-400' },
    active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ativo', dot: 'bg-emerald-500' },
    paused: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pausado', dot: 'bg-amber-500' },
    archived: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Arquivado', dot: 'bg-red-500' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Hero Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-xl">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Chatbots</h1>
                  <p className="text-indigo-100">Automatize conversas com fluxos inteligentes</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Chatbot
            </Button>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute right-20 top-4 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute right-40 bottom-0 h-32 w-32 rounded-full bg-purple-400/20 blur-2xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Bots Ativos</p>
                <p className="mt-1 text-3xl font-bold text-emerald-700">{activeCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-emerald-100/50 transition-transform duration-500 group-hover:scale-150"></div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Execuções</p>
                <p className="mt-1 text-3xl font-bold text-blue-700">{totalExecutions}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                <Zap className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-blue-100/50 transition-transform duration-500 group-hover:scale-150"></div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-violet-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-600">Conversas Concluídas</p>
                <p className="mt-1 text-3xl font-bold text-violet-700">{totalCompletions}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform duration-300 group-hover:scale-110">
                <MessageSquare className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-violet-100/50 transition-transform duration-500 group-hover:scale-150"></div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar chatbots por nome ou descrição..."
              className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-base shadow-sm transition-all duration-200 focus:border-indigo-300 focus:ring-indigo-200"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500">Carregando chatbots...</p>
            </div>
          </div>
        ) : chatbots.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 p-12">
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              {/* Animated Robot Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20"></div>
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl">
                  <Bot className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>

              <h3 className="mb-2 text-2xl font-bold text-slate-800">
                Crie seu primeiro chatbot
              </h3>
              <p className="mb-6 max-w-md text-slate-500">
                Automatize o atendimento com fluxos de conversa inteligentes. 
                Reduza tempo de resposta e aumente a satisfação dos clientes.
              </p>

              {/* Feature Pills */}
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
                  🚀 Atendimento 24/7
                </span>
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
                  ⚡ Respostas Instantâneas
                </span>
                <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
                  📊 Análises Detalhadas
                </span>
              </div>

              <Button 
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold px-8"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Primeiro Chatbot
              </Button>
            </div>

            {/* Background decoration */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-100/50 blur-3xl"></div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredChatbots.map((bot) => (
              <Card 
                key={bot.id} 
                className="group relative overflow-hidden border-slate-200/80 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1"
              >
                {/* Status indicator line */}
                <div className={`absolute left-0 top-0 h-full w-1 ${bot.status === 'active' ? 'bg-emerald-500' : bot.status === 'paused' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                
                <CardHeader className="pb-3 pl-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 ${
                        bot.status === 'active' 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200' 
                          : 'bg-slate-100'
                      }`}>
                        <Bot className={`h-6 w-6 ${bot.status === 'active' ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">{bot.name}</CardTitle>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusConfig[bot.status].dot} ${bot.status === 'active' ? 'animate-pulse' : ''}`}></span>
                          <span className={`text-xs font-medium ${statusConfig[bot.status].color.split(' ')[1]}`}>
                            {statusConfig[bot.status].label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => navigate(`/chatbots/${bot.id}`)}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Editar Fluxo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(bot)}>
                          {bot.status === 'active' ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(bot)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => {
                            setSelectedChatbot(bot);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pl-5">
                  {bot.description && (
                    <CardDescription className="mb-4 line-clamp-2 text-slate-500">
                      {bot.description}
                    </CardDescription>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-slate-50 p-3 text-center transition-colors hover:bg-slate-100">
                      <p className="text-xl font-bold text-slate-800">{bot.total_executions}</p>
                      <p className="text-xs text-slate-500">Execuções</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-center transition-colors hover:bg-emerald-100">
                      <p className="text-xl font-bold text-emerald-700">{bot.successful_completions}</p>
                      <p className="text-xs text-emerald-600">Sucesso</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center transition-colors hover:bg-amber-100">
                      <p className="text-xl font-bold text-amber-700">{bot.handoffs_count}</p>
                      <p className="text-xs text-amber-600">Handoffs</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">v{bot.version}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/chatbots/${bot.id}`)}
                      className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      Editar
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Novo Chatbot</DialogTitle>
                  <DialogDescription>Crie um chatbot do zero ou use um template.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="blank" className="mt-4">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="blank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Em Branco
                </TabsTrigger>
                <TabsTrigger value="template" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Templates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="blank" className="mt-4 space-y-4">
                <div>
                  <Label className="text-slate-700">Nome do Chatbot</Label>
                  <Input
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="Ex: Atendimento Inicial"
                    className="mt-1.5 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">Descrição (opcional)</Label>
                  <Textarea
                    value={newBotDescription}
                    onChange={(e) => setNewBotDescription(e.target.value)}
                    placeholder="Descreva o objetivo do chatbot..."
                    rows={3}
                    className="mt-1.5 rounded-xl"
                  />
                </div>
              </TabsContent>

              <TabsContent value="template" className="mt-4 space-y-4">
                <div>
                  <Label className="text-slate-700">Nome do Chatbot</Label>
                  <Input
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="Ex: Atendimento Inicial"
                    className="mt-1.5 rounded-xl"
                  />
                </div>

                <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <LayoutTemplate className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhum template disponível</p>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          selectedTemplate?.id === template.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            selectedTemplate?.id === template.id ? 'bg-indigo-500' : 'bg-slate-100'
                          }`}>
                            <LayoutTemplate className={`h-5 w-5 ${selectedTemplate?.id === template.id ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800">{template.name}</h4>
                              {template.is_system && (
                                <Badge variant="secondary" className="text-xs bg-slate-100">
                                  Sistema
                                </Badge>
                              )}
                              {template.category && (
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {template.usage_count} usos
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !newBotName.trim() || createChatbot.isPending || createFromTemplate.isPending
                }
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {(createChatbot.isPending || createFromTemplate.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Chatbot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <DialogTitle>Excluir Chatbot</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                Tem certeza que deseja excluir o chatbot <strong>"{selectedChatbot?.name}"</strong>? 
                Esta ação não pode ser desfeita e todos os dados serão perdidos.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={deleteChatbot.isPending}
                className="rounded-xl"
              >
                {deleteChatbot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
