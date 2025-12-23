import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Pencil,
  Trash2,
  User,
  MessageSquare,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  Edit,
  Settings,
  Filter,
  Package,
  BookOpen,
  ShoppingBag,
  Gift,
  Wrench,
  Heart,
  Star,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Car,
  Home,
  Plane,
  FolderOpen,
} from 'lucide-react';
import { ContactAvatar } from '@/components/ContactAvatar';
import { useContacts } from '@/hooks/crm/useContacts';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyQuery } from '@/hooks/crm/useCompanyQuery';
import { useCompany } from '@/contexts/CompanyContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useCustomFields, useCustomFieldValues } from '@/hooks/useCustomFields';
import { CustomFieldInput } from '@/components/settings/CustomFieldInput';
import { Separator } from '@/components/ui/separator';
import { ContactImportDialog } from '@/components/contacts/ContactImportDialog';
import { ContactExportDialog } from '@/components/contacts/ContactExportDialog';
import { LeadScoreBadge } from '@/components/contacts/LeadScoreBadge';
import { useScoringRules } from '@/hooks/useScoringRules';
import { toast } from 'sonner';
import { useSegments } from '@/hooks/useSegments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContactSettings } from '@/hooks/useContactSettings';
import { useContactCategories } from '@/hooks/useContactCategories';
import { Textarea } from '@/components/ui/textarea';

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Package,
  BookOpen,
  ShoppingBag,
  Gift,
  Briefcase,
  Wrench,
  Heart,
  Star,
  Zap,
  Coffee,
  Music,
  Camera,
  Film,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Car,
  Home,
  Plane,
  Settings,
  FolderOpen,
  User,
};

const AVAILABLE_ICONS = [
  { name: 'User', label: 'Usuário' },
  { name: 'Briefcase', label: 'Maleta' },
  { name: 'Star', label: 'Estrela' },
  { name: 'Heart', label: 'Coração' },
  { name: 'Zap', label: 'Raio' },
  { name: 'ShoppingBag', label: 'Sacola' },
];

