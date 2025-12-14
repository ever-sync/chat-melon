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
  BarChart3,
  Loader2,
  ArrowRight,
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
import { useToast } from '@/hooks/use-toast';
import { useChatbots, useChatbotTemplates } from '@/hooks/useChatbots';
import type { Chatbot, ChatbotTemplate } from '@/types/chatbot';

export default function ChatbotsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    chatbots,
    isLoading,
    createChatbot,
    updateChatbot,
    deleteChatbot,
    duplicateChatbot,
  } = useChatbots();
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

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    draft: 'Rascunho',
    active: 'Ativo',
    paused: 'Pausado',
    archived: 'Arquivado',
  };

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus fluxos de automação
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Chatbot
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chatbots..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {chatbots.filter((b) => b.status === 'active').length} ativos
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {chatbots.reduce((sum, b) => sum + b.total_executions, 0)} execuções
          </Badge>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : chatbots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">Nenhum chatbot criado</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Crie seu primeiro chatbot para automatizar o atendimento.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Chatbot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChatbots.map((bot) => (
            <Card key={bot.id} className="group hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{bot.name}</CardTitle>
                      <Badge className={statusColors[bot.status]} variant="secondary">
                        {statusLabels[bot.status]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/chatbots/${bot.id}`)}>
                        Editar
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
                        className="text-destructive"
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
              <CardContent>
                {bot.description && (
                  <CardDescription className="mb-4 line-clamp-2">
                    {bot.description}
                  </CardDescription>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-lg font-semibold">{bot.total_executions}</p>
                    <p className="text-xs text-muted-foreground">Execuções</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-lg font-semibold">{bot.successful_completions}</p>
                    <p className="text-xs text-muted-foreground">Completas</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-lg font-semibold">{bot.handoffs_count}</p>
                    <p className="text-xs text-muted-foreground">Handoffs</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>v{bot.version}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/chatbots/${bot.id}`)}
                    className="h-8"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Chatbot</DialogTitle>
            <DialogDescription>
              Crie um chatbot do zero ou use um template.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="blank">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blank">Em Branco</TabsTrigger>
              <TabsTrigger value="template">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="blank" className="space-y-4">
              <div>
                <Label>Nome do Chatbot</Label>
                <Input
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="Ex: Atendimento Inicial"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newBotDescription}
                  onChange={(e) => setNewBotDescription(e.target.value)}
                  placeholder="Descreva o objetivo do chatbot..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div>
                <Label>Nome do Chatbot</Label>
                <Input
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="Ex: Atendimento Inicial"
                />
              </div>

              <div className="grid gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <LayoutTemplate className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.is_system && (
                            <Badge variant="secondary" className="text-xs">
                              Sistema
                            </Badge>
                          )}
                          {template.category && (
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {template.usage_count} usos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newBotName.trim() || createChatbot.isPending || createFromTemplate.isPending}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Chatbot</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o chatbot "{selectedChatbot?.name}"? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteChatbot.isPending}
            >
              {deleteChatbot.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
