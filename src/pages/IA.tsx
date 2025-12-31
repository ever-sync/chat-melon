import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { AssistantSettings } from '@/components/ai-assistant/AssistantSettings';
import { TranscriptionSettings } from '@/components/settings/TranscriptionSettings';
import AISettingsPage from '@/pages/settings/AISettingsPage';
import { Sparkles, FileAudio, Gauge, Bot, Settings2, Key, Webhook, Copy, Eye, EyeOff } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function IA() {
  const [activeTab, setActiveTab] = useState('assistant');
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const [copilotScript, setCopilotScript] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Integrations state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [n8nApiKey, setN8nApiKey] = useState('');

  useEffect(() => {
    if (companyId) {
      loadSettings();
    }
  }, [companyId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCopilotScript(data.copilot_script || '');
        setGeminiApiKey(data.gemini_api_key || '');
        setOpenaiApiKey(data.openai_api_key || '');
        setGroqApiKey(data.groq_api_key || '');
        setN8nWebhookUrl(data.n8n_webhook_url || '');
        setN8nApiKey(data.n8n_api_key || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = () => {
    return (
      'ai_' +
      Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  };

  const regenerateApiKey = async () => {
    const newKey = generateApiKey();
    setN8nApiKey(newKey);
    toast.success('Nova API Key gerada - Lembre-se de salvar!');
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/functions/v1/ai-webhook`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const copyApiKey = () => {
    if (n8nApiKey) {
      navigator.clipboard.writeText(n8nApiKey);
      toast.success('API Key copiada!');
    }
  };

  const handleSaveCopilot = async () => {
    if (!companyId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('ai_settings')
        .update({ copilot_script: copilotScript })
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success('Configurações do copiloto salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntegrations = async () => {
    if (!companyId) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('ai_settings')
        .update({
          gemini_api_key: geminiApiKey,
          openai_api_key: openaiApiKey,
          groq_api_key: groqApiKey,
          n8n_webhook_url: n8nWebhookUrl,
          n8n_api_key: n8nApiKey,
        })
        .eq('company_id', companyId);

      if (error) throw error;

      toast.success('Configurações de integração salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Automação & IA
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Configure as funcionalidades de inteligência artificial
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <div className="border-b px-6 pt-4">
              <TabsList className="grid w-full max-w-5xl grid-cols-5 gap-4 bg-transparent">
                <TabsTrigger
                  value="assistant"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Agente de atendimento</span>
                </TabsTrigger>

                <TabsTrigger
                  value="transcription"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  <FileAudio className="h-4 w-4" />
                  <span className="font-medium">Transcrição</span>
                </TabsTrigger>

                <TabsTrigger
                  value="copilot"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">Copiloto</span>
                </TabsTrigger>

                <TabsTrigger
                  value="monitoring"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  <Gauge className="h-4 w-4" />
                  <span className="font-medium">Monitor de Atendimento</span>
                </TabsTrigger>

                <TabsTrigger
                  value="integrations"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="font-medium">Integrações e Config</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="assistant" className="mt-0 space-y-6">
                <AISettingsPage embedded={true} />
              </TabsContent>

              <TabsContent value="transcription" className="mt-0 space-y-6">
                <TranscriptionSettings />
              </TabsContent>

              <TabsContent value="copilot" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-600" />
                      Script do Copiloto (Assistente Amarelo)
                    </CardTitle>
                    <CardDescription>
                      Defina diretrizes, scripts de vendas ou instruções específicas para o assistente
                      que sugere respostas durante os atendimentos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                    ) : (
                      <>
                        <div>
                          <Label>Script de Vendas / Diretrizes</Label>
                          <Textarea
                            value={copilotScript}
                            onChange={(e) => setCopilotScript(e.target.value)}
                            placeholder="Ex: Sempre ofereça 10% de desconto na primeira compra. Se o cliente perguntar sobre prazo, diga que é de 5 dias úteis. Seja sempre muito educado."
                            rows={15}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Essas instruções serão enviadas para a IA toda vez que ela analisar uma
                            conversa e sugerir respostas para os atendentes.
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleSaveCopilot} disabled={isSaving}>
                            {isSaving ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monitoring" className="mt-0 space-y-6">
                {companyId && <AssistantSettings companyId={companyId} />}
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 space-y-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : (
                  <>
                    {/* Chaves IA Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="h-5 w-5 text-purple-600" />
                          Chaves de API - IA
                        </CardTitle>
                        <CardDescription>
                          Configure as chaves de API para análise de conversas. Gemini é gratuito (1500/dia), OpenAI
                          é usado como backup.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Google Gemini API Key (Grátis - Prioridade)</Label>
                          <Input
                            type="password"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="AIza..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Obtenha em:{' '}
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Google AI Studio
                            </a>
                          </p>
                        </div>

                        <div>
                          <Label>OpenAI API Key (Pago - Fallback)</Label>
                          <Input
                            type="password"
                            value={openaiApiKey}
                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                            placeholder="sk-..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Usada apenas se Gemini falhar. Obtenha em:{' '}
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              OpenAI Platform
                            </a>
                          </p>
                        </div>

                        <div>
                          <Label>Groq API Key (Grátis - Fallback Rápido)</Label>
                          <Input
                            type="password"
                            value={groqApiKey}
                            onChange={(e) => setGroqApiKey(e.target.value)}
                            placeholder="gsk_..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Usa Llama 3.1 70B, muito rápido! Obtenha em:{' '}
                            <a
                              href="https://console.groq.com/keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Groq Console
                            </a>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Integração N8N Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Webhook className="h-5 w-5 text-purple-600" />
                          Integração com N8N
                        </CardTitle>
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
                              value={n8nApiKey}
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
                            value={n8nWebhookUrl}
                            onChange={(e) => setN8nWebhookUrl(e.target.value)}
                            placeholder="https://seu-n8n.com/webhook/..."
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            URL do N8N para enviar mensagens recebidas para processamento
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fluxo de Integração */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Fluxo de Integração</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                          <p className="text-muted-foreground mb-2">// No N8N, envie para nosso webhook:</p>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{`POST /functions/v1/ai-webhook
Headers:
  Content-Type: application/json
  x-ai-key: ${n8nApiKey?.substring(0, 10)}...

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

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button onClick={handleSaveIntegrations} disabled={isSaving}>
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Integrações
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
