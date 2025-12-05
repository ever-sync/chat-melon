import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, Mail, Building2, Pencil, Trash2, User, MessageSquare, Briefcase, ChevronDown, ChevronUp, Upload, Download, Edit } from "lucide-react";
import { ContactAvatar } from "@/components/ContactAvatar";
import { useContacts } from "@/hooks/useContacts";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyQuery } from "@/hooks/useCompanyQuery";
import { useCompany } from "@/contexts/CompanyContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useCustomFields, useCustomFieldValues } from "@/hooks/useCustomFields";
import { CustomFieldInput } from "@/components/settings/CustomFieldInput";
import { Separator } from "@/components/ui/separator";
import { ContactImportDialog } from "@/components/contacts/ContactImportDialog";
import { ContactExportDialog } from "@/components/contacts/ContactExportDialog";
import { LeadScoreBadge } from "@/components/contacts/LeadScoreBadge";
import { useScoringRules } from "@/hooks/useScoringRules";
import { toast } from "sonner";
import { useSegments } from "@/hooks/useSegments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Componente para exibir detalhes expandidos do contato
function ContactDetails({ contactId }: { contactId: string }) {
  const { companyId } = useCompanyQuery();

  const { data: conversations = [] } = useQuery({
    queryKey: ["contact-conversations", contactId, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("company_id", companyId)
        .eq("contact_id", contactId)
        .order("last_message_time", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!companyId && !!contactId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["contact-deals", contactId, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("deals")
        .select("*, pipeline_stages(name, color)")
        .eq("company_id", companyId)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId && !!contactId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Conversas Recentes */}
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
                  <Badge variant={
                    conv.status === "waiting" ? "default" :
                      conv.status === "closed" ? "secondary" : "outline"
                  }>
                    {conv.status === "waiting" ? "Aguardando" :
                      conv.status === "active" ? "Ativo" :
                        conv.status === "closed" ? "Fechado" :
                          conv.status === "chatbot" ? "Chatbot" :
                            conv.status === "re_entry" ? "Reentrada" : conv.status}
                  </Badge>
                </div>
                {conv.last_message && (
                  <p className="text-muted-foreground truncate mt-1">{conv.last_message}</p>
                )}
                {conv.last_message_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conv.last_message_time), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Negócios Associados */}
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
                      backgroundColor: deal.pipeline_stages?.color || "#3B82F6",
                      color: "white"
                    }}
                  >
                    {deal.pipeline_stages?.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">
                    {formatCurrency(deal.value)}
                  </span>
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
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useContacts(selectedSegmentId || undefined);
  const { fields } = useCustomFields("contact");
  const { segments } = useSegments();
  const { calculateLeadScore } = useScoringRules();
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "score">("name");
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    company_cnpj: "",
  });
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});
  const { values: existingValues, saveValue } = useCustomFieldValues(editingContact?.id);

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
        name: contact.name || "",
        phone_number: contact.phone_number || "",
        company_cnpj: contact.company_cnpj || "",
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: "",
        phone_number: "",
        company_cnpj: "",
      });
      setCustomFieldsData({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.phone_number) {
      return;
    }

    let contactId: string;

    if (editingContact) {
      updateContact({ id: editingContact.id, ...formData });
      contactId = editingContact.id;
    } else {
      // Verificar se já existe contato com este telefone
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id, name, phone_number")
        .eq("phone_number", formData.phone_number)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingContact) {
        const confirmCreate = confirm(
          `Já existe um contato com este telefone:\n\n` +
          `Nome: ${existingContact.name || "Sem nome"}\n` +
          `Telefone: ${existingContact.phone_number}\n\n` +
          `Deseja criar mesmo assim?`
        );

        if (!confirmCreate) {
          setShowModal(false);
          return;
        }
      }

      // Create contact first, then get its ID
      const { data } = await supabase
        .from("contacts")
        .insert(formData as TablesInsert<"contacts">)
        .select()
        .single();

      if (data) {
        contactId = data.id;
      } else {
        return;
      }
    }

    // Save custom field values
    for (const [fieldId, value] of Object.entries(customFieldsData)) {
      if (value) {
        saveValue({ fieldId, entityId: contactId, value });
      }
    }

    setShowModal(false);
  };

  const handleDelete = (contactId: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?\n\nATENÇÃO: Todas as mensagens, negociações, tarefas e histórico relacionados serão excluídos permanentemente. Esta ação não pode ser desfeita.")) {
      deleteContact(contactId);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.phone_number?.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    if (sortBy === "score") {
      return (b.lead_score || 0) - (a.lead_score || 0);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
            <p className="text-muted-foreground">
              Gerencie seus contatos e informações de clientes
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {segments.length > 0 && (
                <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os contatos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os contatos</SelectItem>
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
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "score")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Ordenar por Nome</SelectItem>
                  <SelectItem value="score">Ordenar por Score</SelectItem>
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
                  {searchQuery ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <Collapsible
                    key={contact.id}
                    open={expandedContact === contact.id}
                    onOpenChange={() => setExpandedContact(
                      expandedContact === contact.id ? null : contact.id
                    )}
                  >
                    <div className="border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1">
                          <ContactAvatar
                            phoneNumber={contact.phone_number}
                            name={contact.name || undefined}
                            instanceName={currentCompany?.evolution_instance_name || ''}
                            size="md"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{contact.name || "Sem nome"}</p>
                              <LeadScoreBadge
                                score={contact.lead_score || 0}
                                breakdown={contact.score_breakdown as Record<string, number>}
                              />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone_number}
                              </span>
                              {contact.enrichment_status && (
                                <Badge
                                  variant={contact.enrichment_status === "enriched" ? "default" :
                                    contact.enrichment_status === "pending" ? "secondary" : "outline"}
                                  className="ml-2"
                                >
                                  {contact.enrichment_status === "enriched" ? "✅" :
                                    contact.enrichment_status === "pending" ? "⏳" : "❌"}
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
                                toast.success("Score recalculado!");
                              } catch (error) {
                                toast.error("Erro ao recalcular score");
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
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Editar Contato" : "Novo Contato"}
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
              <Label htmlFor="cnpj">CNPJ da Empresa</Label>
              <Input
                id="cnpj"
                value={formData.company_cnpj}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 14) value = value.slice(0, 14);

                  if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
                  if (value.length > 6) value = value.slice(0, 6) + "." + value.slice(6);
                  if (value.length > 10) value = value.slice(0, 10) + "/" + value.slice(10);
                  if (value.length > 15) value = value.slice(0, 15) + "-" + value.slice(15);

                  setFormData({ ...formData, company_cnpj: value });
                }}
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
                      value={customFieldsData[field.id] || ""}
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
            <Button onClick={handleSubmit}>
              {editingContact ? "Salvar" : "Criar"}
            </Button>
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