# 🚀 Roadmap de Melhorias - MelonChat

## Visão Geral

Este documento detalha o plano de implementação de todas as melhorias identificadas para posicionar o MelonChat como líder no mercado de CRM conversacional.

---

## 📅 Cronograma por Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FASE 1: Quick Wins & Foundation          │ Sprints 1-4                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 2: Omnichannel & IA                 │ Sprints 5-12                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 3: E-commerce & Automação           │ Sprints 13-18                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 4: Analytics & Integrações          │ Sprints 19-24                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 5: Mobile & Enterprise              │ Sprints 25-32                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 📦 FASE 1: Quick Wins & Foundation

**Objetivo:** Implementar melhorias de alto impacto com baixo esforço, estabelecendo base para features maiores.

## Sprint 1-2: Produtividade do Atendente

### 1.1 Canned Responses 2.0 (Atalhos de Teclado)

**Descrição:** Sistema de atalhos rápidos para inserir respostas predefinidas.

**Arquivos a criar/modificar:**
```
src/
├── components/chat/
│   ├── QuickResponseShortcuts.tsx      # Componente de atalhos
│   ├── ShortcutHelpModal.tsx           # Modal de ajuda com atalhos
│   └── MessageInput.tsx                # Modificar para detectar /comandos
├── hooks/
│   └── useQuickResponses.ts            # Hook para gerenciar atalhos
├── types/
│   └── quickResponses.ts               # Tipos para respostas rápidas
supabase/
├── migrations/
│   └── XXXXXX_quick_response_shortcuts.sql
```

**Schema do banco:**
```sql
CREATE TABLE quick_response_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  shortcut VARCHAR(50) NOT NULL,        -- ex: "/agend", "/preco"
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, shortcut)
);
```

**Funcionalidades:**
- [ ] Digitar `/` no input mostra lista de atalhos
- [ ] Autocomplete conforme digita (ex: `/age` → `/agendamento`)
- [ ] Suporte a variáveis ({{nome}}, {{produto}})
- [ ] Atalhos pessoais vs. da empresa
- [ ] Estatísticas de uso por atalho
- [ ] Importar/exportar atalhos

**Componentes UI:**
```tsx
// QuickResponseShortcuts.tsx
interface QuickResponseShortcutsProps {
  isOpen: boolean;
  searchTerm: string;
  onSelect: (response: QuickResponse) => void;
  onClose: () => void;
}

// Renderiza lista filtrada de atalhos
// Navegação por setas ↑↓ e Enter para selecionar
```

---

### 1.2 Snooze de Conversas

**Descrição:** Permite "adiar" uma conversa para que reapareça depois de um tempo.

**Arquivos a criar/modificar:**
```
src/
├── components/chat/
│   ├── SnoozeMenu.tsx                  # Menu de opções de snooze
│   ├── SnoozedConversationsBadge.tsx   # Indicador de conversas em snooze
│   └── ConversationList.tsx            # Filtrar snoozed
├── hooks/
│   └── useSnooze.ts                    # Lógica de snooze
supabase/
├── migrations/
│   └── XXXXXX_conversation_snooze.sql
├── functions/
│   └── check-snoozed-conversations/    # Cron para verificar expiração
```

**Schema do banco:**
```sql
ALTER TABLE conversations ADD COLUMN snoozed_until TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN snoozed_by UUID REFERENCES profiles(id);
ALTER TABLE conversations ADD COLUMN snooze_reason VARCHAR(255);

CREATE INDEX idx_conversations_snoozed ON conversations(snoozed_until)
WHERE snoozed_until IS NOT NULL;
```

**Opções de Snooze:**
- [ ] 30 minutos
- [ ] 1 hora
- [ ] 2 horas
- [ ] Amanhã 9h
- [ ] Próxima segunda 9h
- [ ] Data/hora customizada
- [ ] Quando cliente responder (cancela snooze)

**Fluxo:**
1. Usuário clica em "Snooze" na conversa
2. Seleciona tempo
3. Conversa some da lista principal
4. Badge mostra quantidade de snoozed
5. Cron verifica a cada minuto conversas expiradas
6. Conversa reaparece com destaque

---

### 1.3 Bulk Actions em Conversas

**Descrição:** Selecionar múltiplas conversas e aplicar ações em massa.

**Arquivos a criar/modificar:**
```
src/
├── components/chat/
│   ├── ConversationSelectionMode.tsx   # Modo de seleção
│   ├── BulkActionsToolbar.tsx          # Toolbar com ações
│   └── ConversationList.tsx            # Adicionar checkboxes
├── hooks/
│   └── useBulkConversationActions.ts   # Lógica de ações em massa
```

**Ações disponíveis:**
- [ ] Resolver conversas selecionadas
- [ ] Fechar conversas selecionadas
- [ ] Atribuir a usuário
- [ ] Adicionar label
- [ ] Remover label
- [ ] Arquivar
- [ ] Marcar como lida/não lida

**UI:**
```tsx
// BulkActionsToolbar.tsx
<div className="bulk-actions-toolbar">
  <span>{selectedCount} selecionadas</span>
  <Button onClick={handleResolveAll}>Resolver</Button>
  <Button onClick={handleAssign}>Atribuir</Button>
  <DropdownMenu>
    <DropdownMenuItem>Adicionar Label</DropdownMenuItem>
    <DropdownMenuItem>Arquivar</DropdownMenuItem>
    <DropdownMenuItem>Fechar</DropdownMenuItem>
  </DropdownMenu>
  <Button variant="ghost" onClick={handleClearSelection}>Cancelar</Button>
</div>
```

---

## Sprint 3-4: Widget de Chat & API Pública

### 1.4 Widget de Chat para Sites

