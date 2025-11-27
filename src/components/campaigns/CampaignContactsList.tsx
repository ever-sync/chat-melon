import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, XCircle, Clock, MessageSquare, MoreVertical, Eye, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCampaigns } from "@/hooks/useCampaigns";

interface CampaignContactsListProps {
  campaignId: string;
}

export function CampaignContactsList({ campaignId }: CampaignContactsListProps) {
  const navigate = useNavigate();
  const { resendToContact } = useCampaigns();
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`campaign_contacts_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_contacts',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery, activeTab]);

  const fetchContacts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('campaign_contacts')
      .select('*, contacts(id, name, phone_number)')
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching campaign contacts:', error);
      setIsLoading(false);
      return;
    }

    setContacts(data || []);
    setIsLoading(false);
  };

  const filterContacts = () => {
    let filtered = [...contacts];

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.contacts?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contacts?.phone_number?.includes(searchQuery)
      );
    }

    setFilteredContacts(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: any; label: string; variant: any }> = {
      pending: { icon: Clock, label: 'Pendente', variant: 'secondary' },
      sent: { icon: CheckCircle2, label: 'Enviada', variant: 'default' },
      delivered: { icon: CheckCircle2, label: 'Entregue', variant: 'default' },
      read: { icon: Eye, label: 'Lida', variant: 'default' },
      replied: { icon: MessageSquare, label: 'Respondeu', variant: 'default' },
      failed: { icon: XCircle, label: 'Falhou', variant: 'destructive' },
    };

    const { icon: Icon, label, variant } = config[status] || config.pending;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleViewConversation = async (contactId: string) => {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contactId)
      .maybeSingle();

    if (data) {
      navigate(`/chat?conversation=${data.id}`);
    } else {
      toast.error('Conversa não encontrada');
    }
  };

  const handleResend = async (contactId: string) => {
    try {
      await resendToContact.mutateAsync({ campaignId, contactId });
    } catch (error) {
      console.error('Error resending:', error);
    }
  };

  const handleRemove = async (campaignContactId: string) => {
    if (!confirm('Remover este contato da campanha?')) return;

    const { error } = await supabase
      .from('campaign_contacts')
      .delete()
      .eq('id', campaignContactId);

    if (error) {
      toast.error('Erro ao remover contato');
    } else {
      toast.success('Contato removido da campanha');
      fetchContacts();
    }
  };

  const getTabCount = (status: string) => {
    if (status === 'all') return contacts.length;
    return contacts.filter(c => c.status === status).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📝 Detalhes dos Contatos</CardTitle>
          <Input
            placeholder="Buscar contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">
              Todas ({getTabCount('all')})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Enviadas ({getTabCount('sent')})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Entregues ({getTabCount('delivered')})
            </TabsTrigger>
            <TabsTrigger value="read">
              Lidas ({getTabCount('read')})
            </TabsTrigger>
            <TabsTrigger value="replied">
              Responderam ({getTabCount('replied')})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Falharam ({getTabCount('failed')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando contatos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum contato encontrado
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enviada em</TableHead>
                      <TableHead>Entregue em</TableHead>
                      <TableHead>Lida em</TableHead>
                      <TableHead>Erro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contact.contacts?.name || 'Sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{contact.contacts?.phone_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(contact.status)}</TableCell>
                        <TableCell>
                          {contact.sent_at ? new Date(contact.sent_at).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          {contact.delivered_at ? new Date(contact.delivered_at).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          {contact.read_at ? new Date(contact.read_at).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          {contact.error_message && (
                            <span className="text-xs text-destructive">{contact.error_message}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {contact.status === 'replied' && (
                                <DropdownMenuItem onClick={() => handleViewConversation(contact.contact_id)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Ver conversa
                                </DropdownMenuItem>
                              )}
                              {contact.status === 'failed' && (
                                <DropdownMenuItem onClick={() => handleResend(contact.contact_id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reenviar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleRemove(contact.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
