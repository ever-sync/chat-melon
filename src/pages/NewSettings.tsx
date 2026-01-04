import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCompany } from '@/contexts/CompanyContext';
import { CompanyProfileSettings } from '@/components/settings/CompanyProfileSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { BlockedContactsManager } from '@/components/settings/BlockedContactsManager';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { CustomFieldsManager } from '@/components/settings/CustomFieldsManager';
import { SatisfactionSettings } from '@/components/settings/SatisfactionSettings';
import { ScoringRulesManager } from '@/components/settings/ScoringRulesManager';
import { InstanceHealthDashboard } from '@/components/settings/InstanceHealthDashboard';
import { InstanceSettingsForm } from '@/components/settings/InstanceSettingsForm';
import { GoogleCalendarSettings } from '@/components/settings/GoogleCalendarSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { PWASettings } from '@/components/pwa/PWASettings';
import { TranscriptionSettings } from '@/components/settings/TranscriptionSettings';
import { WidgetSettings } from '@/components/settings/WidgetSettings';
import { ApiKeyManager } from '@/components/settings/ApiKeyManager';
import { WebhookManager } from '@/components/settings/WebhookManager';
import { TabulationsManager } from '@/components/settings/TabulationsManager';
import { VariablesManager } from '@/components/settings/VariablesManager';
import UsersPage from '@/pages/settings/UsersPage';
import AISettingsPage from '@/pages/settings/AISettingsPage';
import { AssistantSettings } from '@/components/ai-assistant/AssistantSettings';
import {
  Settings,
  User,
  Building2,
  Users,
  Bot,
  Activity,
  Calendar,
  Mail,
  Smartphone,
  Shield,
  UserX,
  Sliders,
  Star,
  Target,
  FileAudio,
  Bell,
  MessageCircle,
  Key,
  Webhook,
  Package,
  Sparkles,
  CheckCircle2,
  Palette,
  Gauge,
  Upload,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Função utilitária para decidir se o texto deve ser preto ou branco com base no fundo
const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return '#ffffff';
  if (hexcolor.startsWith('#')) {
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  }
  return '#ffffff';
};

