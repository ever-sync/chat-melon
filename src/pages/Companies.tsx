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
import { Plus, Building2, Edit, Trash2, Ban, CheckCircle, Search, Filter, Calendar, CreditCard, Clock, CheckCircle2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  logo_url: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  subscription_plans?: {
    name: string;
    slug: string;
  };
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [cnpjError, setCnpjError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
  });
  const navigate = useNavigate();

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return value;
  };

  const handleCNPJChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      const formatted = formatCNPJ(cleaned);
      setFormData({ ...formData, cnpj: formatted });

      // Validar CNPJ enquanto digita (apenas se tiver 14 dígitos)
      if (cleaned.length === 14) {
        if (!validateCNPJ(formatted)) {
          setCnpjError('CNPJ inválido');
        } else {
          setCnpjError('');
        }
      } else {
        setCnpjError('');
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setFormData({ ...formData, phone: formatPhone(cleaned) });
    }
  };

  const validateCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    let pos = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(cleaned.charAt(12))) return false;

    sum = 0;
    pos = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned.charAt(i)) * pos;
      pos = pos === 2 ? 9 : pos - 1;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(cleaned.charAt(13))) return false;

    return true;
  };

  useEffect(() => {
    fetchCompanies();
    checkSuperAdmin();
    // Verificar qual empresa está atualmente logada
    const storedCompanyId = localStorage.getItem('currentCompanyId');
    setCurrentCompanyId(storedCompanyId);
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, statusFilter]);

  const filterCompanies = () => {
    let filtered = [...companies];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter === 'active') {
      filtered = filtered.filter((company) => company.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((company) => !company.is_active);
    }

    setFilteredCompanies(filtered);
  };

  const checkSuperAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsSuperAdmin(data?.is_super_admin || false);
    } catch (error: any) {
      console.error('Error checking super admin:', error);
      setIsSuperAdmin(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          subscription_plans:plan_id (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
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

      // Validar CNPJ se foi preenchido e não está editando
      if (formData.cnpj && !editingCompany) {
        if (!validateCNPJ(formData.cnpj)) {
          toast.error('CNPJ inválido');
          return;
        }
      }

      // Limpar formatação antes de salvar
      const cleanedCNPJ = formData.cnpj.replace(/\D/g, '');
      const cleanedPhone = formData.phone.replace(/\D/g, '');

      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            email: formData.email,
            phone: cleanedPhone || null,
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success('Empresa atualizada com sucesso');
      } else {
        // Create new company
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            cnpj: cleanedCNPJ || null,
            email: formData.email,
            phone: cleanedPhone || null,
            created_by: user.id,
          });

        if (companyError) throw companyError;
        toast.success('Empresa criada com sucesso');
      }

      setIsDialogOpen(false);
      setEditingCompany(null);
      setCnpjError('');
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
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
      cnpj: company.cnpj ? formatCNPJ(company.cnpj) : '',
      email: company.email || '',
      phone: company.phone ? formatPhone(company.phone) : '',
    });
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    if (!isSuperAdmin) {
      toast.error('Apenas o superadmin pode suspender/ativar empresas');
      return;
    }

    const action = currentStatus ? 'suspender' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${action} esta empresa?`)) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;
      toast.success(`Empresa ${currentStatus ? 'suspensa' : 'ativada'} com sucesso`);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error toggling company status:', error);
      toast.error(`Erro ao ${action} empresa`);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!isSuperAdmin) {
      toast.error('Apenas o superadmin pode excluir empresas');
      return;
    }

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

  const handleAccess = (company: Company) => {
    if (!company.is_active) {
      toast.error('Esta empresa está suspensa e não pode ser acessada');
      return;
    }
    localStorage.setItem('currentCompanyId', company.id);
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

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.is_active).length,
    inactive: companies.filter((c) => !c.is_active).length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as suas empresas em um só lugar
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              // TODO: Implementar redirecionamento para página de contratação de plano
              toast.info('Funcionalidade de contratação de plano em breve!');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Contratar Plano
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="hidden"
                onClick={() => {
                  setEditingCompany(null);
                  setCnpjError('');
                  setFormData({
                    name: '',
                    cnpj: '',
                    email: '',
                    phone: '',
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {editingCompany
                    ? 'Atualize as informações da empresa'
                    : 'Preencha os dados para criar uma nova empresa'}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome da Empresa *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Digite o nome da empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-sm font-medium">
                    CNPJ {editingCompany && <span className="text-xs text-muted-foreground">(não editável)</span>}
                  </Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    className={`h-11 ${cnpjError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={!!editingCompany}
                    maxLength={18}
                  />
                  {cnpjError && (
                    <p className="text-sm text-red-600">{cnpjError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="h-11"
                    maxLength={15}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} size="lg">
                    Cancelar
                  </Button>
                  <Button type="submit" size="lg">
                    {editingCompany ? 'Salvar Alterações' : 'Criar Empresa'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {companies.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Empresas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                  <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresas Suspensas</p>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {companies.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('active')}
                  >
                    Ativas
                  </Button>
                  <Button
                    variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('inactive')}
                  >
                    Suspensas
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {companies.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma empresa cadastrada</h3>
              <p className="text-muted-foreground mb-6">
                Contrate um plano para começar a usar a plataforma
              </p>
              <Button size="lg" onClick={() => toast.info('Funcionalidade de contratação de plano em breve!')}>
                <Plus className="h-4 w-4 mr-2" />
                Contratar Plano
              </Button>
            </div>
          </Card>
        ) : filteredCompanies.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Tente ajustar seus filtros ou termo de busca
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  !company.is_active
                    ? 'opacity-60 border-red-300 dark:border-red-800'
                    : currentCompanyId === company.id
                    ? 'border-primary border-2 shadow-lg'
                    : 'hover:border-primary/50'
                }`}
              >
                {/* Header com badge "Empresa Atual" */}
                {currentCompanyId === company.id && (
                  <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-2 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">EMPRESA ATUAL</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Logo e Nome da Empresa */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center overflow-hidden shadow-md ${company.is_active ? 'bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/20' : 'bg-red-100'}`}>
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={`Logo ${company.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className={`h-8 w-8 ${company.is_active ? 'text-primary' : 'text-red-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-bold text-xl text-foreground truncate">{company.name}</h3>
                            {!company.is_active && (
                              <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full whitespace-nowrap">
                                SUSPENSA
                              </span>
                            )}
                          </div>
                          {company.cnpj && (
                            <p className="text-sm text-muted-foreground font-mono">
                              CNPJ: {formatCNPJ(company.cnpj)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={currentCompanyId === company.id ? 'secondary' : 'default'}
                          size="sm"
                          className="font-semibold whitespace-nowrap"
                          onClick={() => handleAccess(company)}
                          disabled={!company.is_active || currentCompanyId === company.id}
                        >
                          {currentCompanyId === company.id ? 'Em Uso' : 'Acessar'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  {(company.email || company.phone) && (
                    <div className="space-y-2 mb-5 p-3 bg-muted/30 rounded-lg">
                      {company.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          {company.email}
                        </p>
                      )}
                      {company.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          {formatPhone(company.phone)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botões de Ação do Superadmin */}
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 mb-5">
                      <Button
                        variant="outline"
                        size="default"
                        className="flex-1"
                        onClick={() => handleToggleStatus(company.id, company.is_active)}
                        title={company.is_active ? 'Suspender' : 'Ativar'}
                      >
                        {company.is_active ? (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => handleDelete(company.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Informações Detalhadas */}
                  <div className="mt-5 pt-5 border-t-2 border-border/50 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Criada em</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatDate(company.created_at)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">Plano</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground px-2.5 py-1 bg-primary/10 text-primary rounded-md">
                        {company.subscription_plans?.name || 'Gratuito'}
                      </span>
                    </div>

                    {company.trial_ends_at && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Vencimento</span>
                        </div>
                        {(() => {
                          const daysRemaining = getDaysRemaining(company.trial_ends_at);
                          if (daysRemaining === null) return null;

                          const isExpired = daysRemaining < 0;
                          const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0;

                          return (
                            <span
                              className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                                isExpired
                                  ? 'bg-red-100 text-red-700'
                                  : isExpiringSoon
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {isExpired
                                ? `Expirado há ${Math.abs(daysRemaining)} dias`
                                : daysRemaining === 0
                                ? 'Expira hoje'
                                : daysRemaining === 1
                                ? '1 dia'
                                : `${daysRemaining} dias`}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${company.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {company.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Companies;