**Descrição:** Componente embedável para sites que conecta ao MelonChat.

**Arquivos a criar:**
```
packages/
└── widget/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── src/
    │   ├── index.ts                    # Entry point
    │   ├── Widget.tsx                  # Componente principal
    │   ├── components/
    │   │   ├── ChatBubble.tsx          # Botão flutuante
    │   │   ├── ChatWindow.tsx          # Janela de chat
    │   │   ├── MessageList.tsx         # Lista de mensagens
    │   │   ├── MessageInput.tsx        # Input de mensagem
    │   │   └── PreChatForm.tsx         # Formulário inicial
    │   ├── hooks/
    │   │   ├── useWebSocket.ts         # Conexão realtime
    │   │   └── useWidgetConfig.ts      # Configurações
    │   ├── styles/
    │   │   └── widget.css              # Estilos isolados
    │   └── types/
    │       └── index.ts
    └── dist/                           # Build final

src/
├── pages/
│   └── WidgetSettings.tsx              # Configurações do widget
├── components/settings/
│   └── WidgetCustomizer.tsx            # Preview e customização
supabase/
├── migrations/
│   └── XXXXXX_widget_settings.sql
├── functions/
│   └── widget-api/                     # API para o widget
```

**Schema do banco:**
```sql
CREATE TABLE widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) UNIQUE,
  enabled BOOLEAN DEFAULT true,

  -- Aparência
  primary_color VARCHAR(7) DEFAULT '#22C55E',
  position VARCHAR(20) DEFAULT 'bottom-right',
  button_icon VARCHAR(50) DEFAULT 'chat',

  -- Textos
  greeting_message TEXT DEFAULT 'Olá! Como posso ajudar?',
  offline_message TEXT DEFAULT 'Estamos offline. Deixe sua mensagem.',

  -- Comportamento
  require_email BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  show_agent_photo BOOLEAN DEFAULT true,
  auto_open_delay INTEGER, -- ms para abrir automaticamente

  -- Horário
  business_hours_only BOOLEAN DEFAULT false,

  -- Domínios permitidos
  allowed_domains TEXT[], -- ['example.com', 'app.example.com']

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE widget_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  session_id VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  name VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,

  UNIQUE(company_id, session_id)
);
```

**Embed code gerado:**
```html
<!-- MelonChat Widget -->
<script>
  (function(w,d,s,c){
    w.MelonChatConfig = c;
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='https://widget.melonchat.com/v1/widget.js';
    f.parentNode.insertBefore(j,f);
  })(window,document,'script',{
    companyId: 'COMPANY_UUID',
    primaryColor: '#22C55E'
  });
</script>
```

**Funcionalidades:**
- [ ] Botão flutuante customizável
- [ ] Janela de chat responsiva
- [ ] Formulário pré-chat (nome, email, telefone)
- [ ] Histórico de conversas por sessão
- [ ] Indicador de digitação
- [ ] Envio de arquivos
- [ ] Emojis
- [ ] Mensagem offline
- [ ] Horário de funcionamento
- [ ] Múltiplos idiomas
- [ ] Triggers automáticos (tempo na página, scroll, exit intent)

---

### 1.5 API Pública REST + Webhooks

**Descrição:** API documentada para integrações externas (Zapier, Make, custom).

**Arquivos a criar:**
```
supabase/functions/
├── api-v1/
│   ├── index.ts                        # Router principal
│   ├── routes/
│   │   ├── contacts.ts                 # /api/v1/contacts
│   │   ├── conversations.ts            # /api/v1/conversations
│   │   ├── messages.ts                 # /api/v1/messages
│   │   ├── deals.ts                    # /api/v1/deals
│   │   ├── tasks.ts                    # /api/v1/tasks
│   │   └── webhooks.ts                 # /api/v1/webhooks
│   ├── middleware/
│   │   ├── auth.ts                     # API Key validation
│   │   ├── rateLimit.ts                # Rate limiting
│   │   └── logging.ts                  # Request logging
│   └── utils/
│       ├── pagination.ts
│       └── validation.ts

src/
├── pages/
│   └── ApiSettings.tsx                 # Gerenciamento de API Keys
├── components/settings/
│   ├── ApiKeyManager.tsx               # CRUD de API Keys
│   └── WebhookManager.tsx              # Configurar webhooks
docs/
└── API.md                              # Documentação da API
```

**Schema do banco:**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,        -- SHA256 da key
  key_prefix VARCHAR(10) NOT NULL,      -- Primeiros chars para identificação
  permissions TEXT[] DEFAULT ARRAY['read'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,               -- ['message.received', 'deal.created']
  secret VARCHAR(64) NOT NULL,          -- Para assinatura HMAC
  enabled BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id),
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Endpoints da API:**
```
# Contatos
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/:id
PUT    /api/v1/contacts/:id
DELETE /api/v1/contacts/:id

# Conversas
GET    /api/v1/conversations
GET    /api/v1/conversations/:id
POST   /api/v1/conversations/:id/messages

# Mensagens
POST   /api/v1/messages/send
GET    /api/v1/messages/:id

# Deals
GET    /api/v1/deals
POST   /api/v1/deals
PUT    /api/v1/deals/:id
PATCH  /api/v1/deals/:id/stage

# Webhooks
GET    /api/v1/webhooks
POST   /api/v1/webhooks
DELETE /api/v1/webhooks/:id
POST   /api/v1/webhooks/:id/test
```

**Eventos de Webhook:**
```
message.received
message.sent
message.delivered
message.read
conversation.created
conversation.resolved
conversation.closed
contact.created
contact.updated
deal.created
deal.updated
deal.stage_changed
deal.won
deal.lost
task.created
task.completed
proposal.viewed
proposal.accepted
proposal.rejected
```