export default function NewSettings() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    message_color: '#6366f1',
  });
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = (value: string) => {
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    fetchData();
  }, [currentCompany]);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const currentCompanyId = currentCompany?.id || null;
    setCompanyId(currentCompanyId);

    const [profileData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    ]);

    if (profileData.data) {
      setProfile({
        full_name: profileData.data.full_name || '',
        first_name: profileData.data.first_name || '',
        last_name: profileData.data.last_name || '',
        nickname: profileData.data.nickname || '',
        email: profileData.data.email || '',
        phone: profileData.data.phone || '',
        message_color: (profileData.data as any).message_color || '#6366f1',
      });
      setAvatarUrl((profileData.data as any).avatar_url || '');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Apenas atualizar campos permitidos no perfil
    // Removemos o email daqui pois ele deve ser gerenciado via Auth para evitar conflitos de RLS/Triggers
    const { email, ...updateData } = profile;

    console.log('Salvando perfil:', updateData);

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil: ' + (error.message || 'Erro desconhecido'));
    } else {
      toast.success('Perfil atualizado com sucesso');
      // Recarregar dados para garantir sincronia
      fetchData();
    }
    setLoading(false);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      // Telefone fixo: (11) 1234-5678
      return cleaned
        .replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
        .replace(/\-$/, '');
    } else {
      // Celular: (11) 91234-5678
      return cleaned
        .replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
        .replace(/\-$/, '');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setProfile({ ...profile, phone: formatPhoneNumber(value) });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de arquivo
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato inválido', {
          description: 'Use PNG, JPG, JPEG ou WebP',
        });
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande', {
          description: 'O tamanho máximo é 5MB',
        });
        return;
      }

      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Nome do arquivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload para o bucket user-avatars
      const { error: uploadError, data } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('user-avatars').getPublicUrl(filePath);

      // Atualizar avatar_url no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar foto', {
        description: error.message || 'Tente novamente',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChangeEmail = async () => {
    // Validações
    if (!newEmail || !confirmNewEmail) {
      toast.error('Preencha ambos os campos de email');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      toast.error('Os emails não coincidem');
      return;
    }

    if (newEmail === profile.email) {
      toast.error('O novo email deve ser diferente do atual');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Email inválido');
      return;
    }

    setIsChangingEmail(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Supabase Auth envia automaticamente email de confirmação
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) throw updateError;

      toast.success('Email de confirmação enviado!', {
        description: `Verifique sua caixa de entrada em ${newEmail} e clique no link para confirmar a alteração.`,
        duration: 8000,
      });

      // Fechar o modal
      setShowEmailChangeDialog(false);
      setNewEmail('');
      setConfirmNewEmail('');

      // Mostrar aviso que precisa confirmar
      setTimeout(() => {
        toast.info('Aguardando confirmação', {
          description: 'Seu email será atualizado assim que você confirmar no link enviado.',
          duration: 6000,
        });
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao alterar email:', error);
      toast.error('Erro ao alterar email', {
        description: error.message || 'Tente novamente mais tarde',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
                <Settings className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Configurações
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Personalize e gerencie suas preferências do sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8"
        >
          {/* Sidebar Navigation */}
          <div className="space-y-4">
            <TabsList className="flex flex-col h-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-3 space-y-1.5">
              {/* Conta & Perfil */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Conta & Perfil
                </p>
              </div>

              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">Meu Perfil</span>
              </TabsTrigger>

              <TabsTrigger
                value="company"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Empresa</span>
              </TabsTrigger>

              <TabsTrigger
                value="users"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Usuários</span>
              </TabsTrigger>

              <Separator className="my-3" />

              {/* Comunicação */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Comunicação
                </p>
              </div>

              <TabsTrigger
                value="notifications"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notificações</span>
              </TabsTrigger>

              <Separator className="my-3" />

              {/* Sistema & Privacidade */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Sistema & Privacidade
                </p>
              </div>

              <TabsTrigger
                value="security"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Segurança</span>
              </TabsTrigger>



              <TabsTrigger
                value="pwa"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">PWA & Mobile</span>
              </TabsTrigger>

              <Separator className="my-3" />

              {/* Personalização */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Personalização
                </p>
              </div>


              <TabsTrigger
                value="satisfaction"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Star className="h-4 w-4" />
                <span className="font-medium">CSAT/NPS</span>
              </TabsTrigger>

              <TabsTrigger
                value="scoring"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Target className="h-4 w-4" />
                <span className="font-medium">Lead Scoring</span>
              </TabsTrigger>

              <TabsTrigger
                value="tabulations"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Tabulação</span>
              </TabsTrigger>

              <TabsTrigger
                value="widget"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">Widget de Chat</span>
              </TabsTrigger>


              <Separator className="my-3" />

              {/* Integrações */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Integrações
                </p>
              </div>

              <TabsTrigger
                value="calendar"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Google Calendar</span>
              </TabsTrigger>


              <TabsTrigger
                value="api-keys"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Key className="h-4 w-4" />
                <span className="font-medium">API Keys</span>
              </TabsTrigger>

              <TabsTrigger
                value="webhooks"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Webhook className="h-4 w-4" />
                <span className="font-medium">Webhooks</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            <TabsContent value="profile" className="m-0">
              <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Informações do Perfil</CardTitle>
                      <CardDescription className="text-base">
                        Atualize suas informações pessoais
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {/* Foto de Perfil */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-indigo-50 transition-colors border-2 border-indigo-100"
                        disabled={uploading}
                      >
                        <Camera className="h-4 w-4 text-indigo-600" />
                      </button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">Foto de Perfil</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Esta foto aparecerá no chat e em outras áreas do sistema
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="rounded-xl"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Enviando...' : 'Alterar Foto'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, JPEG ou WebP • Máximo 5MB • Recomendado: 512x512px
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-semibold">
                        Primeiro Nome
                      </Label>
                      <Input
                        id="first_name"
                        placeholder="João"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-semibold">
                        Sobrenome
                      </Label>
                      <Input
                        id="last_name"
                        placeholder="Silva"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="text-sm font-semibold">
                      Apelido
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="Como você quer ser chamado no sistema"
                      value={profile.nickname}
                      onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                      className="rounded-xl h-11"
                    />
                    <p className="text-xs text-gray-500">
                      Este nome aparecerá nas telas de login e em outras áreas do sistema
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      placeholder="João da Silva"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="rounded-xl h-11"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email
                        <span className="text-xs text-muted-foreground ml-2">(não editável)</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          placeholder="joao@empresa.com"
                          value={profile.email}
                          disabled
                          className="rounded-xl h-11 bg-muted"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEmailChangeDialog(true)}
                          className="rounded-xl whitespace-nowrap"
                        >
                          Alterar Email
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A alteração de email requer confirmação por email
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={profile.phone}
                        onChange={handlePhoneChange}
                        className="rounded-xl h-11"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formato: (11) 91234-5678 ou (11) 1234-5678
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-indigo-600" />
                      <Label className="text-sm font-semibold">Cor das Suas Mensagens no Chat</Label>
                    </div>
                    <p className="text-xs text-gray-400">
                      Escolha a cor que suas bolhas de mensagem terão para você e seus colegas.
                    </p>

                    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      {[
                        '#6366f1', // Indigo (Default)
                        '#ef4444', // Red
                        '#f97316', // Orange
                        '#f59e0b', // Amber
                        '#10b981', // Emerald
                        '#06b6d4', // Cyan
                        '#3b82f6', // Blue
                        '#8b5cf6', // Violet
                        '#ec4899', // Pink
                        '#000000', // Black
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setProfile({ ...profile, message_color: color })}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110",
                            profile.message_color === color ? "border-indigo-600 scale-110 shadow-md" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}

                      <div className="flex items-center gap-2 ml-auto">
                        <Label htmlFor="custom_color" className="text-xs font-medium text-gray-400">Personalizada:</Label>
                        <input
                          id="custom_color"
                          type="color"
                          value={profile.message_color}
                          onChange={(e) => setProfile({ ...profile, message_color: e.target.value })}
                          className="w-10 h-10 rounded-full border-0 p-0 overflow-hidden cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400">Prévia:</span>
                      <div
                        className="px-4 py-2 rounded-2xl shadow-sm text-sm"
                        style={{
                          backgroundColor: profile.message_color,
                          color: getContrastColor(profile.message_color)
                        }}
                      >
                        Olá! Esta é a sua cor personalizada.
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="rounded-xl h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                    >
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="m-0 space-y-4">
              <CompanyProfileSettings />
            </TabsContent>

            <TabsContent value="users" className="m-0">
              <UsersPage />
            </TabsContent>


            <TabsContent value="satisfaction" className="m-0">
              <SatisfactionSettings />
            </TabsContent>

            <TabsContent value="scoring" className="m-0">
              <ScoringRulesManager />
            </TabsContent>

            <TabsContent value="calendar" className="m-0">
              <GoogleCalendarSettings />
            </TabsContent>


            <TabsContent value="pwa" className="m-0">
              <PWASettings />
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <NotificationSettings />
            </TabsContent>


            <TabsContent value="api-keys" className="m-0">
              <ApiKeyManager />
            </TabsContent>

            <TabsContent value="webhooks" className="m-0">
              <WebhookManager />
            </TabsContent>

            <TabsContent value="security" className="m-0">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="tabulations" className="m-0">
              <TabulationsManager />
            </TabsContent>

            <TabsContent value="widget" className="m-0">
              <WidgetSettings />
            </TabsContent>

          </div>
        </Tabs>

        {/* Modal de Alteração de Email */}
        <Dialog open={showEmailChangeDialog} onOpenChange={setShowEmailChangeDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Alterar Email</DialogTitle>
              <DialogDescription>
                Por questões de segurança, você receberá um email de confirmação no novo endereço.
                O email será atualizado em todas as empresas vinculadas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Email atual:</strong> {profile.email}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-sm font-semibold">
                  Novo Email *
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl h-11"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-email" className="text-sm font-semibold">
                  Confirme o Novo Email *
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder="novo@email.com"
                  value={confirmNewEmail}
                  onChange={(e) => setConfirmNewEmail(e.target.value)}
                  className="rounded-xl h-11"
                  autoComplete="off"
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Importante:</strong> Após confirmar, você receberá um email com um link de verificação.
                  Clique no link para completar a alteração. Até lá, seu email atual continuará ativo.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEmailChangeDialog(false);
                  setNewEmail('');
                  setConfirmNewEmail('');
                }}
                disabled={isChangingEmail}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleChangeEmail}
                disabled={isChangingEmail || !newEmail || !confirmNewEmail}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {isChangingEmail ? 'Enviando...' : 'Confirmar Alteração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
