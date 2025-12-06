import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { MainLayout } from '@/components/MainLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Save,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AISettings {
  is_enabled: boolean;
  default_mode: string;
  personality: string;
  language: string;
  response_delay_ms: number;
  typing_indicator: boolean;
  max_messages_before_handoff: number;
  max_response_length: number;
  handoff_keywords: string[];
  handoff_on_negative_sentiment: boolean;
  handoff_on_high_value: boolean;
  high_value_threshold: number;
  active_hours_start: string;
  active_hours_end: string;
  active_on_weekends: boolean;
  fallback_message: string;
  n8n_webhook_url: string;
  n8n_api_key: string;
  system_prompt: string;
  greeting_message: string;
  handoff_message: string;
  copilot_script: string;
  gemini_api_key: string;
  openai_api_key: string;
  groq_api_key: string;
  agent_name: string;
}

export default function AISettingsPage({ embedded = false }: { embedded?: boolean }) {
  const { currentCompany, loading: companyLoading } = useCompany();
  const companyId = currentCompany?.id;
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (companyId) {
      loadSettings();
    } else if (!companyLoading) {
      // Se não está mais carregando a empresa e não há companyId,
      // para de mostrar "Carregando..."
      setIsLoading(false);
    }
  }, [companyId, companyLoading]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      const { data: existingSettings, error: fetchError } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (fetchError) {
        console.error("Erro ao buscar configurações:", fetchError);
        toast.error("Erro ao buscar configurações de IA");
        throw fetchError;
      }

      if (existingSettings) {
        setSettings({
          ...existingSettings,
          copilot_script: (existingSettings as any).copilot_script || "",
          gemini_api_key: (existingSettings as any).gemini_api_key || "",
          openai_api_key: (existingSettings as any).openai_api_key || "",
          groq_api_key: (existingSettings as any).groq_api_key || "",
          agent_name: (existingSettings as any).agent_name || "Copiloto",
        } as AISettings);
      } else {
        const defaultSettings: AISettings = {
          is_enabled: true,
          default_mode: "auto",
          personality: "professional",
          language: "pt-BR",
          response_delay_ms: 2000,
          typing_indicator: true,
          max_messages_before_handoff: 10,
          max_response_length: 500,
          handoff_on_negative_sentiment: true,
          handoff_on_high_value: true,
          high_value_threshold: 5000,
          handoff_keywords: ["atendente", "humano", "pessoa", "falar com alguém"],
          active_hours_start: "08:00",
          active_hours_end: "22:00",
          active_on_weekends: true,
          greeting_message: "Olá! Como posso ajudar você hoje?",
          handoff_message: "Vou transferir você para um de nossos especialistas. Um momento!",
          fallback_message: "No momento estamos fora do horário de atendimento. Retornaremos em breve!",
          system_prompt: "Você é um assistente virtual prestativo e profissional.",
          n8n_webhook_url: "",
          n8n_api_key: generateApiKey(),
          copilot_script: "",
          gemini_api_key: "",
          openai_api_key: "",
          groq_api_key: "",
          agent_name: "Copiloto",
        };

        console.log("Criando configurações padrão para company_id:", companyId);

        const { data: newSettings, error: insertError } = await supabase
          .from("ai_settings")
          .insert({
            company_id: companyId,
            ...defaultSettings,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao criar configurações:", insertError);
          toast.error("Erro ao criar configurações de IA. Verifique suas permissões.");
          throw insertError;
        }

        console.log("Configurações criadas com sucesso:", newSettings);
        setSettings(newSettings as unknown as AISettings);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações de IA:", error);
      toast.error("Erro ao carregar configurações de IA");
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = () => {
    return 'ai_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);

    // Remove campos que não devem ser atualizados
    const { id, company_id, created_at, updated_at, ...updateData } = settings as any;

    const { error } = await supabase
      .from('ai_settings')
      .update(updateData)
      .eq('company_id', companyId);

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.message || 'Erro ao salvar');
      setIsSaving(false);
      return;
    }

    // Enviar configurações via webhook para o n8n
    if (settings.n8n_webhook_url) {
      try {
        const webhookPayload = {
          event_type: 'ai_settings_updated',
          company_id: companyId,
          timestamp: new Date().toISOString(),

          // Dados da Evolution API (para o agente se conectar ao WhatsApp)
          evolution: {
            api_url: currentCompany?.evolution_api_url || '',
            api_key: currentCompany?.evolution_api_key || '',
            instance_name: currentCompany?.evolution_instance_name || '',
          },

          // Dados da empresa
          company: {
            name: currentCompany?.name || '',
            cnpj: currentCompany?.cnpj || '',
            email: currentCompany?.email || '',
            phone: currentCompany?.phone || '',
          },

          settings: {
            // Identidade do Agente
            agent_name: settings.agent_name,

            // Ativação
            is_enabled: settings.is_enabled,
            default_mode: settings.default_mode,
            personality: settings.personality,
            language: settings.language,

            // Horário de Funcionamento
            active_hours_start: settings.active_hours_start,
            active_hours_end: settings.active_hours_end,
            active_on_weekends: settings.active_on_weekends,

            // Tempo de Resposta
            response_delay_ms: settings.response_delay_ms,
            typing_indicator: settings.typing_indicator,

            // Limites
            max_messages_before_handoff: settings.max_messages_before_handoff,
            max_response_length: settings.max_response_length,

            // Transferência
            handoff_keywords: settings.handoff_keywords,
            handoff_on_negative_sentiment: settings.handoff_on_negative_sentiment,
            handoff_on_high_value: settings.handoff_on_high_value,
            high_value_threshold: settings.high_value_threshold,

            // Mensagens Padrão
            greeting_message: settings.greeting_message,
            handoff_message: settings.handoff_message,
            fallback_message: settings.fallback_message,
            system_prompt: settings.system_prompt,

            // Script do Copiloto
            copilot_script: settings.copilot_script,
          },
        };

        const response = await fetch(settings.n8n_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-ai-key': settings.n8n_api_key || '',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          console.warn('Webhook N8N retornou erro:', response.status);
          toast.warning('Configurações salvas, mas o webhook N8N falhou');
        } else {
          console.log('Configurações enviadas para N8N com sucesso');
          toast.success('Configurações salvas e sincronizadas com N8N!');
        }
      } catch (webhookError) {
        console.error('Erro ao enviar webhook para N8N:', webhookError);
        toast.warning('Configurações salvas, mas não foi possível sincronizar com N8N');
      }
    } else {
      toast.success('Configurações salvas!');
    }

    setIsSaving(false);
  };

  const addKeyword = () => {
    if (!newKeyword.trim() || !settings) return;
    setSettings({
      ...settings,
      handoff_keywords: [...settings.handoff_keywords, newKeyword.trim().toLowerCase()],
    });
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      handoff_keywords: settings.handoff_keywords.filter(k => k !== keyword),
    });
  };

  const regenerateApiKey = async () => {
    if (!settings) return;
    const newKey = generateApiKey();
    setSettings({ ...settings, n8n_api_key: newKey });
    toast.success('Nova API Key gerada - Lembre-se de atualizar no N8N!');
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/functions/v1/ai-webhook`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const copyApiKey = () => {
    if (settings?.n8n_api_key) {
      navigator.clipboard.writeText(settings.n8n_api_key);
      toast.success('API Key copiada!');
    }
  };

  const content = (
    <PermissionGate permission="settings.integrations">
      {isLoading || companyLoading ? (
        <div className={embedded ? "p-4" : "p-6"}>Carregando...</div>
      ) : !companyId ? (
        <div className={embedded ? "p-4" : "p-6"}>
          Selecione uma empresa para configurar o Assistente de IA
        </div>
      ) : !settings ? (
        <div className={embedded ? "p-4" : "p-6"}>
          Erro ao carregar configurações. Tente novamente.
        </div>
      ) : (
        <div className={embedded ? "space-y-6" : "p-6 space-y-6 max-w-4xl"}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={embedded ? "text-xl font-bold flex items-center gap-2" : "text-2xl font-bold flex items-center gap-2"}>
                <Bot className="h-6 w-6 text-violet-600" />
                Configurações da IA
              </h1>
              <p className="text-muted-foreground">
                Configure o comportamento do assistente de IA
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="handoff">Transferência</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="copilot">Copiloto</TabsTrigger>
              <TabsTrigger value="ai-providers">Chaves IA</TabsTrigger>
              <TabsTrigger value="integration">Integração N8N</TabsTrigger>
            </TabsList>

            {/* Tab Geral */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identidade do Agente</CardTitle>
                  <CardDescription>Personalize como o agente aparece para os atendentes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="agent_name">Nome do Agente</Label>
                    <Input
                      id="agent_name"
                      value={settings.agent_name}
                      onChange={(e) => setSettings({ ...settings, agent_name: e.target.value })}
                      placeholder="Ex: Copiloto, Max, Assistente..."
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Este nome aparecerá no painel do Copiloto
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ativação</CardTitle>
                  <CardDescription>Controle se a IA está ativa globalmente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>IA Habilitada</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativa/desativa a IA para todas as conversas
                      </p>
                    </div>
                    <Switch
                      checked={settings.is_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label>Modo Padrão</Label>
                    <Select
                      value={settings.default_mode}
                      onValueChange={(value) => setSettings({ ...settings, default_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático - IA responde sozinha</SelectItem>
                        <SelectItem value="suggestion">Sugestão - IA sugere, humano envia</SelectItem>
                        <SelectItem value="off">Desligado - Apenas humanos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Personalidade</Label>
                    <Select
                      value={settings.personality}
                      onValueChange={(value) => setSettings({ ...settings, personality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="friendly">Amigável</SelectItem>
                        <SelectItem value="technical">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Horário de Funcionamento</CardTitle>
                  <CardDescription>Quando a IA deve responder automaticamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={settings.active_hours_start}
                        onChange={(e) => setSettings({ ...settings, active_hours_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={settings.active_hours_end}
                        onChange={(e) => setSettings({ ...settings, active_hours_end: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativa nos fins de semana</Label>
                    </div>
                    <Switch
                      checked={settings.active_on_weekends}
                      onCheckedChange={(checked) => setSettings({ ...settings, active_on_weekends: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Comportamento */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tempo de Resposta</CardTitle>
                  <CardDescription>Simula tempo de digitação para parecer mais humano</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Delay antes de responder: {settings.response_delay_ms}ms</Label>
                    <Slider
                      value={[settings.response_delay_ms]}
                      onValueChange={([value]) => setSettings({ ...settings, response_delay_ms: value })}
                      min={0}
                      max={5000}
                      step={500}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      0ms = instantâneo, 5000ms = 5 segundos
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar "digitando..."</Label>
                      <p className="text-sm text-muted-foreground">
                        Exibe indicador de digitação enquanto processa
                      </p>
                    </div>
                    <Switch
                      checked={settings.typing_indicator}
                      onCheckedChange={(checked) => setSettings({ ...settings, typing_indicator: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Limites</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Máximo de mensagens antes de transferir: {settings.max_messages_before_handoff}</Label>
                    <Slider
                      value={[settings.max_messages_before_handoff]}
                      onValueChange={([value]) => setSettings({ ...settings, max_messages_before_handoff: value })}
                      min={3}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Tamanho máximo da resposta: {settings.max_response_length} caracteres</Label>
                    <Slider
                      value={[settings.max_response_length]}
                      onValueChange={([value]) => setSettings({ ...settings, max_response_length: value })}
                      min={100}
                      max={2000}
                      step={100}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Transferência */}
            <TabsContent value="handoff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Palavras-chave de Transferência</CardTitle>
                  <CardDescription>
                    Quando o lead mencionar essas palavras, a IA transfere para um humano
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova palavra-chave..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword}>Adicionar</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {settings.handoff_keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transferência Automática</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Transferir em sentimento negativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando detectar frustração ou raiva do lead
                      </p>
                    </div>
                    <Switch
                      checked={settings.handoff_on_negative_sentiment}
                      onCheckedChange={(checked) => setSettings({ ...settings, handoff_on_negative_sentiment: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Transferir em alto valor</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando o lead mencionar valores altos
                      </p>
                    </div>
                    <Switch
                      checked={settings.handoff_on_high_value}
                      onCheckedChange={(checked) => setSettings({ ...settings, handoff_on_high_value: checked })}
                    />
                  </div>

                  {settings.handoff_on_high_value && (
                    <div>
                      <Label>Valor mínimo para transferência: R$ {settings.high_value_threshold.toLocaleString()}</Label>
                      <Slider
                        value={[settings.high_value_threshold]}
                        onValueChange={([value]) => setSettings({ ...settings, high_value_threshold: value })}
                        min={1000}
                        max={50000}
                        step={1000}
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Mensagens */}
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens Padrão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Mensagem de saudação</Label>
                    <Textarea
                      value={settings.greeting_message || ''}
                      onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                      placeholder="Olá! Sou o assistente virtual da empresa. Como posso ajudar?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Mensagem ao transferir</Label>
                    <Textarea
                      value={settings.handoff_message}
                      onChange={(e) => setSettings({ ...settings, handoff_message: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Mensagem fora do horário</Label>
                    <Textarea
                      value={settings.fallback_message}
                      onChange={(e) => setSettings({ ...settings, fallback_message: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Prompt de Sistema (Avançado)</Label>
                    <Textarea
                      value={settings.system_prompt || ''}
                      onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                      placeholder="Instruções adicionais para a IA..."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Este prompt é enviado junto com cada mensagem para contextualizar a IA
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Copiloto */}
            <TabsContent value="copilot" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Script do Copiloto (Assistente Amarelo)</CardTitle>
                  <CardDescription>
                    Defina diretrizes, scripts de vendas ou instruções específicas para o assistente que sugere respostas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Script de Vendas / Diretrizes</Label>
                    <Textarea
                      value={settings.copilot_script || ''}
                      onChange={(e) => setSettings({ ...settings, copilot_script: e.target.value })}
                      placeholder="Ex: Sempre ofereça 10% de desconto na primeira compra. Se o cliente perguntar sobre prazo, diga que é de 5 dias úteis. Seja sempre muito educado."
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Essas instruções serão enviadas para a IA toda vez que ela analisar uma conversa.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Chaves IA */}
            <TabsContent value="ai-providers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chaves de API - IA</CardTitle>
                  <CardDescription>
                    Configure as chaves de API para análise de conversas. Gemini é gratuito (1500/dia), OpenAI é usado como backup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Google Gemini API Key (Grátis - Prioridade)</Label>
                    <Input
                      type="password"
                      value={settings.gemini_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                      placeholder="AIza..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Obtenha em: <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a>
                    </p>
                  </div>

                  <div>
                    <Label>OpenAI API Key (Pago - Fallback)</Label>
                    <Input
                      type="password"
                      value={settings.openai_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usada apenas se Gemini falhar. Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">OpenAI Platform</a>
                    </p>
                  </div>

                  <div>
                    <Label>Groq API Key (Grátis - Fallback Rápido)</Label>
                    <Input
                      type="password"
                      value={settings.groq_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, groq_api_key: e.target.value })}
                      placeholder="gsk_..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usa Llama 3.1 70B, muito rápido! Obtenha em: <a href="https://console.groq.com/keys" target="_blank" className="underline">Groq Console</a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Integração */}
            <TabsContent value="integration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integração com N8N</CardTitle>
                  <CardDescription>
                    Configure a conexão com seu workflow de IA no N8N
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>URL do Webhook (enviar para N8N)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/functions/v1/ai-webhook`}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button variant="outline" onClick={copyWebhookUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use esta URL no N8N para enviar dados processados de volta
                    </p>
                  </div>

                  <div>
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.n8n_api_key}
                        readOnly
                        className="bg-gray-50 font-mono text-sm"
                      />
                      <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" onClick={copyApiKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adicione esta key no header "x-ai-key" das requisições do N8N
                    </p>
                  </div>

                  <Button variant="outline" onClick={regenerateApiKey}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar nova API Key
                  </Button>

                  <div>
                    <Label>URL do Webhook N8N (opcional)</Label>
                    <Input
                      value={settings.n8n_webhook_url || ''}
                      onChange={(e) => setSettings({ ...settings, n8n_webhook_url: e.target.value })}
                      placeholder="https://seu-n8n.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL do N8N para enviar mensagens recebidas para processamento
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Integração</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                    <p className="text-muted-foreground mb-2">// No N8N, envie para nosso webhook:</p>
                    <pre className="text-xs overflow-x-auto">{`POST /functions/v1/ai-webhook
Headers:
  Content-Type: application/json
  x-ai-key: ${settings.n8n_api_key?.substring(0, 10)}...

Body:
{
  "event_type": "message_sent" | "insight_detected" | etc,
  "conversation_id": "uuid",
  "contact_id": "uuid", 
  "company_id": "uuid",
  "message": { ... },
  "insights": [ ... ],
  "qualification": { ... }
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PermissionGate>
  );

  if (embedded) {
    return content;
  }

  return <MainLayout>{content}</MainLayout>;
}