---

# 📦 FASE 2: Omnichannel & IA

**Objetivo:** Expandir canais de comunicação e implementar IA conversacional autônoma.

## Sprint 5-8: Instagram & Facebook Messenger

### 2.1 Integração Instagram DM

**Descrição:** Receber e enviar mensagens do Instagram Direct via API oficial.

**Pré-requisitos:**
- Facebook Developer Account
- Instagram Business Account conectado ao Facebook Page
- App Review aprovado para `instagram_manage_messages`

**Arquivos a criar:**
```
src/
├── components/
│   ├── instagram/
│   │   ├── InstagramConnectionWizard.tsx
│   │   ├── InstagramAccountSelector.tsx
│   │   └── InstagramMessageRenderer.tsx
│   └── settings/
│       └── ChannelSettings.tsx         # Hub de canais
├── hooks/
│   └── useInstagram.ts
├── services/
│   └── instagramApi.ts                 # Client da API

supabase/
├── migrations/
│   └── XXXXXX_instagram_integration.sql
├── functions/
│   ├── instagram-webhook/              # Receber mensagens
│   ├── instagram-send-message/         # Enviar mensagens
│   ├── instagram-oauth-callback/       # OAuth flow
│   └── instagram-media-upload/         # Upload de mídia
```

**Schema do banco:**
```sql
CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'messenger', 'telegram', 'widget', 'email');

-- Tabela unificada de canais
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type channel_type NOT NULL,
  name VARCHAR(100) NOT NULL,

  -- Credenciais (criptografadas)
  credentials JSONB NOT NULL,           -- access_token, page_id, etc.

  -- Status
  status VARCHAR(20) DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- Configurações
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar conversations para suportar múltiplos canais
ALTER TABLE conversations ADD COLUMN channel_id UUID REFERENCES channels(id);
ALTER TABLE conversations ADD COLUMN channel_type channel_type;
ALTER TABLE conversations ADD COLUMN external_id VARCHAR(255); -- ID no Instagram/FB

-- Índice para busca por canal
CREATE INDEX idx_conversations_channel ON conversations(channel_id, external_id);
```

**Fluxo de Conexão:**
1. Admin acessa Configurações → Canais
2. Clica em "Conectar Instagram"
3. Redirect para Facebook OAuth
4. Autoriza permissões
5. Seleciona conta Instagram Business
6. Webhook configurado automaticamente
7. Canal ativo

**Funcionalidades:**
- [ ] OAuth 2.0 com Facebook Login
- [ ] Receber mensagens de texto
- [ ] Receber imagens, vídeos, áudios
- [ ] Receber stories mentions
- [ ] Receber reações
- [ ] Enviar mensagens de texto
- [ ] Enviar mídia
- [ ] Quick Replies
- [ ] Ice Breakers (mensagens iniciais)
- [ ] Suporte a Private Replies (responder comentários via DM)

---

### 2.2 Integração Facebook Messenger

**Descrição:** Messenger da Facebook Page integrado ao inbox.

**Arquivos a criar:**
```
src/
├── components/
│   └── messenger/
│       ├── MessengerConnectionWizard.tsx
│       ├── MessengerPageSelector.tsx
│       └── MessengerMessageRenderer.tsx
├── services/
│   └── messengerApi.ts

supabase/functions/
├── messenger-webhook/
├── messenger-send-message/
└── messenger-oauth-callback/
```

**Funcionalidades:**
- [ ] Conexão via Facebook Page
- [ ] Mensagens de texto
- [ ] Mídia (imagem, vídeo, arquivo)
- [ ] Templates estruturados (Generic, Button, Receipt)
- [ ] Quick Replies
- [ ] Persistent Menu
- [ ] Sender Actions (typing, mark_seen)
- [ ] Handover Protocol (passar para humano)

---

### 2.3 Inbox Unificado Multi-Canal

**Descrição:** Interface que mostra conversas de todos os canais em um só lugar.

**Modificar:**
```
src/
├── components/chat/
│   ├── ConversationList.tsx            # Adicionar filtro por canal
│   ├── ChannelIcon.tsx                 # Ícone do canal (WA, IG, FB)
│   ├── MessageArea.tsx                 # Adaptar para cada canal
│   └── ChannelFilter.tsx               # Filtro por canal
├── pages/
│   └── Chat.tsx                        # Suportar multi-canal
```

**UI Changes:**
```tsx
// ConversationItem.tsx
<div className="conversation-item">
  <ChannelIcon type={conversation.channel_type} /> {/* WhatsApp, Instagram, etc */}
  <Avatar src={conversation.contact.avatar} />
  <div className="content">
    <span className="name">{conversation.contact.name}</span>
    <span className="preview">{conversation.last_message}</span>
  </div>
  <ChannelBadge type={conversation.channel_type} />
</div>
```

---

## Sprint 9-12: IA Conversacional Autônoma

### 2.4 Chatbot Builder Visual

**Descrição:** Interface drag-and-drop para criar fluxos de chatbot.

