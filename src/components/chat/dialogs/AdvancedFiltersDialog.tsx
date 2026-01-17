import { useState, useEffect } from 'react';
import {
  Filter,
  Save,
  Star,
  Trash2,
  StarOff,
  User,
  Building2,
  Tag,
  Circle,
  Calendar,
  Clock,
  Image,
  Mail,
  MessageSquare,
  Wifi,
  CheckCircle2,
  ClipboardCheck,
  Timer,
  FileVideo,
  FileAudio,
  FileText,
  MessageCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatFilters } from '@/types/chatFilters';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { LabelBadge } from '@/components/chat/LabelBadge';
import { toast } from 'sonner';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { NotificationHistoryDialog } from './NotificationHistoryDialog';

type Sector = {
  id: string;
  name: string;
  color: string | null;
};

type Label = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
};

interface AdvancedFiltersDialogProps {
  filters: ChatFilters;
  onFiltersChange: (filters: Partial<ChatFilters>) => void;
  conversationCounts: {
    myAttendances: number;
    unread: number;
    waiting: number;
    reEntry: number;
    active: number;
    chatbot: number;
    closed: number;
  };
  onSelectConversation?: (conversationId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AdvancedFiltersDialog = ({
  filters,
  onFiltersChange,
  conversationCounts,
  onSelectConversation,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AdvancedFiltersDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const { currentCompany } = useCompany();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [userStatus, setUserStatus] = useState<string>('online');
  const { savedFilters, saveFilter, deleteFilter, setAsDefault } = useSavedFilters();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  useEffect(() => {
    if (open) {
      loadSectors();
      loadLabels();
      loadUserStatus();
    }
  }, [open, currentCompany?.id]);

  const loadLabels = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Erro ao carregar labels:', error);
    }
  };

  const loadSectors = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name');

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const loadUserStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_status')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setUserStatus(data.status);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const updateUserStatus = async (newStatus: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (!companyData) return;

      const { error } = await supabase.from('agent_status').upsert(
        {
          user_id: user.id,
          company_id: companyData.company_id,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,company_id',
        }
      );

      if (error) throw error;

      setUserStatus(newStatus);
      toast.success(`Seu status foi alterado para ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Não foi possível atualizar o status');
    }
  };

  const handleLabelChange = (value: string) => {
    const labelId = value === 'all' ? null : value;
    if (labelId) {
      const newLabels = filters.labels.includes(labelId)
        ? filters.labels.filter((l) => l !== labelId)
        : [...filters.labels, labelId];
      onFiltersChange({ labels: newLabels });
    } else {
      onFiltersChange({ labels: [] });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'invisible':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    onFiltersChange({
      dateRange: date 
        ? { start: date, end: filters.dateRange?.end || date }
        : filters.dateRange?.end 
          ? { start: filters.dateRange.end, end: filters.dateRange.end } 
          : null
    });
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onFiltersChange({
      dateRange: date
        ? { start: filters.dateRange?.start || date, end: date }
        : filters.dateRange?.start
          ? { start: filters.dateRange.start, end: filters.dateRange.start }
          : null
    });
    setShowEndCalendar(false);
  };

  const handleClearDates = () => {
    onFiltersChange({ dateRange: null });
  };

  const handleApply = () => {
    setOpen(false);
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;
    await saveFilter(filterName, filters, isDefault);
    setShowSaveDialog(false);
    setFilterName('');
    setIsDefault(false);
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.labels.length > 0 ||
    filters.hasUnread ||
    filters.assignedTo !== 'all' ||
    filters.dateRange !== null ||
    filters.search !== '' ||
    filters.lastMessageDate !== undefined ||
    filters.noResponseTime !== undefined ||
    filters.hasMedia !== undefined ||
    filters.mediaType !== undefined ||
    filters.channelType !== undefined ||
    filters.contactOnline === true ||
    filters.optedIn === true ||
    filters.hasTabulation === true ||
    filters.assignedTime !== undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Filtros e Configurações</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Personalize a visualização das suas conversas
                </p>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="filters">Filtros</TabsTrigger>
              <TabsTrigger value="saved">Salvos</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-6 py-4">
              {/* Filtros Básicos */}
              <div className="space-y-5 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Filter className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Filtros Básicos</h3>
                </div>

                {/* Atribuído */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Atribuído
                  </Label>
                  <Select
                    value={filters.assignedTo}
                    onValueChange={(value) => onFiltersChange({ assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Conversas</SelectItem>
                      <SelectItem value="me">
                        Meus Atendimentos{' '}
                        <Badge variant="secondary" className="ml-2">
                          {conversationCounts.myAttendances}
                        </Badge>
                      </SelectItem>
                      <SelectItem value="unassigned">
                        Não Atribuídos{' '}
                        <Badge variant="secondary" className="ml-2">
                          {conversationCounts.waiting}
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Setor
                  </Label>
                  <Select
                    value={filters.sector || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({ sector: value === 'all' ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Setores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Setores</SelectItem>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          <div className="flex items-center gap-2">
                            {sector.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: sector.color }}
                              />
                            )}
                            {sector.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Labels
                  </Label>
                  <Select
                    value={filters.labels.length > 0 ? filters.labels[0] : 'all'}
                    onValueChange={handleLabelChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as Labels" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">Todas as Labels</SelectItem>
                      {labels.map((label) => (
                        <SelectItem key={label.id} value={label.id}>
                          <LabelBadge name={label.name} color={label.color} icon={label.icon} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status do Usuário */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    Seu Status
                  </Label>
                  <Select value={userStatus} onValueChange={updateUserStatus}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(userStatus)}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Online
                        </div>
                      </SelectItem>
                      <SelectItem value="paused">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Pausado
                        </div>
                      </SelectItem>
                      <SelectItem value="invisible">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          Invisível
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filtros Avançados */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Filter className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Filtros Avançados</h3>
                </div>

                {/* Filtro de Data */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Período
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.dateRange?.start
                            ? format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Data início'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateRange?.start}
                          onSelect={handleStartDateSelect}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {filters.dateRange?.end 
                            ? format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR }) 
                            : 'Data fim'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateRange?.end}
                          onSelect={handleEndDateSelect}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>

                    {filters.dateRange && (
                      <Button variant="ghost" size="sm" onClick={handleClearDates} className="px-2">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Data da última mensagem */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Data da última mensagem
                  </Label>
                  <Select
                    value={filters.lastMessageDate || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        lastMessageDate:
                          value === 'all' ? undefined : (value as ChatFilters['lastMessageDate']),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="yesterday">Ontem</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tempo sem resposta */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Tempo sem resposta
                  </Label>
                  <Select
                    value={filters.noResponseTime || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        noResponseTime:
                          value === 'all' ? undefined : (value as ChatFilters['noResponseTime']),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="1h">&gt; 1 hora</SelectItem>
                      <SelectItem value="4h">&gt; 4 horas</SelectItem>
                      <SelectItem value="24h">&gt; 24 horas</SelectItem>
                      <SelectItem value="48h">&gt; 48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Contém mídia */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    Contém mídia
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.hasMedia === true ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ hasMedia: true })}
                    >
                      Sim
                    </Button>
                    <Button
                      variant={filters.hasMedia === false ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ hasMedia: false })}
                    >
                      Não
                    </Button>
                    <Button
                      variant={filters.hasMedia === undefined ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ hasMedia: undefined })}
                    >
                      Ambos
                    </Button>
                  </div>
                </div>

                {/* Tipo de Mídia Específico */}
                {filters.hasMedia === true && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Tipo de mídia
                    </Label>
                    <Select
                      value={filters.mediaType || 'all'}
                      onValueChange={(value) =>
                        onFiltersChange({
                          mediaType: value === 'all' ? undefined : (value as any),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Imagens
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <FileVideo className="h-4 w-4" />
                            Vídeos
                          </div>
                        </SelectItem>
                        <SelectItem value="audio">
                          <div className="flex items-center gap-2">
                            <FileAudio className="h-4 w-4" />
                            Áudios
                          </div>
                        </SelectItem>
                        <SelectItem value="document">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentos
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Canal de Comunicação */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Canal de comunicação
                  </Label>
                  <Select
                    value={filters.channelType || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        channelType: value === 'all' ? undefined : (value as any),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os canais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os canais</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="messenger">Messenger</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="widget">Widget</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tempo de Atribuição */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    Atribuído há
                  </Label>
                  <Select
                    value={filters.assignedTime || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        assignedTime: value === 'all' ? undefined : (value as any),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer tempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer tempo</SelectItem>
                      <SelectItem value="1h">Menos de 1 hora</SelectItem>
                      <SelectItem value="4h">Menos de 4 horas</SelectItem>
                      <SelectItem value="24h">Menos de 24 horas</SelectItem>
                      <SelectItem value="48h">Menos de 48 horas</SelectItem>
                      <SelectItem value="week">Menos de 1 semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apenas não lidas */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <Label htmlFor="unread-only" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Apenas não lidas
                  </Label>
                  <Switch
                    id="unread-only"
                    checked={filters.hasUnread}
                    onCheckedChange={(checked) => onFiltersChange({ hasUnread: checked })}
                  />
                </div>

                {/* Status Online do Contato */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <Label htmlFor="contact-online" className="flex items-center gap-2 cursor-pointer">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    Apenas contatos online
                  </Label>
                  <Switch
                    id="contact-online"
                    checked={filters.contactOnline === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ contactOnline: checked ? true : 'all' })
                    }
                  />
                </div>

                {/* Opt-in Status */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <Label htmlFor="opted-in" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    Apenas com opt-in
                  </Label>
                  <Switch
                    id="opted-in"
                    checked={filters.optedIn === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ optedIn: checked ? true : 'all' })
                    }
                  />
                </div>

                {/* Com Tabulação */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <Label htmlFor="has-tabulation" className="flex items-center gap-2 cursor-pointer">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Apenas com tabulação
                  </Label>
                  <Switch
                    id="has-tabulation"
                    checked={filters.hasTabulation === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ hasTabulation: checked ? true : 'all' })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 pt-6 mt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {hasActiveFilters ? 'Filtros ativos aplicados' : 'Nenhum filtro ativo'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleApply} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="space-y-4 py-4">
              {hasActiveFilters && (
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar filtros atuais
                </Button>
              )}

              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum filtro salvo ainda</p>
                  <p className="text-xs mt-1">Configure seus filtros e salve para uso rápido</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => {
                          onFiltersChange(filter.filters);
                          toast.success(`Filtro "${filter.name}" foi aplicado com sucesso`);
                        }}
                      >
                        {filter.is_default && (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        )}
                        <span className="font-medium">{filter.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsDefault(filter.id);
                          }}
                        >
                          {filter.is_default ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFilter(filter.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="py-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Visualize o histórico de notificações recentes
                </p>
                <NotificationHistoryDialog onSelectConversation={onSelectConversation} inModal />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog para salvar filtro */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nome do filtro</Label>
              <Input
                id="filter-name"
                placeholder="Ex: Urgentes não atendidos"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-default">Usar como padrão</Label>
              <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
