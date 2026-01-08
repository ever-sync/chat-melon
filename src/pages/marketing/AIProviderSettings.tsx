import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Brain, Key, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface AIProvider {
  id?: string;
  provider: string;
  api_key: string;
  model_name: string;
  is_active: boolean;
}

const AI_PROVIDERS = [
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    icon: '🧠',
    description: 'Modelos Claude da Anthropic - Excelente para textos criativos e longos'
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT)',
    models: [
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo'
    ],
    icon: '🤖',
    description: 'Modelos GPT da OpenAI - Versátil e rápido'
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    models: [
      'gemini-pro',
      'gemini-pro-vision'
    ],
    icon: '✨',
    description: 'Modelos Gemini do Google - Integrado com Google Cloud'
  }
];

export default function AIProviderSettings() {
  const { currentCompany } = useCompany();
  const [providers, setProviders] = useState<Record<string, AIProvider>>({});
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProviders();
  }, [currentCompany]);

  const loadProviders = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_provider_keys')
        .select('*')
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      const providersMap: Record<string, AIProvider> = {};
      data?.forEach((p) => {
        providersMap[p.provider] = {
          id: p.id,
          provider: p.provider,
          api_key: p.api_key,
          model_name: p.model_name,
          is_active: p.is_active
        };
      });

      setProviders(providersMap);
    } catch (error: any) {
      console.error('Error loading AI providers:', error);
      toast.error('Erro ao carregar configurações de IA');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProvider = async (providerValue: string) => {
    console.log('[DEBUG] handleSaveProvider called with:', providerValue);

    if (!currentCompany?.id) {
      console.log('[DEBUG] No company selected');
      toast.error('Empresa não selecionada');
      return;
    }

    const provider = providers[providerValue];
    console.log('[DEBUG] Provider data:', provider);

    if (!provider?.api_key || !provider?.model_name) {
      console.log('[DEBUG] Missing api_key or model_name');
      toast.error('Preencha a chave de API e selecione um modelo');
      return;
    }

    console.log('[DEBUG] Starting save process...');
    console.log('[DEBUG] Current company:', currentCompany);
    console.log('[DEBUG] Provider value:', providerValue);
    console.log('[DEBUG] Provider object:', provider);

    setSaving(prev => {
      console.log('[DEBUG] Setting saving state to true for:', providerValue);
      return { ...prev, [providerValue]: true };
    });

    try {
      console.log('[DEBUG] Entered try block');

      if (provider.id) {
        // Update
        console.log('[DEBUG] Updating existing provider with ID:', provider.id);
        const { data, error } = await supabase
          .from('ai_provider_keys')
          .update({
            api_key: provider.api_key,
            model_name: provider.model_name,
            is_active: provider.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', provider.id)
          .select();

        console.log('[DEBUG] Update result - data:', data);
        console.log('[DEBUG] Update result - error:', error);

        if (error) {
          console.error('[DEBUG] Update error:', error);
          throw error;
        }
      } else {
        // Insert
        console.log('[DEBUG] Inserting new provider');
        console.log('[DEBUG] Insert payload:', {
          company_id: currentCompany.id,
          provider: providerValue,
          api_key: provider.api_key.substring(0, 10) + '...',
          model_name: provider.model_name,
          is_active: provider.is_active
        });

        const { data, error } = await supabase
          .from('ai_provider_keys')
          .insert({
            company_id: currentCompany.id,
            provider: providerValue,
            api_key: provider.api_key,
            model_name: provider.model_name,
            is_active: provider.is_active
          })
          .select();

        console.log('[DEBUG] Insert result - data:', data);
        console.log('[DEBUG] Insert result - error:', error);

        if (error) {
          console.error('[DEBUG] Insert error:', error);
          throw error;
        }
      }

      console.log('[DEBUG] Save successful, showing toast');
      toast.success('Configuração salva com sucesso!');

      console.log('[DEBUG] Reloading providers...');
      await loadProviders();
      console.log('[DEBUG] Providers reloaded');

    } catch (error: any) {
      console.error('[DEBUG] Caught error:', error);
      console.error('[DEBUG] Error message:', error?.message);
      console.error('[DEBUG] Error details:', error?.details);
      console.error('[DEBUG] Full error object:', JSON.stringify(error, null, 2));
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      console.log('[DEBUG] Finally block - setting saving to false');
      setSaving(prev => {
        console.log('[DEBUG] Setting saving state to false for:', providerValue);
        return { ...prev, [providerValue]: false };
      });
    }

    console.log('[DEBUG] handleSaveProvider completed');
  };

  const updateProvider = (providerValue: string, updates: Partial<AIProvider>) => {
    setProviders({
      ...providers,
      [providerValue]: {
        ...providers[providerValue],
        provider: providerValue,
        api_key: providers[providerValue]?.api_key || '',
        model_name: providers[providerValue]?.model_name || '',
        is_active: providers[providerValue]?.is_active ?? true,
        ...updates
      }
    });
  };

  const toggleShowKey = (providerValue: string) => {
    setShowKeys({ ...showKeys, [providerValue]: !showKeys[providerValue] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações de IA</h2>
        <p className="text-gray-500 mt-1">
          Configure suas chaves de API para gerar landing pages com IA
        </p>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Suas chaves de API são armazenadas de forma segura e criptografadas.
          Apenas você e sua equipe têm acesso a elas. Os tokens usados serão debitados da sua conta com o provedor de IA.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {AI_PROVIDERS.map((aiProvider) => {
          const provider = providers[aiProvider.value];
          const isConfigured = !!provider?.api_key;

          return (
            <Card key={aiProvider.value}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{aiProvider.icon}</div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {aiProvider.label}
                        {isConfigured && provider?.is_active && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{aiProvider.description}</CardDescription>
                    </div>
                  </div>
                  {isConfigured && (
                    <Switch
                      checked={provider?.is_active ?? false}
                      onCheckedChange={(checked) => {
                        updateProvider(aiProvider.value, { is_active: checked });
                        handleSaveProvider(aiProvider.value);
                      }}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`${aiProvider.value}-key`}>Chave de API</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        id={`${aiProvider.value}-key`}
                        type={showKeys[aiProvider.value] ? 'text' : 'password'}
                        placeholder={`Insira sua chave de API do ${aiProvider.label}`}
                        value={provider?.api_key || ''}
                        onChange={(e) =>
                          updateProvider(aiProvider.value, { api_key: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(aiProvider.value)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[aiProvider.value] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`${aiProvider.value}-model`}>Modelo</Label>
                  <select
                    id={`${aiProvider.value}-model`}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={provider?.model_name || ''}
                    onChange={(e) =>
                      updateProvider(aiProvider.value, { model_name: e.target.value })
                    }
                  >
                    <option value="">Selecione um modelo</option>
                    {aiProvider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveProvider(aiProvider.value)}
                    disabled={!provider?.api_key || !provider?.model_name || saving[aiProvider.value]}
                  >
                    {saving[aiProvider.value] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Configuração
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como obter suas chaves de API:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Claude:</strong>{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                console.anthropic.com
              </a>
            </li>
            <li>
              <strong>OpenAI:</strong>{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </li>
            <li>
              <strong>Gemini:</strong>{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                makersuite.google.com/app/apikey
              </a>
            </li>
          </ul>
        </AlertDescription>
      </Alert>
      </div>
    </MainLayout>
  );
}