**Arquivos a criar:**
```
src/
├── pages/
│   └── ChatbotBuilder.tsx              # Página do builder
├── components/
│   └── chatbot/
│       ├── ChatbotCanvas.tsx           # Canvas ReactFlow
│       ├── ChatbotSidebar.tsx          # Paleta de nodes
│       ├── ChatbotPreview.tsx          # Preview do bot
│       ├── nodes/
│       │   ├── StartNode.tsx           # Trigger inicial
│       │   ├── MessageNode.tsx         # Enviar mensagem
│       │   ├── QuestionNode.tsx        # Fazer pergunta
│       │   ├── ConditionNode.tsx       # Condição if/else
│       │   ├── MenuNode.tsx            # Menu de opções
│       │   ├── ApiNode.tsx             # Chamar API externa
│       │   ├── AIResponseNode.tsx      # Resposta da IA
│       │   ├── HandoffNode.tsx         # Passar para humano
│       │   ├── DelayNode.tsx           # Aguardar tempo
│       │   ├── SetVariableNode.tsx     # Definir variável
│       │   └── EndNode.tsx             # Fim do fluxo
│       └── panels/
│           ├── NodeConfigPanel.tsx     # Configurar node selecionado
│           └── VariablesPanel.tsx      # Variáveis disponíveis
├── hooks/
│   ├── useChatbotBuilder.ts
│   └── useChatbotExecution.ts
├── types/
│   └── chatbot.ts

supabase/
├── migrations/
│   └── XXXXXX_chatbots.sql
├── functions/
│   ├── chatbot-execute/                # Executar fluxo
│   └── chatbot-ai-response/            # Gerar resposta IA
```

**Schema do banco:**
```sql
CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Fluxo (ReactFlow format)
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',

  -- Configurações
  settings JSONB DEFAULT '{}',

  -- Triggers
  triggers JSONB DEFAULT '[]',          -- Quando ativar o bot

  -- Status
  status VARCHAR(20) DEFAULT 'draft',   -- draft, active, paused
  version INTEGER DEFAULT 1,

  -- Métricas
  total_executions INTEGER DEFAULT 0,
  successful_completions INTEGER DEFAULT 0,
  handoffs INTEGER DEFAULT 0,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chatbot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id),
  conversation_id UUID REFERENCES conversations(id),
  contact_id UUID REFERENCES contacts(id),

  -- Estado
  current_node_id VARCHAR(100),
  variables JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'running', -- running, completed, handoff, failed

  -- Histórico
  execution_log JSONB DEFAULT '[]',

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  handoff_at TIMESTAMPTZ,
  handoff_reason TEXT
);
```

**Tipos de Nodes:**

```typescript
// types/chatbot.ts
interface BaseNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface MessageNode extends BaseNode {
  type: 'message';
  data: {
    content: string;
    mediaUrl?: string;
    delay?: number; // ms antes de enviar
  };
}

interface QuestionNode extends BaseNode {
  type: 'question';
  data: {
    question: string;
    variableName: string; // Onde salvar a resposta
    validation?: 'email' | 'phone' | 'number' | 'text';
    errorMessage?: string;
  };
}

interface MenuNode extends BaseNode {
  type: 'menu';
  data: {
    title: string;
    options: Array<{
      id: string;
      label: string;
      value: string;
    }>;
  };
}

interface ConditionNode extends BaseNode {
  type: 'condition';
  data: {
    conditions: Array<{
      variable: string;
      operator: 'equals' | 'contains' | 'greater' | 'less';
      value: string;
    }>;
    logicalOperator: 'and' | 'or';
  };
}

interface AIResponseNode extends BaseNode {
  type: 'ai_response';
  data: {
    prompt: string;              // Contexto adicional
    maxTokens?: number;
    temperature?: number;
    useKnowledgeBase?: boolean;  // Usar RAG
  };
}

interface HandoffNode extends BaseNode {
  type: 'handoff';
  data: {
    message?: string;            // Mensagem ao transferir
    queueId?: string;            // Fila específica
    reason?: string;             // Motivo do handoff
  };
}
```

**Fluxo de Execução:**
1. Mensagem chega no canal
2. Sistema verifica se há chatbot ativo para o canal/trigger
3. Inicia execução do fluxo
4. Salva estado em `chatbot_executions`
5. Processa cada node sequencialmente
6. Em nodes de pergunta, aguarda resposta
7. Continua até `end` ou `handoff`
8. Se handoff, notifica atendente

---

### 2.5 Knowledge Base + RAG

**Descrição:** Base de conhecimento para IA responder com contexto da empresa.

**Arquivos a criar:**
```
src/
├── pages/
│   └── KnowledgeBase.tsx               # Gerenciador de documentos
├── components/
│   └── knowledge/
│       ├── DocumentUploader.tsx        # Upload de PDFs, DOCs
│       ├── DocumentList.tsx            # Lista de documentos
│       ├── DocumentViewer.tsx          # Visualizar documento
│       ├── FAQEditor.tsx               # Editor de FAQ
│       └── TrainingStatus.tsx          # Status do treinamento

supabase/
├── migrations/
│   └── XXXXXX_knowledge_base.sql
├── functions/
│   ├── process-document/               # Processar e chunkar documento
│   ├── generate-embeddings/            # Gerar embeddings
│   └── search-knowledge/               # Buscar conhecimento relevante
```

**Schema do banco:**
```sql
-- Habilitar extensão de vetores
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),

  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,            -- pdf, doc, faq, url, text
  source_url TEXT,
  file_path TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, ready, error
  error_message TEXT,

  -- Estatísticas
  chunk_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),

  content TEXT NOT NULL,
  embedding vector(1536),               -- OpenAI ada-002 dimension

  -- Metadados do chunk
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',          -- página, seção, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial
CREATE INDEX idx_knowledge_chunks_embedding
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- FAQ estruturado
CREATE TABLE knowledge_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),

  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),

  embedding vector(1536),

  usage_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fluxo de RAG:**
```
1. Usuário faz pergunta
2. Gerar embedding da pergunta
3. Buscar chunks mais similares (cosine similarity)
4. Montar contexto com top K chunks
5. Enviar para LLM com prompt:
   "Baseado no contexto abaixo, responda a pergunta do cliente.
    Contexto: {chunks}
    Pergunta: {user_question}"
