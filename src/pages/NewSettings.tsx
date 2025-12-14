import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";
import { EvolutionInstanceManager } from "@/components/evolution/EvolutionInstanceManager";
import { InstancesList } from "@/components/settings/InstancesList";
import { CompanyProfileSettings } from "@/components/settings/CompanyProfileSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { BlockedContactsManager } from "@/components/settings/BlockedContactsManager";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { CustomFieldsManager } from "@/components/settings/CustomFieldsManager";
import { SatisfactionSettings } from "@/components/settings/SatisfactionSettings";
import { ScoringRulesManager } from "@/components/settings/ScoringRulesManager";
import { InstanceHealthDashboard } from "@/components/settings/InstanceHealthDashboard";
import { InstanceSettingsForm } from "@/components/settings/InstanceSettingsForm";
import { GoogleCalendarSettings } from "@/components/settings/GoogleCalendarSettings";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { PWASettings } from "@/components/pwa/PWASettings";
import { TranscriptionSettings } from "@/components/settings/TranscriptionSettings";
import UsersPage from "@/pages/settings/UsersPage";
import AISettingsPage from "@/pages/settings/AISettingsPage";
import { Copy, Smartphone, Bot, Users, FileAudio } from "lucide-react";

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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado com sucesso");
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">w</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Chat</span>
          </div>
          <div className="h-10 w-px bg-border mx-2"></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie suas preferências e configurações do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-2">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1">
              <TabsTrigger 
                value="profile" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Perfil
              </TabsTrigger>
              <TabsTrigger 
                value="company" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Empresa
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Bot className="h-4 w-4 mr-2" />
                Assistente de IA
              </TabsTrigger>
              <TabsTrigger
                value="evolution"
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Instância WhatsApp
              </TabsTrigger>
              <TabsTrigger 
                value="health" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Saúde do Sistema
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Google Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Configurações de Email
              </TabsTrigger>
              <TabsTrigger 
                value="pwa" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                PWA & Mobile
              </TabsTrigger>
              <TabsTrigger 
                value="privacy" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Privacidade
              </TabsTrigger>
              <TabsTrigger 
                value="blocked" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Contatos Bloqueados
              </TabsTrigger>
              <TabsTrigger 
                value="custom-fields" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Campos Personalizados
              </TabsTrigger>
              <TabsTrigger 
                value="satisfaction" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                CSAT/NPS
              </TabsTrigger>
              <TabsTrigger
                value="scoring"
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Lead Scoring
              </TabsTrigger>
              <TabsTrigger
                value="transcription"
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <FileAudio className="h-4 w-4 mr-2" />
                Transcrição de Áudios
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                Notificações
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-4">
            <TabsContent value="profile" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Primeiro Nome</Label>
                      <Input
                        id="first_name"
                        placeholder="João"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input
                        id="last_name"
                        placeholder="Silva"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">Apelido</Label>
                    <Input
                      id="nickname"
                      placeholder="Como você quer ser chamado no sistema"
                      value={profile.nickname}
                      onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome aparecerá nas telas de login e em outras áreas do sistema
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="João da Silva"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@empresa.com"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
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
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
