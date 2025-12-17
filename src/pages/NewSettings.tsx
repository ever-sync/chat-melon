import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { EvolutionInstanceManager } from '@/components/evolution/EvolutionInstanceManager';
import { InstancesList } from '@/components/settings/InstancesList';
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
import { ChannelsSettings } from '@/components/settings/ChannelsSettings';
import UsersPage from '@/pages/settings/UsersPage';
import AISettingsPage from '@/pages/settings/AISettingsPage';
import {
  Settings,
  User,
  Building2,
  Users,
  Bot,
  Share2,
  MessageSquare,
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
} from 'lucide-react';

export default function NewSettings() {
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
  });

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
      });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);

    if (error) {
      toast.error('Erro ao salvar perfil');
    } else {
      toast.success('Perfil atualizado com sucesso');
    }
    setLoading(false);
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

        <Tabs defaultValue="profile" className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
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

              {/* Automação & IA */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Automação & IA
                </p>
              </div>

              <TabsTrigger
                value="ai"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Assistente de IA</span>
              </TabsTrigger>

              <TabsTrigger
                value="transcription"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <FileAudio className="h-4 w-4" />
                <span className="font-medium">Transcrição</span>
              </TabsTrigger>

              <Separator className="my-3" />

              {/* Comunicação */}
              <div className="w-full px-3 py-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Comunicação
                </p>
              </div>

              <TabsTrigger
                value="channels"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Canais</span>
              </TabsTrigger>

              <TabsTrigger
                value="evolution"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">WhatsApp</span>
              </TabsTrigger>

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
                value="health"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Saúde do Sistema</span>
              </TabsTrigger>

              <TabsTrigger
                value="privacy"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Privacidade</span>
              </TabsTrigger>

              <TabsTrigger
                value="blocked"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <UserX className="h-4 w-4" />
                <span className="font-medium">Bloqueados</span>
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
                value="custom-fields"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Sliders className="h-4 w-4" />
                <span className="font-medium">Campos Custom</span>
              </TabsTrigger>

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
                value="email"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email</span>
              </TabsTrigger>

              <TabsTrigger
                value="widget"
                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">Widget de Chat</span>
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
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@empresa.com"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="rounded-xl h-11"
                      />
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

            <TabsContent value="ai" className="m-0">
              <AISettingsPage embedded={true} />
            </TabsContent>

            <TabsContent value="channels" className="m-0">
              <ChannelsSettings />
            </TabsContent>

            <TabsContent value="evolution" className="m-0">
              <InstancesList />
            </TabsContent>

            <TabsContent value="health" className="m-0">
              <InstanceHealthDashboard />
            </TabsContent>

            <TabsContent value="privacy" className="m-0">
              <PrivacySettings />
            </TabsContent>

            <TabsContent value="blocked" className="m-0">
              <BlockedContactsManager />
            </TabsContent>

            <TabsContent value="custom-fields" className="m-0">
              <CustomFieldsManager />
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

            <TabsContent value="email" className="m-0">
              <EmailSettings />
            </TabsContent>

            <TabsContent value="pwa" className="m-0">
              <PWASettings />
            </TabsContent>

            <TabsContent value="transcription" className="m-0">
              <TranscriptionSettings />
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="widget" className="m-0">
              <WidgetSettings />
            </TabsContent>

            <TabsContent value="api-keys" className="m-0">
              <ApiKeyManager />
            </TabsContent>

            <TabsContent value="webhooks" className="m-0">
              <WebhookManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