6. Retornar resposta
```

**Funcionalidades:**
- [ ] Upload de PDF, DOCX, TXT
- [ ] Importar de URL (scraping)
- [ ] Editor de FAQ manual
- [ ] Chunking inteligente (por parágrafos, com overlap)
- [ ] Geração de embeddings (OpenAI/Cohere)
- [ ] Busca semântica
- [ ] Preview de respostas antes de publicar
- [ ] Métricas de uso (qual documento mais usado)
- [ ] Feedback de qualidade (resposta foi útil?)

---

### 2.6 Transcrição de Áudios

**Descrição:** Transcrever áudios recebidos automaticamente.

**Arquivos a criar:**
```
src/
├── components/chat/
│   └── AudioTranscription.tsx          # Componente de transcrição
├── hooks/
│   └── useAudioTranscription.ts

supabase/functions/
└── transcribe-audio/                   # Whisper API
```

**Schema do banco:**
```sql
ALTER TABLE messages ADD COLUMN transcription TEXT;
ALTER TABLE messages ADD COLUMN transcription_status VARCHAR(20);
ALTER TABLE messages ADD COLUMN transcription_confidence DECIMAL(3,2);
```

**Fluxo:**
1. Áudio recebido via webhook
2. Edge Function faz download do áudio
3. Envia para Whisper API (OpenAI) ou alternativa
4. Salva transcrição no banco
5. Exibe transcrição abaixo do player de áudio

---

# 📦 FASE 3: E-commerce & Automação Avançada

**Objetivo:** Habilitar vendas diretas pelo chat e automações sofisticadas.

## Sprint 13-15: E-commerce no Chat

### 3.1 Catálogo WhatsApp Oficial

**Descrição:** Integrar com Catalog API do WhatsApp Business.

**Arquivos a criar:**
```
src/
├── components/
│   └── catalog/
│       ├── CatalogManager.tsx          # Gerenciar catálogo
│       ├── ProductSync.tsx             # Sincronizar com WhatsApp
│       └── CatalogPreview.tsx          # Preview do catálogo
├── services/
│   └── whatsappCatalog.ts

supabase/functions/
├── catalog-sync/                       # Sincronizar produtos
└── catalog-webhook/                    # Receber eventos do catálogo
```

**Funcionalidades:**
- [ ] Criar catálogo no WhatsApp Business
- [ ] Sincronizar produtos locais → WhatsApp
- [ ] Enviar produtos no chat
- [ ] Carrinho compartilhado
- [ ] Checkout via chat

---

### 3.2 Mini-Loja no Chat

**Descrição:** Interface de compra dentro da conversa.

**Arquivos a criar:**
```
src/
├── components/chat/
│   ├── ProductCarousel.tsx             # Carrossel de produtos
│   ├── CartPanel.tsx                   # Carrinho lateral
│   ├── CheckoutFlow.tsx                # Fluxo de checkout
│   └── OrderConfirmation.tsx           # Confirmação de pedido

supabase/
├── migrations/
│   └── XXXXXX_orders.sql
```

**Schema do banco:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  conversation_id UUID REFERENCES conversations(id),

  -- Itens
  items JSONB NOT NULL,                 -- [{product_id, quantity, price}]

  -- Valores
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled

  -- Pagamento
  payment_method VARCHAR(50),
  payment_status VARCHAR(20),
  payment_id VARCHAR(255),              -- ID do Stripe/Pix

  -- Entrega
  shipping_address JSONB,
  tracking_code VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.3 Pagamento via Chat (PIX + Stripe)

**Descrição:** Receber pagamentos diretamente na conversa.

**Arquivos a criar:**
```
src/
├── components/chat/
│   ├── PaymentRequest.tsx              # Solicitar pagamento
│   ├── PixQRCode.tsx                   # QR Code do PIX
│   └── PaymentStatus.tsx               # Status do pagamento

supabase/functions/
├── create-pix-charge/                  # Gerar cobrança PIX
├── pix-webhook/                        # Confirmar pagamento
└── stripe-payment-link/                # Gerar link Stripe
```

**Fluxo PIX:**
1. Atendente clica em "Solicitar Pagamento"
2. Informa valor e descrição
3. Sistema gera QR Code PIX
4. Envia imagem do QR + código copia-cola
5. Webhook confirma pagamento
6. Notifica atendente e cliente

---

## Sprint 16-18: Automação Avançada

### 3.4 Sales Cadences

**Descrição:** Sequências de touchpoints multi-canal para prospecção.

**Arquivos a criar:**
```
src/
├── pages/
│   └── Cadences.tsx                    # Gerenciar cadências
├── components/
│   └── cadences/
│       ├── CadenceBuilder.tsx          # Construtor de cadência
│       ├── CadenceStepEditor.tsx       # Editor de step
│       ├── CadenceEnrollment.tsx       # Inscrever contatos
│       └── CadenceAnalytics.tsx        # Métricas

supabase/
├── migrations/
│   └── XXXXXX_cadences.sql
├── functions/
│   └── execute-cadence-step/           # Executar próximo step
```

**Schema do banco:**
```sql
CREATE TABLE cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Steps
  steps JSONB NOT NULL,                 -- [{day: 0, channel: 'whatsapp', template_id: '...'}]

  -- Configurações
  settings JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'draft',

  -- Métricas
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID REFERENCES cadences(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),

  -- Progresso
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',  -- active, completed, replied, converted, paused, exited

  -- Tracking
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reply_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tipos de Steps:**
- Email
- WhatsApp
- Tarefa (ligar, reunião)
- LinkedIn (manual)
- Delay (esperar X dias)
- Condição (se respondeu, se abriu email)

---

### 3.5 A/B Testing em Campanhas

**Descrição:** Testar variações de mensagens em campanhas.

