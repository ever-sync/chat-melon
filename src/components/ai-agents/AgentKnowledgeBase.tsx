import { useState } from 'react';
import { useAIAgentKnowledge, useCreateAgentKnowledge } from '@/hooks/ai-agents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  HelpCircle,
  Package,
  FileWarning,
  MessageSquare,
  Search,
  Upload,
  ThumbsUp,
} from 'lucide-react';
import { AIAgent, AIAgentKnowledge } from '@/types/ai-agents';
import { cn } from '@/lib/utils';

interface AgentKnowledgeBaseProps {
  agent: AIAgent;
}

const KNOWLEDGE_TYPES = {
  faq: { label: 'FAQ', icon: HelpCircle, color: 'bg-blue-100 text-blue-600' },
  document: { label: 'Documento', icon: FileText, color: 'bg-green-100 text-green-600' },
  product: { label: 'Produto', icon: Package, color: 'bg-purple-100 text-purple-600' },
  policy: { label: 'Política', icon: FileWarning, color: 'bg-orange-100 text-orange-600' },
  script: { label: 'Script', icon: MessageSquare, color: 'bg-pink-100 text-pink-600' },
};

export function AgentKnowledgeBase({ agent }: AgentKnowledgeBaseProps) {
  const { data: knowledge, isLoading } = useAIAgentKnowledge(agent.id);
  const createKnowledge = useCreateAgentKnowledge();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    knowledge_type: 'faq' as keyof typeof KNOWLEDGE_TYPES,
    title: '',
    content: '',
    summary: '',
    category: '',
    tags: '',
    priority: 1,
  });

  const handleCreate = async () => {
    await createKnowledge.mutateAsync({
      agent_id: agent.id,
      knowledge_type: formData.knowledge_type,
      title: formData.title,
      content: formData.content,
      summary: formData.summary || undefined,
      category: formData.category || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      priority: formData.priority,
      relevance_score: 1,
      is_enabled: true,
      use_in_training: true,
      metadata: {},
    });

    setShowAddDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      knowledge_type: 'faq',
      title: '',
      content: '',
      summary: '',
      category: '',
      tags: '',
      priority: 1,
    });
  };

  const filteredKnowledge = knowledge?.filter(k => {
    const matchesTab = activeTab === 'all' || k.knowledge_type === activeTab;
    const matchesSearch = !searchTerm ||
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando base de conhecimento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Base de Conhecimento
              </CardTitle>
              <CardDescription>
                Documentos, FAQs e informações que o agente pode usar nas respostas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Tabs */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na base de conhecimento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="document">Documentos</TabsTrigger>
                <TabsTrigger value="product">Produtos</TabsTrigger>
                <TabsTrigger value="policy">Políticas</TabsTrigger>
                <TabsTrigger value="script">Scripts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!filteredKnowledge?.length ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Base de conhecimento vazia'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente buscar por outros termos'
                  : 'Adicione FAQs, documentos e informações para o agente usar'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKnowledge.map((item) => {
                const typeConfig = KNOWLEDGE_TYPES[item.knowledge_type as keyof typeof KNOWLEDGE_TYPES];
                const Icon = typeConfig?.icon || FileText;

                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', typeConfig?.color || 'bg-gray-100')}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {typeConfig?.label || item.knowledge_type}
                            </Badge>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.summary || item.content.substring(0, 150)}...
                          </p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.slice(0, 5).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {item.helpful_votes}
                          </div>
                          <div className="text-xs">{item.times_used}x usado</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Conhecimento</DialogTitle>
            <DialogDescription>
              Adicione informações à base de conhecimento do agente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(KNOWLEDGE_TYPES) as [keyof typeof KNOWLEDGE_TYPES, typeof KNOWLEDGE_TYPES[keyof typeof KNOWLEDGE_TYPES]][]).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={type}
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center gap-1',
                        formData.knowledge_type === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      )}
                      onClick={() => setFormData({ ...formData, knowledge_type: type })}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Como funciona a garantia?"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Garantia, Pagamento, Envio"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="garantia, prazo, troca"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resumo (opcional)</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Resumo curto para busca rápida..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Conteúdo completo que o agente usará para responder..."
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(v) => setFormData({ ...formData, priority: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Muito Alta</SelectItem>
                  <SelectItem value="2">2 - Alta</SelectItem>
                  <SelectItem value="3">3 - Normal</SelectItem>
                  <SelectItem value="4">4 - Baixa</SelectItem>
                  <SelectItem value="5">5 - Muito Baixa</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Itens de maior prioridade são preferidos quando há conflito
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.title || !formData.content || createKnowledge.isPending}
            >
              {createKnowledge.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
