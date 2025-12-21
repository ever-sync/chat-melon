import { useState, useEffect } from 'react';
import {
  X,
  Ban,
  Archive,
  Copy,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Pencil,
  Save,
  FileText,
  Image,
  FileAudio,
  DollarSign,
  CheckSquare,
  Mail,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactAvatar } from '@/components/ContactAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import type { Conversation } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { LabelBadge } from './LabelBadge';
import { LabelsManager } from './LabelsManager';
import { EmailComposer } from '@/components/crm/EmailComposer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
// CRM Integration
import { useDeals, type Deal } from '@/hooks/crm/useDeals';
import { usePipelines } from '@/hooks/crm/usePipelines';
import { DealModal } from '@/components/crm/DealModal';
import { DealDetail } from '@/components/crm/DealDetail';
import { useContactCRMData } from '@/hooks/crm/useContactCRMData';

type ContactDetailPanelProps = {
  conversation: Conversation;
  onClose: () => void;
  onConversationUpdated: () => void;
};

const ContactDetailPanel = ({
  conversation,
  onClose,
  onConversationUpdated,
}: ContactDetailPanelProps) => {
  const { currentCompany } = useCompany();
  const [isOnline, setIsOnline] = useState(conversation.is_online || false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [contactData, setContactData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  // CRM Integration Hook
  const { data: crmMetrics } = useContactCRMData(conversation.contact_id);
  const [labels, setLabels] = useState<any[]>([]);
  const [showLabelsManager, setShowLabelsManager] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // CRM Integration - useDeals hook instead of manual loading
  const { pipelines, defaultPipeline } = usePipelines();
  const {
    deals,
    createDeal,
    isLoading: isDealsLoading,
  } = useDeals(undefined, conversation.contact_id);

  // Deal Modal & Detail states
  const [showDealModal, setShowDealModal] = useState(false);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();

  // Seções colapsáveis
  const [openSections, setOpenSections] = useState({
    deals: true,
    tasks: true,
    notes: true,
    files: false,
  });

  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'document' | 'audio'>('all');

  useEffect(() => {
    if (conversation.contact_id) {
      loadContactData();
      loadTasks();
      loadNotes();
      loadMediaFiles();
      loadLabels();
    }
  }, [conversation.contact_id]);

  const loadContactData = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', conversation.contact_id)
        .single();

      if (error) throw error;
      setContactData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do contato:', error);
    }
  };

  // loadDeals removed - now using useDeals hook

  const loadTasks = async () => {
    if (!currentCompany?.id || !conversation.contact_id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('contact_id', conversation.contact_id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const loadNotes = async () => {
    if (!currentCompany?.id || !conversation.contact_id) return;

    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .select(
          `
          *,
          profiles(full_name)
        `
        )
        .eq('company_id', currentCompany.id)
        .eq('contact_id', conversation.contact_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    }
  };

  const loadMediaFiles = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, media_url, media_type, message_type, timestamp, content')
        .eq('conversation_id', conversation.id)
        .not('media_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    }
  };

  const loadLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_labels')
        .select(
          `
          labels(id, name, color, icon)
        `
        )
        .eq('conversation_id', conversation.id);

      if (error) throw error;
      setLabels(data?.map((item: any) => item.labels) || []);
    } catch (error) {
      console.error('Erro ao carregar labels:', error);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(conversation.contact_number);
    toast.success('Telefone copiado!');
  };

  const handleUpdateContact = async (field: string, value: string) => {
    if (!contactData) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value })
        .eq('id', conversation.contact_id);

      if (error) throw error;

      setContactData({ ...contactData, [field]: value });
      toast.success('Contato atualizado!');

      if (field === 'name') {
        setIsEditingName(false);
        onConversationUpdated();
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentCompany?.id || !conversation.contact_id) return;

    try {
      const { data, error } = await supabase.rpc('create_contact_note', {
        p_contact_id: conversation.contact_id,
        p_note: newNote,
      });

      if (error) throw error;

      setNewNote('');
      loadNotes();
      toast.success('Nota adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      loadTasks();
      toast.success('Tarefa concluída!');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      toast.error('Erro ao concluir tarefa');
    }
  };

  const handleBlockContact = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !currentCompany?.id) return;

      const { error } = await supabase.from('blocked_contacts').insert({
        company_id: currentCompany.id,
        user_id: user.id,
        blocked_number: conversation.contact_number,
        reason: 'Bloqueado via painel de detalhes',
      });

      if (error) throw error;

      toast.success('Contato bloqueado!');
      onClose();
    } catch (error) {
      console.error('Erro ao bloquear contato:', error);
      toast.error('Erro ao bloquear');
    }
  };

  const handleArchiveConversation = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'closed' })
        .eq('id', conversation.id);

      if (error) throw error;

      toast.success('Conversa arquivada!');
      onConversationUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast.error('Erro ao arquivar');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredMedia = mediaFiles.filter((file) => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'image') return file.message_type === 'image';
    if (mediaFilter === 'document') return file.message_type === 'document';
    if (mediaFilter === 'audio') return file.message_type === 'audio';
    return true;
  });

  return (
    <div className="w-96 border-l border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Detalhes</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 📋 Informações Básicas */}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <ContactAvatar
                phoneNumber={conversation.contact_number}
                name={conversation.contact_name}
                instanceName={currentCompany?.evolution_instance_name || ''}
                profilePictureUrl={conversation.profile_pic_url}
                size="xl"
                showOnline={true}
                isOnline={isOnline}
              />

              {/* Nome editável */}
              <div className="text-center w-full">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={contactData?.name || conversation.contact_name}
                      onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                      className="text-center"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdateContact('name', contactData?.name)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="font-semibold">
                      {contactData?.name || conversation.contact_name}
                    </h4>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditingName(true)}
                      className="h-6 w-6"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Telefone com copiar */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{conversation.contact_number}</span>
                  <Button size="icon" variant="ghost" onClick={handleCopyPhone} className="h-6 w-6">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Informações automáticas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {contactData?.created_at && (
                <div>
                  <span className="text-muted-foreground">Cliente desde:</span>
                  <p className="font-medium">
                    {format(new Date(contactData.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {conversation.last_message_time && (
                <div>
                  <span className="text-muted-foreground">Última interação:</span>
                  <p className="font-medium">
                    {format(new Date(conversation.last_message_time), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Total conversas:</span>
                <p className="font-medium">{crmMetrics?.total_conversations || 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total gasto:</span>
                <p className="font-medium text-green-600">
                  {formatCurrency(Number(crmMetrics?.total_spent || 0))}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 🎯 Ações Rápidas */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => setShowEmailComposer(true)}
              disabled={!contactData?.enrichment_data?.email}
            >
              <Mail className="w-4 h-4 mb-1" />
              <span className="text-xs">Email</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 text-destructive hover:text-destructive"
              onClick={handleBlockContact}
            >
              <Ban className="w-4 h-4 mb-1" />
              <span className="text-xs">Bloquear</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2"
              onClick={handleArchiveConversation}
            >
              <Archive className="w-4 h-4 mb-1" />
              <span className="text-xs">Arquivar</span>
            </Button>
          </div>

          <Separator />

          {/* 🏢 Dados da Empresa */}
          {contactData?.company_cnpj && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Dados da Empresa</h4>
                  <Badge
                    variant={
                      contactData.enrichment_status === 'enriched'
                        ? 'default'
                        : contactData.enrichment_status === 'pending'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {contactData.enrichment_status === 'enriched'
                      ? '✅ Enriquecido'
                      : contactData.enrichment_status === 'pending'
                        ? '⏳ Pendente'
                        : '❌ Não encontrado'}
                  </Badge>
                </div>

                {contactData.company_data?.razao_social && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">CNPJ:</span>
                      <p className="font-medium">{contactData.company_cnpj}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Razão Social:</span>
                      <p className="font-medium">{contactData.company_data.razao_social}</p>
                    </div>
                    {contactData.company_data.nome_fantasia && (
                      <div>
                        <span className="text-muted-foreground">Nome Fantasia:</span>
                        <p className="font-medium">{contactData.company_data.nome_fantasia}</p>
                      </div>
                    )}
                    {contactData.company_data.situacao_cadastral && (
                      <div>
                        <span className="text-muted-foreground">Situação:</span>
                        <Badge
                          variant={
                            contactData.company_data.situacao_cadastral === 'ATIVA'
                              ? 'default'
                              : 'destructive'
                          }
                          className="ml-2"
                        >
                          {contactData.company_data.situacao_cadastral}
                        </Badge>
                      </div>
                    )}
                    {contactData.company_data.endereco && (
                      <div>
                        <span className="text-muted-foreground">Endereço:</span>
                        <p className="font-medium text-xs">{contactData.company_data.endereco}</p>
                      </div>
                    )}
                    {contactData.company_data.cnae_descricao && (
                      <div>
                        <span className="text-muted-foreground">CNAE:</span>
                        <p className="font-medium text-xs">
                          {contactData.company_data.cnae_descricao}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.functions.invoke('enrich-contact', {
                        body: { contact_id: conversation.contact_id },
                      });
                      if (error) throw error;
                      toast.success('Buscando dados da empresa...');
                      setTimeout(loadContactData, 2000);
                    } catch (error) {
                      console.error(error);
                      toast.error('Erro ao buscar dados');
                    }
                  }}
                >
                  🔄 Atualizar dados
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* 🏷️ Etiquetas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold flex items-center gap-2">🏷️ Etiquetas</h5>
              <Button size="sm" variant="ghost" onClick={() => setShowLabelsManager(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {labels.length > 0 ? (
                labels.map((label) => (
                  <LabelBadge
                    key={label.id}
                    name={label.name}
                    color={label.color}
                    icon={label.icon}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma etiqueta</p>
              )}
            </div>
          </div>

          <Separator />

          {/* 💰 Negócios */}
          <Collapsible
            open={openSections.deals}
            onOpenChange={(open) => setOpenSections({ ...openSections, deals: open })}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Negócios ({deals.length})
              </h5>
              {openSections.deals ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {isDealsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>
              ) : deals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum negócio encontrado
                </p>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 border border-border rounded-xl space-y-2 cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => {
                      setViewingDeal(deal);
                      setShowDealDetail(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {deal.title}
                      </p>
                      <Badge
                        style={{ backgroundColor: deal.pipeline_stages?.color }}
                        className="text-xs text-white"
                      >
                        {deal.pipeline_stages?.name}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600 font-bold">
                        {formatCurrency(deal.value || 0)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDeal(deal);
                          setShowDealDetail(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950"
                onClick={() => {
                  setEditingDeal(undefined); // Reset editing mode
                  setShowDealModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Negócio deste Chat
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* ✅ Tarefas */}
          <Collapsible
            open={openSections.tasks}
            onOpenChange={(open) => setOpenSections({ ...openSections, tasks: open })}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tarefas ({tasks.length})
              </h5>
              {openSections.tasks ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 p-2 border border-border rounded-lg"
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleCompleteTask(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.due_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 📝 Notas */}
          <Collapsible
            open={openSections.notes}
            onOpenChange={(open) => setOpenSections({ ...openSections, notes: open })}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas ({notes.length})
              </h5>
              {openSections.notes ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Adicionar nota..."
                  className="min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="w-full"
                >
                  Adicionar Nota
                </Button>
              </div>
              {notes.map((note) => (
                <div key={note.id} className="p-2 border border-border rounded-lg space-y-1">
                  <p className="text-sm">{note.note}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{note.profiles?.full_name || 'Desconhecido'}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 📎 Arquivos */}
          <Collapsible
            open={openSections.files}
            onOpenChange={(open) => setOpenSections({ ...openSections, files: open })}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h5 className="text-sm font-semibold">📎 Arquivos ({mediaFiles.length})</h5>
              {openSections.files ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mediaFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setMediaFilter('all')}
                  className="flex-1"
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={mediaFilter === 'image' ? 'default' : 'outline'}
                  onClick={() => setMediaFilter('image')}
                  className="flex-1"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={mediaFilter === 'document' ? 'default' : 'outline'}
                  onClick={() => setMediaFilter('document')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={mediaFilter === 'audio' ? 'default' : 'outline'}
                  onClick={() => setMediaFilter('audio')}
                  className="flex-1"
                >
                  <FileAudio className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {filteredMedia.map((file) => (
                  <button
                    key={file.id}
                    className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    onClick={() => window.open(file.media_url, '_blank')}
                  >
                    {file.message_type === 'image' ? (
                      <img
                        src={file.media_url}
                        alt="Media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        {file.message_type === 'document' && <FileText className="w-6 h-6" />}
                        {file.message_type === 'audio' && <FileAudio className="w-6 h-6" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <LabelsManager
        conversationId={conversation.id}
        onLabelsChange={loadLabels}
        open={showLabelsManager}
        onOpenChange={setShowLabelsManager}
      />

      {showEmailComposer && contactData?.enrichment_data?.email && (
        <EmailComposer
          open={showEmailComposer}
          onOpenChange={setShowEmailComposer}
          toEmail={contactData.enrichment_data.email}
          contactId={conversation.contact_id}
          contactName={conversation.contact_name}
        />
      )}

      {/* CRM Modals */}
      <DealModal
        open={showDealModal}
        onOpenChange={setShowDealModal}
        deal={editingDeal}
        pipelineId={defaultPipeline?.id}
        defaultContactId={conversation.contact_id}
        onSubmit={(data) => {
          createDeal.mutate({
            ...data,
            created_from_conversation_id: conversation.id,
            source: 'chat',
          } as any);
          setShowDealModal(false);
        }}
      />

      <DealDetail
        deal={viewingDeal}
        open={showDealDetail}
        onOpenChange={setShowDealDetail}
        onEdit={(deal) => {
          setEditingDeal(deal);
          setShowDealDetail(false);
          setShowDealModal(true);
        }}
      />
    </div>
  );
};

export default ContactDetailPanel;