**Modificar:**
```
src/
├── components/campaigns/
│   ├── CampaignBuilder.tsx             # Adicionar variantes
│   ├── ABVariantEditor.tsx             # Editor de variantes
│   └── ABTestResults.tsx               # Resultados do teste

supabase/
├── migrations/
│   └── XXXXXX_ab_testing.sql
```

**Schema do banco:**
```sql
ALTER TABLE campaigns ADD COLUMN ab_test_enabled BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN variants JSONB;
-- variants: [{id: 'A', content: '...', weight: 50}, {id: 'B', content: '...', weight: 50}]

ALTER TABLE campaign_contacts ADD COLUMN variant_id VARCHAR(10);
```

**Métricas por Variante:**
- Taxa de entrega
- Taxa de leitura
- Taxa de resposta
- Taxa de conversão (se deal criado)

---

### 3.6 Triggers Avançados para Playbooks

**Descrição:** Novos triggers automáticos para automações.

**Triggers a adicionar:**
```typescript
// Inatividade
{
  type: 'contact_inactive',
  config: {
    days: 30,
    excludeTags: ['churned']
  }
}

// Abandono de carrinho
{
  type: 'cart_abandoned',
  config: {
    afterMinutes: 60
  }
}

// Aniversário
{
  type: 'birthday',
  config: {
    daysBefore: 0,         // No dia
    sendAt: '09:00'
  }
}

// Renovação/Vencimento
{
  type: 'deal_expiring',
  config: {
    daysBefore: 30,
    stageId: 'subscription_active'
  }
}

// Score mudou
{
  type: 'lead_score_changed',
  config: {
    threshold: 80,
    direction: 'above'     // Quando passar de 80
  }
}

// SLA excedido
{
  type: 'sla_breached',
  config: {
    responseTimeMinutes: 60
  }
}
```

---

# 📦 FASE 4: Analytics & Integrações

**Objetivo:** Analytics avançado e integrações com ecossistema de ferramentas.

## Sprint 19-21: Analytics Avançado

### 4.1 Dashboards Customizáveis

**Descrição:** Permitir usuários criarem seus próprios dashboards.

**Arquivos a criar:**
```
src/
├── pages/
│   └── CustomDashboard.tsx             # Dashboard customizável
├── components/
│   └── dashboard/
│       ├── DashboardGrid.tsx           # Grid de widgets
│       ├── WidgetPalette.tsx           # Paleta de widgets
│       ├── widgets/
│       │   ├── MetricCard.tsx          # Card de métrica
│       │   ├── LineChart.tsx           # Gráfico de linha
│       │   ├── BarChart.tsx            # Gráfico de barras
│       │   ├── PieChart.tsx            # Gráfico de pizza
│       │   ├── FunnelChart.tsx         # Funil
│       │   ├── TableWidget.tsx         # Tabela
│       │   ├── LeaderboardWidget.tsx   # Ranking
│       │   └── GoalWidget.tsx          # Progresso de meta
│       └── WidgetConfigModal.tsx       # Configurar widget

supabase/
├── migrations/
│   └── XXXXXX_custom_dashboards.sql
```

**Schema do banco:**
```sql
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),

  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Layout
  widgets JSONB NOT NULL,               -- [{id, type, position, size, config}]

  -- Compartilhamento
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Widgets Disponíveis:**
- Métrica simples (número + variação)
- Gráfico de linha (temporal)
- Gráfico de barras (comparativo)
- Gráfico de pizza (distribuição)
- Funil de conversão
- Tabela de dados
- Ranking/Leaderboard
- Progresso de meta
- Mapa de calor (horários)

---

### 4.2 Cohort Analysis & Retention

**Descrição:** Análise de retenção e cohorts de clientes.

**Arquivos a criar:**
```
src/
├── components/analytics/
│   ├── CohortTable.tsx                 # Tabela de cohorts
│   ├── RetentionChart.tsx              # Gráfico de retenção
│   └── ChurnPrediction.tsx             # Previsão de churn
```

**Métricas:**
- Retenção por cohort mensal
- Churn rate
- LTV por cohort
- Tempo médio de vida do cliente
- Previsão de churn (ML simples)

---

### 4.3 Attribution Tracking

**Descrição:** Rastrear origem de deals e conversões.

**Schema do banco:**
```sql
ALTER TABLE deals ADD COLUMN attribution JSONB;
-- attribution: {
--   first_touch: {channel: 'instagram', campaign_id: '...', date: '...'},
--   last_touch: {channel: 'whatsapp', campaign_id: '...', date: '...'},
--   touchpoints: [{channel, campaign_id, date}, ...]
-- }

ALTER TABLE contacts ADD COLUMN acquisition_source VARCHAR(100);
ALTER TABLE contacts ADD COLUMN acquisition_campaign_id UUID;
ALTER TABLE contacts ADD COLUMN acquisition_date TIMESTAMPTZ;
```

**Relatórios:**
- ROI por canal
- ROI por campanha
- Jornada do cliente (touchpoints)
- Modelo de atribuição (first touch, last touch, linear)

---

## Sprint 22-24: Integrações

### 4.4 Integração Zapier/Make

**Descrição:** App oficial no Zapier e Make.

**Arquivos a criar:**
```
integrations/
├── zapier/
│   ├── package.json
│   ├── index.js                        # Entry point
│   ├── authentication.js               # Auth via API Key
│   ├── triggers/
│   │   ├── newMessage.js
│   │   ├── newContact.js
│   │   ├── newDeal.js
│   │   └── dealStageChanged.js
│   ├── actions/
│   │   ├── sendMessage.js
│   │   ├── createContact.js
│   │   ├── createDeal.js
│   │   └── updateDeal.js
│   └── searches/
│       ├── findContact.js
│       └── findDeal.js
```

---

### 4.5 Integração RD Station

**Descrição:** Sincronizar leads com RD Station Marketing.

**Arquivos a criar:**
```
src/
├── components/settings/
│   └── RDStationIntegration.tsx
├── services/
│   └── rdStationApi.ts

