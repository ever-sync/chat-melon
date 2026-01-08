import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Wand2,
  Layout,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string | null;
}

interface AIProvider {
  id?: string;
  provider: string;
  api_key: string;
  model_name: string;
  is_active: boolean;
}

export default function CreateLandingPage() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<'ai' | 'template'>('ai');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [aiProviders, setAIProviders] = useState<AIProvider[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // AI Form State
  const [selectedProvider, setSelectedProvider] = useState('');
  const [aiPrompt, setAIPrompt] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageDescription, setPageDescription] = useState('');

  // Template Form State
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    loadAIProviders();
    loadTemplates();
  }, [currentCompany]);

  const loadAIProviders = async () => {
    if (!currentCompany?.id) return;

    setLoadingProviders(true);
    try {
      const { data, error } = await supabase
        .from('ai_provider_keys')
        .select('id, provider, api_key, model_name, is_active')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true);

      if (error) throw error;
      setAIProviders(data || []);

      if (data && data.length > 0) {
        setSelectedProvider(data[0].provider);
      }
    } catch (error: any) {
      console.error('Error loading AI providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setPageName(name);
    if (!pageSlug || pageSlug === generateSlug(pageName)) {
      setPageSlug(generateSlug(name));
    }
  };

  const handleCreateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Por favor, descreva a landing page que deseja criar');
      return;
    }

    if (!pageName.trim() || !pageSlug.trim()) {
      toast.error('Preencha o nome e o slug da página');
      return;
    }

    if (!selectedProvider) {
      toast.error('Selecione um provedor de IA');
      return;
    }

    setLoading(true);

    try {
      // Generate landing page via Supabase Edge Function
      toast.info('Gerando landing page com IA...');

      const { data, error } = await supabase.functions.invoke('generate-landing-page', {
        body: {
          company_id: currentCompany?.id,
          provider: selectedProvider,
          prompt: aiPrompt,
          name: pageName,
          slug: pageSlug,
          description: pageDescription
        }
      });

      if (error) throw error;

      toast.success('Landing page gerada com sucesso!');
      navigate(`/marketing/landing-pages/${data.id}/preview`);
    } catch (error: any) {
      console.error('Error generating landing page:', error);
      toast.error(error.message || 'Erro ao gerar landing page');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template');
      return;
    }

    if (!pageName.trim() || !pageSlug.trim()) {
      toast.error('Preencha o nome e o slug da página');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('id', selectedTemplate)
        .single();

      if (templateError) throw templateError;

      // Create landing page from template
      const { data: landingPage, error: lpError } = await supabase
        .from('landing_pages')
        .insert({
          company_id: currentCompany?.id,
          name: pageName,
          slug: pageSlug,
          description: pageDescription,
          template_id: selectedTemplate,
          html_content: '<div>Template base - edite para personalizar</div>',
          status: 'draft',
          created_by: user?.id
        })
        .select()
        .single();

      if (lpError) throw lpError;

      toast.success('Landing page criada com sucesso!');
      navigate(`/marketing/landing-pages/${landingPage.id}/edit`);
    } catch (error: any) {
      console.error('Error creating landing page:', error);
      toast.error('Erro ao criar landing page');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      claude: '🧠',
      openai: '🤖',
      gemini: '✨'
    };
    return icons[provider] || '🤖';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/marketing/landing-pages')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Criar Landing Page</h2>
          <p className="text-gray-500 mt-1">Use IA ou templates prontos</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ai' | 'template')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar com IA
          </TabsTrigger>
          <TabsTrigger value="template">
            <Layout className="h-4 w-4 mr-2" />
            Usar Template
          </TabsTrigger>
        </TabsList>

        {/* AI Generation Tab */}
        <TabsContent value="ai" className="space-y-6 mt-6">
          {loadingProviders ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : aiProviders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa configurar pelo menos um provedor de IA antes de gerar landing pages.
                <Button
                  variant="link"
                  onClick={() => navigate('/marketing/landing-pages/ai-settings')}
                  className="ml-2"
                >
                  Configurar agora
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-purple-500" />
                    Descreva sua Landing Page
                  </CardTitle>
                  <CardDescription>
                    A IA irá gerar uma página completa baseada na sua descrição
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Provedor de IA</Label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {aiProviders.map((provider) => (
                        <option key={provider.provider} value={provider.provider}>
                          {getProviderIcon(provider.provider)} {provider.provider.toUpperCase()} - {provider.model_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="ai-prompt">
                      Prompt para IA <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Ex: Crie uma landing page para um curso online de marketing digital. Deve ter uma seção hero com chamada forte, benefícios do curso, depoimentos de alunos, preços e um formulário de inscrição. Use cores vibrantes e um design moderno."
                      value={aiPrompt}
                      onChange={(e) => setAIPrompt(e.target.value)}
                      rows={6}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Seja específico sobre o objetivo, público-alvo, seções desejadas e estilo visual
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="page-name">
                        Nome da Página <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="page-name"
                        placeholder="Ex: Curso de Marketing Digital"
                        value={pageName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="page-slug">
                        Slug (URL) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="page-slug"
                        placeholder="curso-marketing-digital"
                        value={pageSlug}
                        onChange={(e) => setPageSlug(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        /lp/{pageSlug || 'seu-slug'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="page-description">Descrição (opcional)</Label>
                    <Textarea
                      id="page-description"
                      placeholder="Descrição interna para organização"
                      value={pageDescription}
                      onChange={(e) => setPageDescription(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/marketing/landing-pages')}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateWithAI}
                  disabled={loading || !aiPrompt.trim() || !pageName.trim() || !pageSlug.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Landing Page
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Quanto mais detalhes você fornecer no prompt, melhor será o resultado.
                  Inclua informações sobre cores, estilo, seções específicas e conteúdo desejado.
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Escolha um Template</CardTitle>
              <CardDescription>
                Selecione um template base e personalize depois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {template.thumbnail_url && (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      {template.name}
                      {selectedTemplate === template.id && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded">
                      {template.category}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-page-name">
                    Nome da Página <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-page-name"
                    placeholder="Ex: Página de Contato"
                    value={pageName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template-page-slug">
                    Slug (URL) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="template-page-slug"
                    placeholder="pagina-contato"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    /lp/{pageSlug || 'seu-slug'}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="template-page-description">Descrição (opcional)</Label>
                <Textarea
                  id="template-page-description"
                  placeholder="Descrição interna para organização"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/marketing/landing-pages')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              disabled={loading || !selectedTemplate || !pageName.trim() || !pageSlug.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Layout className="h-4 w-4 mr-2" />
                  Criar a partir do Template
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </MainLayout>
  );
}
