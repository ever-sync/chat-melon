import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Check,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  MessageCircle,
  Music2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useVariables, CompanyVariable } from '@/hooks/useVariables';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { VariableModal } from './VariableModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  whatsapp?: string;
  tiktok?: string;
  website?: string;
}

interface StandardVariable {
  key: string;
  label: string;
  value: string;
  category: 'empresa' | 'usuario' | 'redes_sociais';
  icon: React.ElementType;
  description?: string;
}

export function VariablesManager() {
  const { variables, isLoading, deleteVariable } = useVariables();
  const { currentCompany } = useCompany();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CompanyVariable | undefined>();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('padrao');

  // Debug - verificar currentCompany
  useEffect(() => {
    console.log('🏢 [VariablesManager] currentCompany mudou:', currentCompany);
  }, [currentCompany]);

  // Buscar dados da empresa
  const { data: companyData, isLoading: isLoadingCompany, error: companyError, refetch: refetchCompany } = useQuery({
    queryKey: ['company-full-data-variables', currentCompany?.id],
    queryFn: async () => {
      console.log('🔍 [VariablesManager] Buscando dados da empresa, ID:', currentCompany?.id);
      if (!currentCompany?.id) {
        console.log('⚠️ [VariablesManager] currentCompany.id é null/undefined');
        return null;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', currentCompany.id)
        .single();
      if (error) {
        console.error('❌ [VariablesManager] Erro ao buscar dados da empresa:', error);
        throw error;
      }
      console.log('✅ [VariablesManager] Dados da empresa carregados:', data);
      console.log('📱 [VariablesManager] social_links:', data?.social_links);
      return data;
    },
    enabled: !!currentCompany?.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Buscar dados do usuário logado
  const { data: userData, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user-profile-data-variables'],
    queryFn: async () => {
      console.log('🔍 [VariablesManager] Buscando dados do usuário...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ [VariablesManager] Usuário não autenticado');
        return null;
      }
      console.log('👤 [VariablesManager] Usuário autenticado:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('❌ [VariablesManager] Erro ao buscar dados do usuário:', error);
        throw error;
      }
      console.log('✅ [VariablesManager] Dados do usuário carregados:', data);
      return { ...data, email: user.email };
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Debug - mostrar quando os dados mudam
  useEffect(() => {
    console.log('📊 [VariablesManager] companyData atualizado:', companyData);
    console.log('📊 [VariablesManager] userData atualizado:', userData);
  }, [companyData, userData]);

  // Gerar variáveis padrão baseadas nos dados da empresa e usuário
  const standardVariables: StandardVariable[] = [
    // Variáveis da Empresa
    {
      key: 'empresa_nome',
      label: 'Nome da Empresa',
      value: companyData?.name || '',
      category: 'empresa',
      icon: Building2,
      description: 'Nome completo da empresa',
    },
    {
      key: 'empresa_cnpj',
      label: 'CNPJ',
      value: companyData?.cnpj || '',
      category: 'empresa',
      icon: Building2,
      description: 'CNPJ da empresa',
    },
    {
      key: 'empresa_email',
      label: 'Email da Empresa',
      value: companyData?.email || '',
      category: 'empresa',
      icon: Mail,
      description: 'Email de contato da empresa',
    },
    {
      key: 'empresa_telefone',
      label: 'Telefone da Empresa',
      value: companyData?.phone || '',
      category: 'empresa',
      icon: Phone,
      description: 'Telefone de contato da empresa',
    },
    {
      key: 'empresa_endereco',
      label: 'Endereço',
      value: companyData?.address || '',
      category: 'empresa',
      icon: MapPin,
      description: 'Endereço da empresa',
    },
    {
      key: 'empresa_cidade',
      label: 'Cidade',
      value: companyData?.city || '',
      category: 'empresa',
      icon: MapPin,
      description: 'Cidade da empresa',
    },
    {
      key: 'empresa_estado',
      label: 'Estado',
      value: companyData?.state || '',
      category: 'empresa',
      icon: MapPin,
      description: 'Estado da empresa',
    },
    {
      key: 'empresa_cep',
      label: 'CEP',
      value: companyData?.postal_code || '',
      category: 'empresa',
      icon: MapPin,
      description: 'CEP da empresa',
    },
    {
      key: 'empresa_endereco_completo',
      label: 'Endereço Completo',
      value: companyData?.address
        ? `${companyData.address}${companyData.city ? `, ${companyData.city}` : ''}${companyData.state ? ` - ${companyData.state}` : ''}${companyData.postal_code ? `, ${companyData.postal_code}` : ''}`
        : '',
      category: 'empresa',
      icon: MapPin,
      description: 'Endereço completo formatado',
    },
    {
      key: 'empresa_logo',
      label: 'Logo da Empresa',
      value: companyData?.logo_url || '',
      category: 'empresa',
      icon: Building2,
      description: 'URL do logo da empresa',
    },

    // Variáveis do Usuário
    {
      key: 'usuario_nome',
      label: 'Nome do Usuário',
      value: userData?.full_name || '',
      category: 'usuario',
      icon: User,
      description: 'Nome completo do usuário logado',
    },
    {
      key: 'usuario_email',
      label: 'Email do Usuário',
      value: userData?.email || '',
      category: 'usuario',
      icon: Mail,
      description: 'Email do usuário logado',
    },
    {
      key: 'usuario_telefone',
      label: 'Telefone do Usuário',
      value: userData?.phone || '',
      category: 'usuario',
      icon: Phone,
      description: 'Telefone do usuário logado',
    },
    {
      key: 'usuario_cargo',
      label: 'Cargo',
      value: userData?.role || '',
      category: 'usuario',
      icon: User,
      description: 'Cargo do usuário na empresa',
    },
    {
      key: 'usuario_avatar',
      label: 'Avatar do Usuário',
      value: userData?.avatar_url || '',
      category: 'usuario',
      icon: User,
      description: 'URL do avatar do usuário',
    },

    // Redes Sociais
    ...(() => {
      const socialLinks = (companyData?.social_links as SocialLinks) || {};
      return [
        {
          key: 'rede_facebook',
          label: 'Facebook',
          value: socialLinks.facebook || '',
          category: 'redes_sociais' as const,
          icon: Facebook,
          description: 'Link do Facebook da empresa',
        },
        {
          key: 'rede_instagram',
          label: 'Instagram',
          value: socialLinks.instagram || '',
          category: 'redes_sociais' as const,
          icon: Instagram,
          description: 'Link do Instagram da empresa',
        },
        {
          key: 'rede_linkedin',
          label: 'LinkedIn',
          value: socialLinks.linkedin || '',
          category: 'redes_sociais' as const,
          icon: Linkedin,
          description: 'Link do LinkedIn da empresa',
        },
        {
          key: 'rede_youtube',
          label: 'YouTube',
          value: socialLinks.youtube || '',
          category: 'redes_sociais' as const,
          icon: Youtube,
          description: 'Link do YouTube da empresa',
        },
        {
          key: 'rede_twitter',
          label: 'Twitter / X',
          value: socialLinks.twitter || '',
          category: 'redes_sociais' as const,
          icon: Twitter,
          description: 'Link do Twitter/X da empresa',
        },
        {
          key: 'rede_whatsapp',
          label: 'WhatsApp',
          value: socialLinks.whatsapp ? `https://wa.me/${socialLinks.whatsapp}` : '',
          category: 'redes_sociais' as const,
          icon: MessageCircle,
          description: 'Link direto para WhatsApp',
        },
        {
          key: 'rede_tiktok',
          label: 'TikTok',
          value: socialLinks.tiktok || '',
          category: 'redes_sociais' as const,
          icon: Music2,
          description: 'Link do TikTok da empresa',
        },
        {
          key: 'rede_website',
          label: 'Website',
          value: socialLinks.website || '',
          category: 'redes_sociais' as const,
          icon: Globe,
          description: 'Site da empresa',
        },
      ];
    })(),
  ];

  const filteredVariables = variables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStandardVariables = standardVariables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.value.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingVariable(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (variable: CompanyVariable) => {
    setEditingVariable(variable);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta variável?')) {
      deleteVariable(id);
    }
  };

  const copyToClipboard = (key: string) => {
    const text = `{{${key}}}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Variável copiada para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'empresa':
        return 'Empresa';
      case 'usuario':
        return 'Usuário';
      case 'redes_sociais':
        return 'Redes Sociais';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'empresa':
        return 'bg-blue-100 text-blue-700';
      case 'usuario':
        return 'bg-green-100 text-green-700';
      case 'redes_sociais':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Agrupar variáveis padrão por categoria
  const groupedStandardVariables = filteredStandardVariables.reduce(
    (acc, variable) => {
      if (!acc[variable.category]) {
        acc[variable.category] = [];
      }
      acc[variable.category].push(variable);
      return acc;
    },
    {} as Record<string, StandardVariable[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Variáveis da Empresa</h2>
          <p className="text-muted-foreground text-sm">
            Crie variáveis globais que podem ser usadas em seus templates de mensagem.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Variável
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="padrao" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Variáveis Padrão
          </TabsTrigger>
          <TabsTrigger value="personalizadas" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Variáveis Personalizadas
          </TabsTrigger>
        </TabsList>

        {/* Variáveis Padrão */}
        <TabsContent value="padrao" className="space-y-6">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-amber-800">
                <strong>Variáveis Padrão</strong> são preenchidas automaticamente com os dados
                cadastrados nas configurações da empresa e do perfil do usuário. Para alterar os
                valores, acesse as configurações correspondentes.
              </p>
            </CardContent>
          </Card>

          {(isLoadingCompany || isLoadingUser) && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  Carregando dados... {isLoadingCompany && '(empresa)'} {isLoadingUser && '(usuário)'}
                </p>
              </CardContent>
            </Card>
          )}

          {(companyError || userError) && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <p className="text-sm text-red-800">
                  <strong>Erro ao carregar dados:</strong><br/>
                  {companyError && `Empresa: ${(companyError as Error).message}`}<br/>
                  {userError && `Usuário: ${(userError as Error).message}`}
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoadingCompany && !companyData && currentCompany?.id && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <p className="text-sm text-orange-800">
                  <strong>Atenção:</strong> Não foi possível carregar os dados completos da empresa.
                  Verifique se as configurações foram salvas corretamente.
                </p>
              </CardContent>
            </Card>
          )}

          {Object.entries(groupedStandardVariables).map(([category, vars]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(category)}>{getCategoryLabel(category)}</Badge>
                <span className="text-sm text-muted-foreground">({vars.length} variáveis)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vars.map((variable) => {
                  const Icon = variable.icon;
                  const hasValue = !!variable.value;
                  return (
                    <Card
                      key={variable.key}
                      className={`group hover:shadow-md transition-all duration-300 border-gray-100 rounded-2xl overflow-hidden ${!hasValue ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {variable.label}
                              </h4>
                              <div
                                onClick={() => copyToClipboard(variable.key)}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono cursor-pointer hover:bg-indigo-100 transition-colors"
                              >
                                {copiedKey === variable.key ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                {'{{'}
                                {variable.key}
                                {'}}'}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            <Lock className="h-2.5 w-2.5 mr-1" />
                            Padrão
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                              Valor Atual
                            </span>
                            <p
                              className={`text-gray-700 line-clamp-2 break-all p-2 rounded-lg border ${hasValue ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100 text-red-400 italic'}`}
                            >
                              {hasValue ? variable.value : 'Não configurado'}
                            </p>
                          </div>

                          {variable.description && (
                            <p className="text-gray-400 text-xs italic">{variable.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(groupedStandardVariables).length === 0 && (
            <Card className="border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-gray-50/50">
              <p className="text-gray-500 font-medium">Nenhuma variável encontrada</p>
              <p className="text-gray-400 text-sm mt-1">
                Tente buscar por outro termo ou limpe o filtro.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Variáveis Personalizadas */}
        <TabsContent value="personalizadas" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredVariables.length === 0 ? (
            <Card className="border-dashed border-2 p-12 text-center flex flex-col items-center justify-center bg-gray-50/50">
              <div className="p-4 rounded-full bg-gray-100 mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma variável personalizada encontrada</p>
              <p className="text-gray-400 text-sm mt-1">
                Crie suas próprias variáveis para usar valores customizados nos templates.
              </p>
              <Button variant="outline" className="mt-6" onClick={handleCreate}>
                Criar Variável Personalizada
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVariables.map((variable) => (
                <Card
                  key={variable.id}
                  className="group hover:shadow-md transition-all duration-300 border-gray-100 rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-gray-900">{variable.label}</h4>
                        <div
                          onClick={() => copyToClipboard(variable.key)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-mono cursor-pointer hover:bg-purple-100 transition-colors"
                        >
                          {copiedKey === variable.key ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {'{{'}
                          {variable.key}
                          {'}}'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleEdit(variable)}
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-red-600"
                          onClick={() => handleDelete(variable.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Valor
                        </span>
                        <p className="text-gray-700 line-clamp-2 break-all bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {variable.value}
                        </p>
                      </div>

                      {variable.description && (
                        <div className="text-sm">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                            Descrição
                          </span>
                          <p className="text-gray-500 text-xs line-clamp-1 italic">
                            {variable.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <VariableModal open={isModalOpen} onOpenChange={setIsModalOpen} variable={editingVariable} />
    </div>
  );
}