supabase/functions/
├── rdstation-oauth/
├── rdstation-sync-contacts/
└── rdstation-webhook/
```

**Funcionalidades:**
- [ ] OAuth com RD Station
- [ ] Sincronizar contatos (bi-direcional)
- [ ] Sincronizar conversões
- [ ] Mapear campos customizados
- [ ] Triggers de automação no RD

---

### 4.6 Integração HubSpot

**Descrição:** Sincronizar com HubSpot CRM.

**Arquivos a criar:**
```
src/
├── components/settings/
│   └── HubSpotIntegration.tsx
├── services/
│   └── hubspotApi.ts

supabase/functions/
├── hubspot-oauth/
├── hubspot-sync/
└── hubspot-webhook/
```

**Funcionalidades:**
- [ ] OAuth com HubSpot
- [ ] Sincronizar contatos
- [ ] Sincronizar deals
- [ ] Sincronizar atividades
- [ ] Timeline no HubSpot
- [ ] Workflow triggers

---

### 4.7 Integração Tiny/Bling ERP

**Descrição:** Conectar com ERPs populares no Brasil.

**Funcionalidades:**
- [ ] Sincronizar produtos
- [ ] Criar pedidos no ERP
- [ ] Consultar estoque
- [ ] Sincronizar clientes
- [ ] Emitir NF-e

---

# 📦 FASE 5: Mobile & Enterprise

**Objetivo:** App mobile nativo e features enterprise.

## Sprint 25-28: App Mobile Nativo

### 5.1 React Native App

**Descrição:** App nativo para iOS e Android.

**Estrutura:**
```
apps/
└── mobile/
    ├── package.json
    ├── app.json
    ├── babel.config.js
    ├── metro.config.js
    ├── src/
    │   ├── App.tsx
    │   ├── navigation/
    │   │   ├── RootNavigator.tsx
    │   │   ├── AuthNavigator.tsx
    │   │   └── MainNavigator.tsx
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.tsx
    │   │   │   └── ForgotPasswordScreen.tsx
    │   │   ├── chat/
    │   │   │   ├── ConversationsScreen.tsx
    │   │   │   └── ChatScreen.tsx
    │   │   ├── crm/
    │   │   │   ├── PipelineScreen.tsx
    │   │   │   └── DealScreen.tsx
    │   │   ├── contacts/
    │   │   │   ├── ContactsScreen.tsx
    │   │   │   └── ContactDetailScreen.tsx
    │   │   ├── tasks/
    │   │   │   └── TasksScreen.tsx
    │   │   └── settings/
    │   │       └── SettingsScreen.tsx
    │   ├── components/
    │   │   ├── ui/                     # Design system mobile
    │   │   ├── chat/
    │   │   └── shared/
    │   ├── hooks/
    │   ├── services/
    │   │   └── supabase.ts
    │   ├── store/
    │   │   └── index.ts                # Zustand/Redux
    │   └── utils/
    ├── ios/
    └── android/
```

**Features Prioritárias:**
- [ ] Login/Autenticação
- [ ] Lista de conversas
- [ ] Chat completo (texto, áudio, imagem)
- [ ] Push notifications nativas
- [ ] Pipeline Kanban (swipe entre stages)
- [ ] Lista de contatos
- [ ] Tarefas
- [ ] Offline mode (sync quando online)

---

## Sprint 29-32: Enterprise Features

### 5.2 SSO (SAML/OAuth)

**Descrição:** Single Sign-On para empresas grandes.

**Arquivos a criar:**
```
src/
├── components/settings/
│   └── SSOSettings.tsx
├── pages/
│   └── SSOLogin.tsx

supabase/functions/
├── saml-metadata/
├── saml-acs/                           # Assertion Consumer Service
└── saml-logout/
```

**Providers suportados:**
- [ ] Google Workspace
- [ ] Microsoft Azure AD
- [ ] Okta
- [ ] OneLogin
- [ ] SAML genérico

---

### 5.3 Audit Logs Completos

**Descrição:** Log de todas as ações para compliance.

**Schema do banco:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),

  -- Ação
  action VARCHAR(100) NOT NULL,         -- 'deal.created', 'user.login'
  resource_type VARCHAR(50) NOT NULL,   -- 'deal', 'contact', 'user'
  resource_id UUID,

  -- Detalhes
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,                       -- IP, user agent, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Retenção automática (90 dias default)
SELECT cron.schedule('cleanup-audit-logs', '0 3 * * *', $$
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND company_id IN (SELECT id FROM companies WHERE audit_retention_days = 90)
$$);
```

**Actions logadas:**
- Login/Logout
- CRUD de todas entidades
- Mudanças de permissões
- Exportações de dados
- Acesso a dados sensíveis
- Configurações alteradas

---

### 5.4 2FA Obrigatório

**Descrição:** Autenticação de dois fatores.

**Arquivos a criar:**
```
src/
├── components/auth/
│   ├── TwoFactorSetup.tsx              # Configurar 2FA
│   ├── TwoFactorVerify.tsx             # Verificar código
│   └── BackupCodes.tsx                 # Códigos de backup
├── pages/
│   └── TwoFactorChallenge.tsx          # Tela de desafio
```

**Métodos suportados:**
- [ ] TOTP (Google Authenticator, Authy)
- [ ] SMS (backup)
- [ ] Backup codes

---

### 5.5 LGPD Compliance Suite

