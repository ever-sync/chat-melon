import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Building2, Edit, Trash2, QrCode, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { EvolutionStatusBadge } from '@/components/evolution/EvolutionStatusBadge';
import { EvolutionQRCodeModal } from '@/components/evolution/EvolutionQRCodeModal';
import { Checkbox } from '@/components/ui/checkbox';

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface EvolutionSettings {
  instance_status: string;
  qr_code: string | null;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [evolutionSettings, setEvolutionSettings] = useState<Record<string, EvolutionSettings>>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    evolutionApiUrl: '',
    evolutionApiKey: '',
    createEvolutionInstance: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);

      // Buscar configurações Evolution para cada empresa
      if (data && data.length > 0) {
        const { data: evolutionData } = await supabase
          .from('evolution_settings')
          .select('company_id, instance_status, qr_code')
          .in(
            'company_id',
            data.map((c) => c.id)
          );

        const settingsMap: Record<string, EvolutionSettings> = {};
        evolutionData?.forEach((setting) => {
          settingsMap[setting.company_id] = {
            instance_status: setting.instance_status,
            qr_code: setting.qr_code,
          };
        });
        setEvolutionSettings(settingsMap);
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            cnpj: formData.cnpj,
            email: formData.email,
            phone: formData.phone,
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success('Empresa atualizada com sucesso');
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            cnpj: formData.cnpj,
            email: formData.email,
            phone: formData.phone,
            created_by: user.id,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Criar instância Evolution se checkbox marcado
        if (formData.createEvolutionInstance && newCompany) {
          const instanceName = formData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_');

          const {
            data: { session },
          } = await supabase.auth.getSession();

          const evolutionResponse = await supabase.functions.invoke('evolution-instance-manager', {
            body: {
              action: 'create',
              companyId: newCompany.id,
              evolutionApiUrl: formData.evolutionApiUrl,
              evolutionApiKey: formData.evolutionApiKey,
              instanceName,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (evolutionResponse.error) {
            console.error('Erro ao criar instância Evolution:', evolutionResponse.error);
            toast.error('Empresa criada, mas erro ao criar instância Evolution');
          } else {
            toast.success('Empresa criada com sucesso!');
            if (evolutionResponse.data?.qrCode) {
              setShowQRModal(newCompany.id);
            }
          }
        } else {
          toast.success('Empresa criada com sucesso');
        }
      }

      setIsDialogOpen(false);
      setEditingCompany(null);
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        evolutionApiUrl: '',
        evolutionApiKey: '',
        createEvolutionInstance: true,
      });
      fetchCompanies();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj || '',
      email: company.email || '',
      phone: company.phone || '',
      evolutionApiUrl: '',
      evolutionApiKey: '',
      createEvolutionInstance: false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const { error } = await supabase.from('companies').delete().eq('id', companyId);

      if (error) throw error;
      toast.success('Empresa excluída com sucesso');
      fetchCompanies();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  const handleAccess = (companyId: string) => {
    localStorage.setItem('currentCompanyId', companyId);
    navigate('/dashboard');
    window.location.reload();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minhas Empresas</h1>
            <p className="text-muted-foreground">Gerencie todas as suas empresas em um só lugar</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCompany(null);
                  setFormData({
                    name: '',
                    cnpj: '',
                    email: '',
                    phone: '',
                    evolutionApiUrl: '',
                    evolutionApiKey: '',
                    createEvolutionInstance: true,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {!editingCompany && (
                  <>
                    <div className="flex items-center space-x-2 pt-4 border-t">
                      <Checkbox
                        id="createEvolutionInstance"
                        checked={formData.createEvolutionInstance}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, createEvolutionInstance: checked as boolean })
                        }
                      />
                      <Label
                        htmlFor="createEvolutionInstance"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Criar instância Evolution API automaticamente
                      </Label>
                    </div>

                    {formData.createEvolutionInstance && (
                      <>
                        <div>
                          <Label htmlFor="evolutionApiUrl">URL da Evolution API</Label>
                          <Input
                            id="evolutionApiUrl"
                            placeholder="https://sua-api-evolution.com"
                            value={formData.evolutionApiUrl}
                            onChange={(e) =>
                              setFormData({ ...formData, evolutionApiUrl: e.target.value })
                            }
                            required={formData.createEvolutionInstance}
                          />
                        </div>
                        <div>
                          <Label htmlFor="evolutionApiKey">API Key da Evolution</Label>
                          <Input
                            id="evolutionApiKey"
                            type="password"
                            placeholder="Sua API Key"
                            value={formData.evolutionApiKey}
                            onChange={(e) =>
                              setFormData({ ...formData, evolutionApiKey: e.target.value })
                            }
                            required={formData.createEvolutionInstance}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingCompany ? 'Salvar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {companies.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Crie sua primeira empresa para começar a usar a plataforma
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Empresa
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      {company.cnpj && (
                        <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowQRModal(company.id)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Ver QR Code
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {(company.email || company.phone) && (
                  <div className="space-y-1 mb-4">
                    {company.email && (
                      <p className="text-sm text-muted-foreground">{company.email}</p>
                    )}
                    {company.phone && (
                      <p className="text-sm text-muted-foreground">{company.phone}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAccess(company.id)}
                  >
                    Acessar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(company.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={company.is_active ? 'text-green-500' : 'text-red-500'}>
                      {company.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <EvolutionStatusBadge
                      status={evolutionSettings[company.id]?.instance_status || 'not_created'}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showQRModal && (
        <EvolutionQRCodeModal
          isOpen={!!showQRModal}
          onClose={() => {
            setShowQRModal(null);
            fetchCompanies();
          }}
          companyId={showQRModal}
          initialQrCode={evolutionSettings[showQRModal]?.qr_code}
        />
      )}
    </MainLayout>
  );
};

export default Companies;
