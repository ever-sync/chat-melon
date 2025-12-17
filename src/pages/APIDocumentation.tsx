import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, Key, Lock, Send, Users, FileText, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

const APIDocumentation = () => {
  const { currentCompany } = useCompany();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const baseUrl = `${window.location.origin}/api/v1`;

  const endpoints = [
    {
      category: 'Contatos',
      icon: Users,
      items: [
        { method: 'GET', path: '/contacts', description: 'Lista todos os contatos' },
        { method: 'GET', path: '/contacts/:id', description: 'Busca contato por ID' },
        { method: 'POST', path: '/contacts', description: 'Cria novo contato' },
        { method: 'PUT', path: '/contacts/:id', description: 'Atualiza contato' },
        { method: 'DELETE', path: '/contacts/:id', description: 'Remove contato' },
      ],
    },
    {
      category: 'Mensagens',
      icon: Send,
      items: [
        { method: 'POST', path: '/messages/send', description: 'Envia mensagem WhatsApp' },
        { method: 'GET', path: '/conversations', description: 'Lista conversas' },
        {
          method: 'GET',
          path: '/conversations/:id/messages',
          description: 'Mensagens da conversa',
        },
      ],
    },
    {
      category: 'Negócios',
      icon: FileText,
      items: [
        { method: 'GET', path: '/deals', description: 'Lista negócios do pipeline' },
        { method: 'POST', path: '/deals', description: 'Cria novo negócio' },
        { method: 'PUT', path: '/deals/:id', description: 'Atualiza negócio' },
        { method: 'PUT', path: '/deals/:id/stage', description: 'Move para outra etapa' },
      ],
    },
    {
      category: 'Produtos',
      icon: ShoppingBag,
      items: [
        { method: 'GET', path: '/products', description: 'Lista produtos' },
        { method: 'POST', path: '/products', description: 'Cria produto' },
        { method: 'PUT', path: '/products/:id', description: 'Atualiza produto' },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Pública</h1>
          <p className="text-muted-foreground">Integre o MelonChat com seus sistemas externos</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="authentication">Autenticação</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use sua API Key para autenticar requisições
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted p-2 rounded text-xs truncate">
                      {currentCompany?.id
                        ? `sk_live_${currentCompany.id.slice(0, 8)}...`
                        : 'Carregando...'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`sk_live_${currentCompany?.id}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Endpoint base para todas as requisições
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted p-2 rounded text-xs truncate">{baseUrl}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(baseUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Rate Limit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Limite de requisições por minuto
                  </p>
                  <div className="text-2xl font-bold">100 req/min</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authentication">
            <Card>
              <CardHeader>
                <CardTitle>Como Autenticar</CardTitle>
                <CardDescription>
                  Todas as requisições devem incluir o header de autorização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Header obrigatório:</p>
                  <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemplo com cURL:</p>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {`curl -X GET "${baseUrl}/contacts" \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-6">
              {endpoints.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.items.map((endpoint, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Badge
                            className={`${getMethodColor(endpoint.method)} text-white min-w-[60px] justify-center`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                          <span className="text-sm text-muted-foreground">
                            {endpoint.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {`POST /messages/send
{
  "to": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "type": "text"
}`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Criar Contato</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {`POST /contacts
{
  "name": "João Silva",
  "phone_number": "5511999999999",
  "email": "joao@email.com",
  "tags": ["cliente", "vip"]
}`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Criar Negócio</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {`POST /deals
{
  "title": "Proposta Nova",
  "contact_id": "uuid-do-contato",
  "value": 5000,
  "pipeline_id": "uuid-do-pipeline",
  "stage_id": "uuid-da-etapa"
}`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resposta de Sucesso</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {`{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default APIDocumentation;