**Descrição:** Ferramentas para conformidade com LGPD.

**Arquivos a criar:**
```
src/
├── pages/
│   └── PrivacyCenter.tsx               # Central de privacidade
├── components/
│   └── privacy/
│       ├── ConsentManager.tsx          # Gerenciar consentimentos
│       ├── DataExport.tsx              # Exportar dados do contato
│       ├── DataDeletion.tsx            # Direito ao esquecimento
│       └── DataRetention.tsx           # Políticas de retenção

supabase/functions/
├── export-contact-data/                # Exportar todos os dados
├── anonymize-contact/                  # Anonimizar dados
└── delete-contact-data/                # Deletar permanentemente
```

**Funcionalidades:**
- [ ] Gerenciamento de consentimento
- [ ] Registro de base legal
- [ ] Exportação de dados (direito de portabilidade)
- [ ] Anonimização de dados
- [ ] Deleção permanente (direito ao esquecimento)
- [ ] Políticas de retenção automática
- [ ] Relatório de conformidade

---

### 5.6 IP Whitelist

**Descrição:** Restringir acesso por IP.

**Schema do banco:**
```sql
ALTER TABLE companies ADD COLUMN ip_whitelist TEXT[];
ALTER TABLE companies ADD COLUMN ip_whitelist_enabled BOOLEAN DEFAULT false;

-- Verificar na Edge Function de auth
-- Se ip_whitelist_enabled AND request_ip NOT IN ip_whitelist → bloquear
```

---

### 5.7 Commission Tracking

**Descrição:** Cálculo automático de comissões.

**Arquivos a criar:**
```
src/
├── pages/
│   └── Commissions.tsx                 # Dashboard de comissões
├── components/
│   └── commissions/
│       ├── CommissionRules.tsx         # Regras de comissão
│       ├── CommissionReport.tsx        # Relatório
│       └── PayoutHistory.tsx           # Histórico de pagamentos

supabase/
├── migrations/
│   └── XXXXXX_commissions.sql
```

**Schema do banco:**
```sql
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),

  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,            -- percentage, fixed, tiered

  -- Regras
  rules JSONB NOT NULL,
  -- percentage: {rate: 10}
  -- tiered: [{min: 0, max: 10000, rate: 5}, {min: 10000, max: null, rate: 8}]

  -- Filtros
  applies_to_users UUID[],
  applies_to_products UUID[],
  applies_to_stages UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  deal_id UUID REFERENCES deals(id),
  rule_id UUID REFERENCES commission_rules(id),

  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid

  paid_at TIMESTAMPTZ,
  payout_reference VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 📊 Resumo do Roadmap

## Por Fase

| Fase | Sprints | Features | Prioridade |
|------|---------|----------|------------|
| 1 | 1-4 | Quick Wins + Widget + API | 🔴 Alta |
| 2 | 5-12 | Omnichannel + IA | 🔴 Alta |
| 3 | 13-18 | E-commerce + Automação | 🟡 Média |
| 4 | 19-24 | Analytics + Integrações | 🟡 Média |
| 5 | 25-32 | Mobile + Enterprise | 🟢 Baixa |

## Por Impacto no Mercado

| Feature | Impacto | Diferencial Competitivo |
|---------|---------|------------------------|
| Omnichannel (IG, FB, Widget) | 🔴 Crítico | Alto |
| Chatbot Visual + IA | 🔴 Crítico | Muito Alto |
| Knowledge Base + RAG | 🔴 Crítico | Muito Alto |
| API Pública + Zapier | 🟠 Alto | Médio |
| E-commerce no Chat | 🟠 Alto | Alto |
| App Mobile Nativo | 🟠 Alto | Médio |
| Sales Cadences | 🟡 Médio | Alto |
| SSO + Enterprise | 🟡 Médio | Médio (para Enterprise) |

---

# 🎯 Métricas de Sucesso

## Por Fase

### Fase 1
- [ ] Widget instalado em 50+ sites
- [ ] API com 100+ chamadas/dia
- [ ] 80% de adoção de atalhos rápidos

### Fase 2
- [ ] 30% das empresas conectaram Instagram
- [ ] 50% usam chatbot ativo
- [ ] 40% configuraram Knowledge Base

### Fase 3
- [ ] 20% das empresas vendem via chat
- [ ] 500+ cadências ativas
- [ ] 100+ testes A/B rodados

### Fase 4
- [ ] 200+ integrações Zapier ativas
- [ ] 50% usam dashboards customizados
- [ ] 30% conectaram RD/HubSpot

### Fase 5
- [ ] 10.000+ downloads do app
- [ ] 20 empresas com SSO
- [ ] 100% LGPD compliant

---

# 📝 Notas de Implementação

## Padrões de Código

```typescript
// Novos hooks devem seguir o padrão
export function useFeature() {
  const queryClient = useQueryClient();
  const { company } = useCompany();

  const query = useQuery({
    queryKey: ['feature', company?.id],
    queryFn: () => fetchFeature(company!.id),
    enabled: !!company?.id,
  });

  const mutation = useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries(['feature']);
      toast.success('Feature criada!');
    },
  });

  return { ...query, create: mutation.mutate };
}
```

## Padrões de Edge Functions

```typescript
// supabase/functions/feature-name/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Lógica aqui

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Checklist de PR

- [ ] Testes passando
- [ ] Tipos TypeScript corretos
- [ ] Migrations testadas localmente
- [ ] Edge Functions testadas
- [ ] Documentação atualizada
- [ ] Sem console.log em produção
- [ ] Sem secrets hardcoded
- [ ] RLS policies adicionadas

---

*Documento gerado em: 2024-12-13*
*Última atualização: 2024-12-13*
*Versão: 1.0*
