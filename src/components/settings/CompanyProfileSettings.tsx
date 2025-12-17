import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, Building2, Clock, Save, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { Json } from '@/integrations/supabase/types';

interface CompanyData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const BUSINESS_STATUS = [
  { value: 'open', label: 'Aberto', color: 'text-green-600' },
  { value: 'closed', label: 'Fechado', color: 'text-red-600' },
  { value: 'busy', label: 'Ocupado', color: 'text-yellow-600' },
];

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export function CompanyProfileSettings() {
  const { currentCompany, refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [businessStatus, setBusinessStatus] = useState('open');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '18:00', enabled: true },
    tuesday: { open: '09:00', close: '18:00', enabled: true },
    wednesday: { open: '09:00', close: '18:00', enabled: true },
    thursday: { open: '09:00', close: '18:00', enabled: true },
    friday: { open: '09:00', close: '18:00', enabled: true },
    saturday: { open: '09:00', close: '13:00', enabled: false },
    sunday: { open: '09:00', close: '13:00', enabled: false },
  });

  useEffect(() => {
    if (currentCompany) {
      loadCompanyData();
    }
  }, [currentCompany]);

  const loadCompanyData = async () => {
    if (!currentCompany) return;

    // Buscar dados completos da empresa
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', currentCompany.id)
      .single();

    if (data) {
      setCompanyData({
        name: data.name || '',
        cnpj: data.cnpj || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
      });
      setBusinessStatus(data.business_status || 'open');
      setLogoUrl(data.logo_url || null);

      if (data.business_hours) {
        setBusinessHours(data.business_hours as BusinessHours);
      }
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentCompany) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentCompany.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('company-logos').getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo atualizado!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Erro ao fazer upload do logo');
    } finally {
      setUploading(false);
    }
  };

  const validateCompanyData = (): string[] => {
    const errors: string[] = [];
    if (!companyData.name.trim()) errors.push('Nome da empresa é obrigatório');
    if (!companyData.cnpj.trim()) errors.push('CNPJ é obrigatório');
    if (!companyData.email.trim()) errors.push('Email é obrigatório');
    if (!companyData.phone.trim()) errors.push('Telefone é obrigatório');
    return errors;
  };

  const handleSave = async () => {
    if (!currentCompany) return;

    const errors = validateCompanyData();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          cnpj: companyData.cnpj,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          postal_code: companyData.postal_code,
          business_status: businessStatus,
          logo_url: logoUrl,
          business_hours: businessHours as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentCompany.id);

      if (error) throw error;

      await refreshCompanies();
      toast.success('Perfil corporativo atualizado!');
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessHours = (
    day: string,
    field: 'open' | 'close' | 'enabled',
    value: string | boolean
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil Corporativo</CardTitle>
          <CardDescription>Nenhuma empresa selecionada</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo e Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>Preencha os dados obrigatórios da sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={logoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {companyData.name.charAt(0).toUpperCase() || 'E'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Alterar Logo'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">
                    Nome da Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">
                    CNPJ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cnpj"
                    value={companyData.cnpj}
                    onChange={(e) =>
                      setCompanyData({ ...companyData, cnpj: formatCNPJ(e.target.value) })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="business-status">Status Comercial</Label>
                <Select value={businessStatus} onValueChange={setBusinessStatus}>
                  <SelectTrigger id="business-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contato
          </CardTitle>
          <CardDescription>Informações de contato da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company-email"
                  type="email"
                  className="pl-10"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company-phone">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company-phone"
                  className="pl-10"
                  value={companyData.phone}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, phone: formatPhone(e.target.value) })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
          <CardDescription>Endereço comercial da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={companyData.address}
              onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={companyData.city}
                onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado</Label>
              <Select
                value={companyData.state}
                onValueChange={(value) => setCompanyData({ ...companyData, state: value })}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                value={companyData.postal_code}
                onChange={(e) =>
                  setCompanyData({ ...companyData, postal_code: formatCEP(e.target.value) })
                }
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Configure os horários de atendimento da sua empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Switch
                    checked={businessHours[day.key]?.enabled ?? false}
                    onCheckedChange={(checked) => updateBusinessHours(day.key, 'enabled', checked)}
                  />
                  <Label className="cursor-pointer">{day.label}</Label>
                </div>

                {businessHours[day.key]?.enabled && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={businessHours[day.key]?.open || '09:00'}
                      onChange={(e) => updateBusinessHours(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={businessHours[day.key]?.close || '18:00'}
                      onChange={(e) => updateBusinessHours(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}

                {!businessHours[day.key]?.enabled && (
                  <span className="text-muted-foreground text-sm">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
