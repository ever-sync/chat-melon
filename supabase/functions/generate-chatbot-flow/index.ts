import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatbotNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface ChatbotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface GenerateFlowRequest {
  request: string;
  currentNodes: ChatbotNode[];
  currentEdges: ChatbotEdge[];
  companyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request, currentNodes, currentEdges, companyId }: GenerateFlowRequest = await req.json();

    console.log('Generating chatbot flow for company:', companyId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar API key da empresa
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('company_id', companyId)
      .eq('service', 'openai')
      .eq('is_active', true)
      .maybeSingle();

    if (!apiKeyData?.key_value) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prompt para a IA
    const systemPrompt = `Você é um assistente especializado em criar fluxos de chatbot.
Você recebe uma descrição em linguagem natural e retorna um JSON com nós e conexões (edges) para criar o fluxo.

Tipos de nós disponíveis:
- start: Início do fluxo
- end: Fim do fluxo
- message: Enviar mensagem de texto
- question: Fazer uma pergunta e salvar resposta em variável
- menu: Menu de opções numeradas (até 10 opções)
- quick_reply: Botões de resposta rápida (até 3 botões)
- list: Lista interativa do WhatsApp
- condition: Condição lógica (if/else baseado em variáveis)
- delay: Aguardar tempo (segundos, minutos, horas)
- image: Enviar imagem
- video: Enviar vídeo
- audio: Enviar áudio
- document: Enviar documento
- sticker: Enviar sticker
- carousel: Carrossel de cards
- file_upload: Solicitar upload de arquivo
- location: Solicitar localização
- contact_card: Enviar cartão de contato
- rating: Avaliação com estrelas (1-5)
- nps: Net Promoter Score (0-10)
- calendar: Agendar data/hora
- ai_response: Resposta gerada por IA
- ai_classifier: Classificar mensagem com IA
- ai_sentiment: Análise de sentimento
- ai_extract: Extrair dados com IA
- ai_summarize: Resumir conversa
- ai_translate: Traduzir mensagem
- webhook: Chamar API externa
- action: Executar ação (adicionar tag, atribuir agente, criar deal)
- goto: Ir para outro nó
- random: Ramificação aleatória
- split: Teste A/B
- switch: Switch/case com múltiplas condições
- ab_test: Teste A/B avançado

Estrutura do Node:
{
  id: string (único, descritivo),
  type: string (um dos tipos acima),
  position: { x: number, y: number },
  data: {
    // Propriedades comuns:
    label?: string,

    // message node:
    message?: string,

    // question node:
    question?: string,
    variableName?: string,

    // menu node:
    menuText?: string,
    options?: Array<{ id: string, label: string, value: string }>,

    // quick_reply node:
    buttonText?: string,
    buttons?: Array<{ id: string, label: string }>,

    // list node:
    listTitle?: string,
    listDescription?: string,
    buttonLabel?: string,
    sections?: Array<{ title: string, items: Array<{ id: string, title: string, description?: string }> }>,

    // condition node:
    variable?: string,
    operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_empty',
    value?: string,

    // delay node:
    delayAmount?: number,
    delayUnit?: 'seconds' | 'minutes' | 'hours',

    // Media nodes (image, video, audio, document):
    mediaUrl?: string,
    caption?: string,

    // rating/nps:
    ratingQuestion?: string,
    saveToVariable?: string,

    // ai_response:
    prompt?: string,
    context?: string,

    // webhook:
    url?: string,
    method?: 'GET' | 'POST',
    headers?: Record<string, string>,
    body?: any,

    // action:
    actionType?: 'add_tag' | 'assign_agent' | 'create_deal' | 'transfer_queue',
    actionParams?: any
  }
}

Estrutura do Edge:
{
  id: string (único),
  source: string (id do nó origem),
  target: string (id do nó destino),
  sourceHandle?: string (para ramificações: 'true'/'false' para condition, 'option-0'/'option-1' para menu/list)
}

IMPORTANTE:
1. SEMPRE comece com um nó "start" na posição { x: 300, y: 0 }
2. Termine com um ou mais nós "end"
3. Posicione os nós em grid (x: múltiplo de 300, y: múltiplo de 150)
4. Use IDs descritivos (ex: "start-1", "menu-boas-vindas", "msg-despedida", "condition-horario")
5. Para menus/listas/condições, use sourceHandle nos edges:
   - Condition: sourceHandle: 'true' ou 'false'
   - Menu: sourceHandle: 'option-0', 'option-1', 'option-2', etc
   - List: sourceHandle: 'item-0', 'item-1', etc
6. Conecte todos os nós de forma lógica
7. Use variáveis entre chaves duplas para interpolar: {{nome}}, {{email}}, {{telefone}}

EXEMPLOS DE FLUXOS:

Exemplo 1 - Menu simples:
{
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 300, "y": 0 },
      "data": { "label": "Início" }
    },
    {
      "id": "menu-principal",
      "type": "menu",
      "position": { "x": 300, "y": 150 },
      "data": {
        "label": "Menu Principal",
        "menuText": "Olá! Como posso ajudar?\n\n1. Vendas\n2. Suporte\n3. Financeiro",
        "options": [
          { "id": "1", "label": "Vendas", "value": "vendas" },
          { "id": "2", "label": "Suporte", "value": "suporte" },
          { "id": "3", "label": "Financeiro", "value": "financeiro" }
        ]
      }
    },
    {
      "id": "msg-vendas",
      "type": "message",
      "position": { "x": 0, "y": 300 },
      "data": {
        "label": "Mensagem Vendas",
        "message": "Transferindo para vendas..."
      }
    },
    {
      "id": "msg-suporte",
      "type": "message",
      "position": { "x": 300, "y": 300 },
      "data": {
        "label": "Mensagem Suporte",
        "message": "Transferindo para suporte..."
      }
    },
    {
      "id": "msg-financeiro",
      "type": "message",
      "position": { "x": 600, "y": 300 },
      "data": {
        "label": "Mensagem Financeiro",
        "message": "Transferindo para financeiro..."
      }
    },
    {
      "id": "end-1",
      "type": "end",
      "position": { "x": 300, "y": 450 },
      "data": { "label": "Fim" }
    }
  ],
  "edges": [
    { "id": "e-start-menu", "source": "start-1", "target": "menu-principal" },
    { "id": "e-menu-vendas", "source": "menu-principal", "target": "msg-vendas", "sourceHandle": "option-0" },
    { "id": "e-menu-suporte", "source": "menu-principal", "target": "msg-suporte", "sourceHandle": "option-1" },
    { "id": "e-menu-financeiro", "source": "menu-principal", "target": "msg-financeiro", "sourceHandle": "option-2" },
    { "id": "e-vendas-end", "source": "msg-vendas", "target": "end-1" },
    { "id": "e-suporte-end", "source": "msg-suporte", "target": "end-1" },
    { "id": "e-financeiro-end", "source": "msg-financeiro", "target": "end-1" }
  ],
  "description": "Fluxo com menu de 3 opções (Vendas, Suporte, Financeiro)"
}

Retorne APENAS um JSON válido no formato:
{
  "nodes": [...],
  "edges": [...],
  "description": "Breve descrição do que foi criado"
}`;

    const userPrompt = `Fluxo existente: ${currentNodes.length} nós, ${currentEdges.length} conexões

Solicitação do usuário: ${request}

${currentNodes.length === 0 ? 'Crie um fluxo COMPLETO desde o início.' : 'Adicione ao fluxo existente.'}`;

    // Chamar OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.key_value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiData = await response.json();
    const flowData = JSON.parse(aiData.choices[0].message.content);

    // Ajustar posições para não sobrepor nós existentes
    const maxY = currentNodes.length > 0
      ? Math.max(...currentNodes.map(n => n.position.y))
      : 0;

    const adjustedNodes = flowData.nodes.map((node: ChatbotNode) => ({
      ...node,
      position: {
        x: node.position.x,
        y: node.position.y + (currentNodes.length > 0 ? maxY + 200 : 0)
      }
    }));

    console.log('Generated flow:', {
      nodesCount: adjustedNodes.length,
      edgesCount: flowData.edges.length,
      description: flowData.description
    });

    return new Response(
      JSON.stringify({
        nodes: adjustedNodes,
        edges: flowData.edges,
        description: flowData.description
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-chatbot-flow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