function ContactDetails({ contactId }: { contactId: string }) {
  const { companyId } = useCompanyQuery();

  const { data: conversations = [] } = useQuery({
    queryKey: ['contact-conversations', contactId, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .eq('contact_id', contactId)
        .order('last_message_time', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId && !!contactId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['contact-deals', contactId, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('deals')
        .select('*, pipeline_stages(name, color)')
        .eq('company_id', companyId)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!companyId && !!contactId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Conversas Recentes</h4>
          <Badge variant="secondary">{conversations.length}</Badge>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conversa registrada</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div key={conv.id} className="text-sm p-2 bg-muted/50 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{conv.contact_name}</span>
                  <Badge
                    variant={
                      conv.status === 'waiting'
                        ? 'default'
                        : conv.status === 'closed'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {conv.status === 'waiting'
                      ? 'Aguardando'
                      : conv.status === 'active'
                        ? 'Ativo'
                        : conv.status === 'closed'
                          ? 'Fechado'
                          : conv.status === 'chatbot'
                            ? 'Chatbot'
                            : conv.status === 're_entry'
                              ? 'Reentrada'
                              : conv.status}
                  </Badge>
                </div>
                {conv.last_message && (
                  <p className="text-muted-foreground truncate mt-1">{conv.last_message}</p>
                )}
                {conv.last_message_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conv.last_message_time), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-sm">Negócios Associados</h4>
          <Badge variant="secondary">{deals.length}</Badge>
        </div>
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum negócio associado</p>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => (
              <div key={deal.id} className="text-sm p-2 bg-muted/50 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{deal.title}</span>
                  <Badge
                    style={{
                      backgroundColor: deal.pipeline_stages?.color || '#3B82F6',
                      color: 'white',
                    }}
                  >
                    {deal.pipeline_stages?.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">{formatCurrency(deal.value)}</span>
                  <span className="text-xs text-muted-foreground">
                    {deal.probability}% de chance
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Contacts() {
  const { currentCompany } = useCompany();
  const { settings, updateSettings } = useContactSettings();
  const { categories, createCategory, updateCategory, deleteCategory } = useContactCategories();

  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useContacts(
    selectedSegmentId || undefined
  );
  const { fields, createField, updateField, deleteField } = useCustomFields('contact');
  const { segments } = useSegments();
  const { calculateLeadScore } = useScoringRules();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');

  // States related to Custom Fields & Categories Tabs
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#6366F1' });

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    label: '',
    field_type: 'text',
    options: '',
    is_required: false,
    default_value: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    company_cnpj: '',
    category_id: '',
  });

  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});
  const { values: existingValues, saveValue } = useCustomFieldValues(editingContact?.id);

  // Settings Config Form
  const [configForm, setConfigForm] = useState({
    entity_name: '',
    entity_name_plural: '',
    entity_icon: 'User',
  });
  const [configInitialized, setConfigInitialized] = useState(false);

  useEffect(() => {
    if (!configInitialized && settings?.entity_name) {
      setConfigForm({
        entity_name: settings.entity_name,
        entity_name_plural: settings.entity_name_plural,
        entity_icon: settings.entity_icon,
      });
      setConfigInitialized(true);
    }
  }, [settings, configInitialized]);

  useEffect(() => {
    if (editingContact && existingValues.length > 0) {
      const valuesMap: Record<string, string> = {};
      existingValues.forEach((val) => {
        valuesMap[val.custom_field_id] = val.value;
      });
      setCustomFieldsData(valuesMap);
    }
  }, [existingValues, editingContact]);

  const handleOpenModal = (contact?: any) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name || '',
        phone_number: contact.phone_number || '',
        company_cnpj: contact.company_cnpj || '',
        category_id: (contact as any).category_id || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        phone_number: '',
        company_cnpj: '',
        category_id: '',
      });
      setCustomFieldsData({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.phone_number) return;

    let contactId: string;

    if (editingContact) {
      updateContact({ id: editingContact.id, ...formData });
      contactId = editingContact.id;
    } else {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, name, phone_number')
        .eq('phone_number', formData.phone_number)
        .is('deleted_at', null)
        .maybeSingle();

      if (existingContact) {
        if (!confirm(`Já existe um contato com este telefone. Deseja criar mesmo assim?`)) return;
      }

      const { data } = await supabase
        .from('contacts')
        .insert(formData as TablesInsert<'contacts'>)
        .select()
        .single();

      if (data) contactId = data.id;
      else return;
    }

    for (const [fieldId, value] of Object.entries(customFieldsData)) {
      if (value) saveValue({ fieldId, entityId: contactId, value });
    }
    setShowModal(false);
  };

  const handleDelete = (contactId: string) => {
    if (confirm('Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.')) {
      deleteContact(contactId);
    }
  };

  const filteredContacts = contacts
    .filter((contact) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.phone_number?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.lead_score || 0) - (a.lead_score || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const entityName = settings?.entity_name || 'Contato';
  const entityNamePlural = settings?.entity_name_plural || 'Contatos';
  const EntityIcon = ICON_MAP[settings?.entity_icon || 'User'] || User;

  // Category Handlers
  const handleCategorySubmit = async () => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...categoryForm });
    } else {
      createCategory.mutate(categoryForm);
    }
    setShowCategoryModal(false);
  };

  // Field Handlers
  const handleFieldSubmit = async () => {
    const fieldData = {
      field_name: fieldForm.name,
      field_label: fieldForm.label,
      field_type: fieldForm.field_type as any,
      options: fieldForm.options ? fieldForm.options.split(',').map((s) => s.trim()) : null,
      is_required: fieldForm.is_required,
      default_value: fieldForm.default_value,
      display_order: editingField ? editingField.display_order : fields.length + 1,
      is_active: true,
    };

    if (editingField) {
      updateField({ id: editingField.id, ...fieldData });
    } else {
      createField(fieldData);
    }
    setShowFieldModal(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <EntityIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{entityNamePlural}</h1>
              <p className="text-muted-foreground">
                Gerencie seus {entityNamePlural.toLowerCase()} e informações
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo {entityName}
          </Button>
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="contacts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              {entityNamePlural}
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Categorias
            </TabsTrigger>
            <TabsTrigger
              value="custom_fields"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Campos Personalizados
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
            >
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Buscar ${entityNamePlural.toLowerCase()}...`}
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {segments.length > 0 && (
                    <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {segments.map((segment: any) => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name} ({segment.contact_count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button variant="outline" onClick={() => setIsExportOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'score')}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nome</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando...</p>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhum encontrado' : 'Nenhum cadastrado'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <Collapsible
                        key={contact.id}
                        open={expandedContact === contact.id}
                        onOpenChange={() =>
                          setExpandedContact(expandedContact === contact.id ? null : contact.id)
                        }
                      >
                        <div className="border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4 flex-1">
                              <ContactAvatar
                                phoneNumber={contact.phone_number}
                                name={contact.name || undefined}
                                instanceName={currentCompany?.evolution_instance_name || ''}
                                profilePictureUrl={contact.profile_pic_url}
                                size="md"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{contact.name || 'Sem nome'}</p>
                                  <LeadScoreBadge
                                    score={contact.lead_score || 0}
                                    breakdown={contact.score_breakdown as Record<string, number>}
                                  />
                                  {(contact as any).category_id &&
                                    (() => {
                                      const cat = categories.find(
                                        (c) => c.id === (contact as any).category_id
                                      );
                                      if (cat)
                                        return (
                                          <Badge
                                            style={{ backgroundColor: cat.color, color: 'white' }}
                                          >
                                            {cat.name}
                                          </Badge>
                                        );
                                      return null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone_number}
                                  </span>
                                  {contact.enrichment_status && (
                                    <Badge variant="outline" className="ml-2">
                                      {contact.enrichment_status === 'enriched'
                                        ? '✅'
                                        : contact.enrichment_status === 'pending'
                                          ? '⏳'
                                          : '❌'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await calculateLeadScore(contact.id);
                                    toast.success('Score recalculado!');
                                  } catch (error) {
                                    toast.error('Erro ao recalcular score');
                                  }
                                }}
                              >
                                Recalcular Score
                              </Button>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  {expandedContact === contact.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenModal(contact)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(contact.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="px-4 pb-4">
                              <ContactDetails contactId={contact.id} />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categorias</CardTitle>
                    <CardDescription>
                      Organize seus {entityNamePlural.toLowerCase()} em categorias
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: '', color: '#6366F1' });
                      setShowCategoryModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma categoria criada.
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryForm({ name: category.name, color: category.color });
                              setShowCategoryModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Excluir esta categoria?'))
                                deleteCategory.mutate(category.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom_fields" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campos Personalizados</CardTitle>
                    <CardDescription>
                      Crie campos extras para seus {entityNamePlural.toLowerCase()}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingField(null);
                      setFieldForm({
                        name: '',
                        label: '',
                        field_type: 'text',
                        options: '',
                        is_required: false,
                        default_value: '',
                      });
                      setShowFieldModal(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Campo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fields.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum campo personalizado.
                    </p>
                  ) : (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{field.field_type}</Badge>
                          <span className="font-medium">{field.field_label}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingField(field);
                              setFieldForm({
                                name: field.field_name,
                                label: field.field_label,
                                field_type: field.field_type as any,
                                options: field.options ? field.options.join(', ') : '',
                                is_required: field.is_required,
                                default_value: field.default_value || '',
                              });
                              setShowFieldModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Excluir este campo?')) deleteField(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Entidade</CardTitle>
                <CardDescription>
                  Personalize como esta entidade é chamada no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 max-w-xl">
                  <div className="grid gap-2">
                    <Label>Nome no Singular</Label>
                    <Input
                      value={configForm.entity_name}
                      onChange={(e) =>
                        setConfigForm((s) => ({ ...s, entity_name: e.target.value }))
                      }
                      placeholder="Ex: Cliente, Lead, Paciente"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome no Plural</Label>
                    <Input
                      value={configForm.entity_name_plural}
                      onChange={(e) =>
                        setConfigForm((s) => ({ ...s, entity_name_plural: e.target.value }))
                      }
                      placeholder="Ex: Clientes, Leads, Pacientes"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Ícone</Label>
                    <div className="grid grid-cols-6 gap-2 border p-4 rounded-lg">
                      {AVAILABLE_ICONS.map((icon) => {
                        const IconComp = ICON_MAP[icon.name] || Package;
                        return (
                          <button
                            key={icon.name}
                            onClick={() => setConfigForm((s) => ({ ...s, entity_icon: icon.name }))}
                            className={`flex flex-col items-center justify-center p-2 rounded hover:bg-muted transition-colors ${configForm.entity_icon === icon.name ? 'bg-primary/10 text-primary ring-2 ring-primary' : ''}`}
                          >
                            <IconComp className="h-6 w-6 mb-1" />
                            <span className="text-[10px] truncate w-full text-center">
                              {icon.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button onClick={() => updateSettings.mutate(configForm)}>
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? `Editar ${entityName}` : `Novo ${entityName}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+55 11 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="João Silva"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ da Empresa</Label>
              <Input
                id="cnpj"
                value={formData.company_cnpj}
                onChange={(e) => setFormData({ ...formData, company_cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            {fields.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Campos Personalizados</h3>
                  {fields.map((field) => (
                    <CustomFieldInput
                      key={field.id}
                      field={field}
                      value={customFieldsData[field.id] || ''}
                      onChange={(value) =>
                        setCustomFieldsData({ ...customFieldsData, [field.id]: value })
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>{editingContact ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  className="w-12 p-1 h-10"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCategorySubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Modal */}
      <Dialog open={showFieldModal} onOpenChange={setShowFieldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome do Campo (interno)</Label>
              <Input
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                placeholder="Ex: data_nascimento (sem espaços)"
                disabled={!!editingField}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rótulo (exibido)</Label>
              <Input
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                placeholder="Ex: Data de Nascimento"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={fieldForm.field_type}
                onValueChange={(v) => setFieldForm({ ...fieldForm, field_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(fieldForm.field_type === 'select' || fieldForm.field_type === 'multiselect') && (
              <div className="grid gap-2">
                <Label>Opções (separadas por vírgula)</Label>
                <Input
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder="Opção 1, Opção 2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleFieldSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={() => {
          window.location.reload();
        }}
      />

      <ContactExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        contacts={filteredContacts}
      />
    </MainLayout>
  );
}
