# 🚀 ROADMAP DE IMPLEMENTAÇÃO - EVOTALK GATEWAY
## Fases 2-5 | Planejamento Técnico Detalhado

---

## 📊 ESTADO ATUAL DO PROJETO

### ✅ Já Implementado (Fase 1)
- WhatsApp Business completo via Evolution API
- CRM com pipeline visual (Kanban)
- Automação de workflows (Visual Builder)
- Catálogo de produtos
- Campanhas em massa
- Analytics e dashboards
- Gamificação
- Multi-tenancy com RBAC (6 roles)
- PWA funcional
- IA integrada (OpenAI, Groq, Anthropic)
- Google Calendar sync
- Gestão de propostas

### 🏗️ Infraestrutura
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **87+ tabelas no banco**
- **43 Edge Functions**
- **195 componentes React**
- **52 custom hooks**

---

## 🟠 FASE 2 - OMNICHANNEL + IA (Sprints 5-12)
**Duração estimada:** 8 sprints (16 semanas)

### 📱 Sprint 5-6: Instagram DM Integration

#### Implementação Técnica

**1. Database Schema**
```sql
-- Adicionar campos à tabela companies
ALTER TABLE companies ADD COLUMN instagram_business_id TEXT;
ALTER TABLE companies ADD COLUMN instagram_access_token TEXT;
ALTER TABLE companies ADD COLUMN instagram_connected BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN instagram_user_id TEXT;
ALTER TABLE companies ADD COLUMN instagram_username TEXT;

-- Criar tabela de configuração Instagram
CREATE TABLE instagram_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  page_id TEXT,
  page_access_token TEXT,
  webhook_verify_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar canal 'instagram' nas conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';
-- Valores: 'whatsapp', 'instagram', 'messenger', 'telegram'
```

**2. Edge Functions**
```typescript
// supabase/functions/instagram-webhook/index.ts
// Receber mensagens do Instagram
// - Processar entry/messaging
// - Criar conversation + messages
// - Trigger AI response se configurado

// supabase/functions/instagram-send-message/index.ts
// Enviar mensagens via Graph API
// - Text, images, quick replies, generic template

// supabase/functions/instagram-oauth-callback/index.ts
// OAuth flow para conectar Instagram Business Account

// supabase/functions/instagram-get-profile/index.ts
// Buscar perfil do usuário
```

**3. Frontend Components**
```
src/components/instagram/
├── InstagramConnectionManager.tsx   # OAuth flow UI
├── InstagramQRCodeModal.tsx        # Mostrar QR code (se aplicável)
├── InstagramStatusBadge.tsx        # Status da conexão
└── InstagramSettingsPanel.tsx      # Configurações

src/hooks/
└── useInstagramApi.ts              # Hook para interagir com IG
```

**4. Unified Inbox Integration**
- Modificar `ConversationList.tsx` para filtrar por canal
- Adicionar badge de canal (WhatsApp/Instagram/Messenger)
- Modificar `MessageArea.tsx` para suportar multi-canal
- Atualizar `MessageBubble.tsx` para diferentes tipos de mensagens

**5. Tarefas Específicas**
- [ ] Criar app no Facebook Developers
- [ ] Implementar Instagram Graph API wrapper
- [ ] OAuth flow completo
- [ ] Webhook subscription
- [ ] Message parsing (text, media, story replies, mentions)
- [ ] Send API (text, images, quick replies, templates)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Testes E2E

---

### 💬 Sprint 7-8: Facebook Messenger Integration

#### Implementação Técnica

**1. Database Schema**
```sql
-- Adicionar campos à tabela companies
ALTER TABLE companies ADD COLUMN messenger_page_id TEXT;
ALTER TABLE companies ADD COLUMN messenger_page_access_token TEXT;
ALTER TABLE companies ADD COLUMN messenger_connected BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN messenger_app_id TEXT;
ALTER TABLE companies ADD COLUMN messenger_app_secret TEXT;

-- Tabela de configuração Messenger
CREATE TABLE messenger_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  webhook_verify_token TEXT,
  greeting_text TEXT,
  get_started_payload TEXT,
  persistent_menu JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/messenger-webhook/index.ts
// supabase/functions/messenger-send-message/index.ts
// supabase/functions/messenger-oauth-callback/index.ts
// supabase/functions/messenger-setup-profile/index.ts
// supabase/functions/messenger-get-user-profile/index.ts
```

**3. Features do Messenger**
- Quick Replies
- Buttons (postback, web_url, call)
- Generic Template (carrossel)
- Receipt Template (pedidos)
- Persistent Menu
- Get Started button
- Icebreakers
- Handover Protocol (bot → humano)

**4. Tarefas**
- [ ] Facebook App setup
- [ ] Page subscription
- [ ] Webhook handling (messaging, messaging_postbacks, message_reads)
- [ ] Send API wrapper
- [ ] Template builder para Messenger
- [ ] Handover protocol
- [ ] Testes

---

### 📥 Sprint 9: Inbox Unificado

#### Implementação

**1. Database Updates**
```sql
-- Criar view unificada
CREATE OR REPLACE VIEW unified_conversations AS
SELECT
  c.*,
  co.name as contact_name,
  co.phone,
  co.email,
  co.avatar_url,
  cm.name as assigned_name,
  CASE
    WHEN c.channel = 'whatsapp' THEN 'WhatsApp'
    WHEN c.channel = 'instagram' THEN 'Instagram DM'
    WHEN c.channel = 'messenger' THEN 'Messenger'
    ELSE 'Outro'
  END as channel_name
FROM conversations c
LEFT JOIN contacts co ON c.contact_id = co.id
LEFT JOIN company_members cm ON c.assigned_to = cm.id;

-- Índice composto para performance
CREATE INDEX idx_conversations_company_channel_status
ON conversations(company_id, channel, status);
```

**2. Frontend Components**
```typescript
// src/components/inbox/UnifiedInbox.tsx
interface UnifiedInboxProps {
  filters: {
    channels: ('whatsapp' | 'instagram' | 'messenger')[];
    status: string[];
    assignedTo?: string;
    labels?: string[];
  };
}

// src/components/inbox/ChannelTabs.tsx
// Tabs para filtrar por canal

// src/components/inbox/ChannelBadge.tsx
// Badge visual para cada canal

// src/components/inbox/UnifiedMessageComposer.tsx
// Composer que se adapta ao canal
```

**3. Features**
- Filtros avançados multi-canal
- Ordenação (last_message, priority, unread_count)
- Busca unificada
- Bulk actions (atribuir, label, close)
- Atalhos de teclado
- Visualização em lista/grid
- Sidebar com detalhes do contato unificado

**4. Tarefas**
- [ ] Refatorar ConversationList para multi-canal
- [ ] Criar ChannelTabs component
- [ ] Implementar filtros avançados
- [ ] Message composer adaptativo
- [ ] Testes de integração

---

### 🤖 Sprint 10: Chatbot Builder Visual

#### Implementação

**1. Database Schema**
```sql
-- Tabela de bots
CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT NOT NULL, -- 'keyword', 'intent', 'always', 'business_hours'
  trigger_config JSONB, -- { keywords: [], intents: [], schedule: {} }
  fallback_action TEXT, -- 'transfer_human', 'show_menu', 'end'
  channels TEXT[] DEFAULT ARRAY['whatsapp'], -- Canais onde o bot atua
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nodes do chatbot
CREATE TABLE chatbot_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'question', 'condition', 'action', 'ai_response'
  position JSONB NOT NULL, -- { x: number, y: number }
  config JSONB NOT NULL, -- Configuração específica do node
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conexões entre nodes
CREATE TABLE chatbot_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES chatbot_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES chatbot_nodes(id) ON DELETE CASCADE,
  condition JSONB, -- { type: 'button_click', value: 'opcao_1' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Execuções do chatbot
CREATE TABLE chatbot_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES chatbots(id),
  conversation_id UUID REFERENCES conversations(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT, -- 'running', 'completed', 'fallback'
  current_node_id UUID REFERENCES chatbot_nodes(id),
  context JSONB, -- Variáveis coletadas
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Frontend Components**
```typescript
// src/components/chatbot/ChatbotBuilder.tsx
// React Flow canvas com drag-and-drop

// Tipos de Nodes:
// - TriggerNode: Quando o bot inicia
// - MessageNode: Enviar mensagem (text, media, template)
// - QuestionNode: Fazer pergunta e aguardar resposta
// - ButtonsNode: Enviar botões/quick replies
// - ConditionNode: If/else logic
// - AINode: Usar IA para responder
// - ActionNode: HTTP request, atualizar contato, criar deal
// - DelayNode: Aguardar X segundos
// - TransferNode: Transferir para humano
// - EndNode: Finalizar conversa

// src/components/chatbot/NodeConfigPanel.tsx
// Painel lateral para configurar cada node

// src/components/chatbot/ChatbotTester.tsx
// Testar fluxo do chatbot em tempo real

// src/components/chatbot/ChatbotAnalytics.tsx
// Métricas: conversões, drop-off, tempo médio
```

**3. Edge Functions**
```typescript
// supabase/functions/chatbot-process-message/index.ts
// Processar mensagem recebida e executar chatbot
// - Identificar se deve ativar bot
// - Navegar entre nodes
// - Salvar contexto
// - Executar ações
```

**4. Tarefas**
- [ ] Implementar React Flow canvas
- [ ] Criar 10+ tipos de nodes
- [ ] Sistema de variáveis {{ contact.name }}
- [ ] Execution engine (state machine)
- [ ] Tester com preview em tempo real
- [ ] Analytics de performance
- [ ] Templates prontos (atendimento, vendas, suporte)
- [ ] Importar/exportar chatbots (JSON)

---

### 🧠 Sprint 11: Knowledge Base + RAG

#### Implementação

**1. Database Schema**
```sql
-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de documentos da Knowledge Base
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES faq_categories(id),
  metadata JSONB, -- { source: 'manual', url: '', tags: [] }
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks de documentos para embeddings
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  token_count INTEGER,
  position INTEGER, -- Ordem no documento
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca semântica
CREATE INDEX ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Histórico de consultas
CREATE TABLE kb_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  query TEXT NOT NULL,
  results JSONB, -- Top 5 chunks retornados
  conversation_id UUID REFERENCES conversations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cache de respostas
CREATE TABLE kb_answer_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  query_hash TEXT UNIQUE,
  answer TEXT,
  source_chunks UUID[],
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

**2. Edge Functions**
```typescript
// supabase/functions/kb-ingest-document/index.ts
// - Receber documento (text, PDF, URL)
// - Chunking (1000 tokens, overlap 200)
// - Gerar embeddings via OpenAI
// - Salvar no banco

// supabase/functions/kb-semantic-search/index.ts
// - Receber query do usuário
// - Gerar embedding da query
// - Buscar top K chunks similares (cosine similarity)
// - Retornar resultados ranqueados

// supabase/functions/kb-generate-answer/index.ts
// - Receber query + chunks
// - Montar prompt para LLM
// - Gerar resposta contextualizada
// - Incluir fontes/citações
```

**3. Frontend Components**
```typescript
// src/pages/KnowledgeBase.tsx
// Gerenciar documentos da KB

// src/components/kb/DocumentUploader.tsx
// Upload de PDFs, Word, Text, URLs

// src/components/kb/DocumentEditor.tsx
// Editor WYSIWYG para criar/editar docs

// src/components/kb/SemanticSearch.tsx
// Interface de busca semântica

// src/components/kb/EmbeddingStatus.tsx
// Mostrar status de processamento

// src/components/chat/KBSuggestions.tsx
// Sugestões da KB durante conversa
```

**4. RAG Integration com AI Assistant**
```typescript
// Modificar src/components/chat/AIAssistant.tsx
// - Antes de responder, buscar na KB
// - Combinar contexto da conversa + KB
// - Gerar resposta fundamentada
// - Mostrar fontes ao atendente
```

**5. Tarefas**
- [ ] Implementar document ingestion pipeline
- [ ] Chunking strategy otimizada
- [ ] Embeddings generation (OpenAI ada-002)
- [ ] Semantic search com pgvector
- [ ] RAG prompt engineering
- [ ] Citation/source tracking
- [ ] KB management UI
- [ ] Auto-sync com FAQs existentes
- [ ] Testes de precisão (retrieval metrics)

---

### 🎙️ Sprint 12: Transcrição de Áudios

#### Implementação

**1. Database Schema**
```sql
-- Adicionar campos à tabela messages
ALTER TABLE messages ADD COLUMN audio_transcription TEXT;
ALTER TABLE messages ADD COLUMN transcription_status TEXT;
-- 'pending', 'processing', 'completed', 'failed'
ALTER TABLE messages ADD COLUMN transcription_language TEXT;
ALTER TABLE messages ADD COLUMN transcription_confidence FLOAT;

-- Configuração de transcrição
CREATE TABLE transcription_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'groq', -- 'groq', 'openai', 'assemblyai'
  auto_transcribe BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'pt', -- pt, en, es
  model TEXT DEFAULT 'whisper-large-v3',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/transcribe-audio/index.ts
import Groq from "groq-sdk";

export default async function transcribeAudio(
  audioUrl: string,
  options: {
    provider: 'groq' | 'openai';
    language?: string;
    model?: string;
  }
) {
  // 1. Download audio de Supabase Storage
  const audioBuffer = await fetch(audioUrl).then(r => r.arrayBuffer());

  // 2. Converter para formato suportado (OGG → MP3)
  const mp3Buffer = await convertToMP3(audioBuffer);

  // 3. Enviar para Groq Whisper API
  const groq = new Groq({ apiKey: Deno.env.get("GROQ_API_KEY") });

  const transcription = await groq.audio.transcriptions.create({
    file: new File([mp3Buffer], "audio.mp3"),
    model: "whisper-large-v3",
    language: options.language || "pt",
    response_format: "verbose_json", // Inclui timestamps
  });

  // 4. Retornar texto + metadata
  return {
    text: transcription.text,
    language: transcription.language,
    duration: transcription.duration,
    segments: transcription.segments, // Timestamps
  };
}

// supabase/functions/auto-transcribe-webhook/index.ts
// Triggered quando nova mensagem de áudio chega
// - Verificar se auto_transcribe está ativo
// - Chamar transcribe-audio
// - Atualizar messages.audio_transcription
// - Trigger AI analysis se configurado
```

**3. Frontend Components**
```typescript
// src/components/chat/AudioTranscription.tsx
// Mostrar transcrição abaixo do player de áudio

// src/components/chat/TranscriptionBadge.tsx
// Badge indicando status (processing/completed)

// src/settings/TranscriptionSettings.tsx
// Configurar provider, auto-transcribe, idioma
```

**4. Features Avançadas**
- Diarization (separar falantes)
- Timestamps clicáveis
- Busca por texto em áudios
- Tradução automática
- Sentiment analysis do áudio

**5. Tarefas**
- [ ] Integrar Groq Whisper API
- [ ] Converter formatos de áudio (FFmpeg)
- [ ] Auto-trigger em mensagens novas
- [ ] UI para visualizar transcrição
- [ ] Busca full-text em transcrições
- [ ] Settings para configurar provider
- [ ] Retry logic para falhas
- [ ] Testes com diferentes formatos

---

## 🟡 FASE 3 - E-COMMERCE + AUTOMAÇÃO (Sprints 13-18)

### 🛍️ Sprint 13-14: Catálogo WhatsApp + Mini-Loja

#### Implementação

**1. Database Schema**
```sql
-- Carrinho de compras
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  status TEXT DEFAULT 'active', -- 'active', 'abandoned', 'converted'
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Itens do carrinho
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  custom_options JSONB, -- Variações selecionadas
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  conversation_id UUID REFERENCES conversations(id),
  cart_id UUID REFERENCES shopping_carts(id),
  order_number TEXT UNIQUE NOT NULL, -- MELONCHAT-2024-00001
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
  payment_status TEXT, -- 'pending', 'paid', 'failed', 'refunded'
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuração de e-commerce
CREATE TABLE ecommerce_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  whatsapp_catalog_enabled BOOLEAN DEFAULT false,
  catalog_id TEXT, -- ID do catálogo no WhatsApp Business
  cart_expiration_hours INTEGER DEFAULT 24,
  shipping_enabled BOOLEAN DEFAULT true,
  shipping_rules JSONB, -- Frete grátis, valor mínimo, etc
  payment_methods JSONB, -- PIX, cartão, boleto
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. WhatsApp Catalog API Integration**
```typescript
// supabase/functions/whatsapp-catalog-sync/index.ts
// Sincronizar products com WhatsApp Catalog API
// - Criar/atualizar produtos no catálogo
// - Fazer upload de imagens
// - Gerenciar variações

// supabase/functions/whatsapp-send-catalog/index.ts
// Enviar catálogo interativo na conversa
// - Single Product Message
// - Multi-Product Message (até 30 produtos)
```

**3. Frontend Components**
```typescript
// src/components/ecommerce/MiniStore.tsx
// Interface da loja dentro do chat

// src/components/ecommerce/ProductCatalog.tsx
// Grid de produtos com filtros

// src/components/ecommerce/ShoppingCart.tsx
// Visualização do carrinho

// src/components/ecommerce/CheckoutFlow.tsx
// Fluxo de checkout
// - Endereço de entrega
// - Método de pagamento
// - Revisão do pedido
// - Confirmação

// src/components/ecommerce/OrderTracking.tsx
// Rastreamento de pedido

// src/pages/Orders.tsx
// Página de gerenciamento de pedidos
```

**4. Chatbot Integration**
```typescript
// Adicionar nodes ao Chatbot Builder:
// - ShowCatalogNode: Mostrar catálogo
// - AddToCartNode: Adicionar produto ao carrinho
// - ShowCartNode: Mostrar carrinho atual
// - CheckoutNode: Iniciar checkout
```

**5. Tarefas**
- [ ] Sincronizar produtos com WhatsApp Catalog API
- [ ] Implementar carrinho de compras
- [ ] Fluxo de checkout completo
- [ ] Cálculo de frete (integração com Correios/Melhor Envio)
- [ ] Página de gerenciamento de pedidos
- [ ] Status tracking de pedidos
- [ ] Notificações automáticas (pedido confirmado, enviado, entregue)
- [ ] Testes E2E do fluxo completo

---

### 💳 Sprint 15: Pagamento via Chat

#### Implementação

**1. Database Schema**
```sql
-- Transações de pagamento
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  company_id UUID REFERENCES companies(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL, -- 'pix', 'credit_card', 'boleto'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed', 'refunded'
  provider TEXT, -- 'stripe', 'mercadopago', 'pagseguro'
  provider_payment_id TEXT,
  provider_response JSONB,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expires_at TIMESTAMPTZ,
  boleto_url TEXT,
  boleto_barcode TEXT,
  card_last4 TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Configuração de gateways de pagamento
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'stripe', 'mercadopago', 'pagseguro'
  is_active BOOLEAN DEFAULT false,
  public_key TEXT,
  secret_key TEXT ENCRYPTED,
  webhook_secret TEXT ENCRYPTED,
  pix_enabled BOOLEAN DEFAULT true,
  credit_card_enabled BOOLEAN DEFAULT true,
  boleto_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/payment-create-pix/index.ts
// Gerar pagamento PIX
// - Criar QR Code
// - Copy-paste code
// - Webhook para confirmação

// supabase/functions/payment-create-card/index.ts
// Processar pagamento com cartão

// supabase/functions/payment-webhook/index.ts
// Receber webhooks de confirmação
// - Atualizar status do pedido
// - Enviar mensagem de confirmação no chat
// - Trigger fulfillment

// supabase/functions/payment-refund/index.ts
// Processar reembolso
```

**3. Frontend Components**
```typescript
// src/components/payment/PaymentMethodSelector.tsx
// Selecionar método de pagamento

// src/components/payment/PIXPayment.tsx
// Mostrar QR Code + copy-paste
// Countdown de expiração
// Auto-refresh para verificar pagamento

// src/components/payment/CreditCardForm.tsx
// Form de cartão de crédito
// Validação de número, CVV, validade

// src/components/payment/BoletoPayment.tsx
// Mostrar boleto + código de barras
```

**4. Stripe Integration**
```typescript
// Stripe Checkout Session inline
// - Criar session no backend
// - Abrir checkout no iframe/popup
// - Redirect após pagamento
```

**5. Tarefas**
- [ ] Integrar Stripe Payment Links
- [ ] Gerar PIX QR Code (Stripe ou Mercado Pago)
- [ ] Processar cartão de crédito
- [ ] Webhook handling para confirmação
- [ ] UI de pagamento responsiva
- [ ] Auto-atualizar status em tempo real
- [ ] Enviar comprovante no chat
- [ ] Sistema de reembolso
- [ ] Testes com Stripe Test Mode

---

### 📧 Sprint 16: Sales Cadences

#### Implementação

**1. Database Schema**
```sql
-- Cadências de vendas
CREATE TABLE sales_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  goal TEXT, -- 'lead_nurturing', 'demo_booking', 'close_sale'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Steps da cadência
CREATE TABLE cadence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID REFERENCES sales_cadences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'email', 'whatsapp', 'sms', 'call', 'task'
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  template_id UUID, -- Referência para template (email/whatsapp)
  subject TEXT, -- Para emails
  content TEXT,
  action_config JSONB, -- { task_title: '', call_script: '' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inscrições em cadências
CREATE TABLE cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID REFERENCES sales_cadences(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  enrolled_by UUID REFERENCES company_members(id),
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'stopped'
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT
);

-- Execuções de steps
CREATE TABLE cadence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES cadence_enrollments(id),
  step_id UUID REFERENCES cadence_steps(id),
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed', 'skipped'
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  message_id UUID REFERENCES messages(id),
  task_id UUID REFERENCES tasks(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/cadence-executor/index.ts
// Cron job que roda a cada hora
// - Buscar execuções agendadas
// - Enviar emails/WhatsApp
// - Criar tasks
// - Atualizar status

// supabase/functions/cadence-enroll/index.ts
// Inscrever contato em cadência
// - Verificar duplicidade
// - Agendar todos os steps
// - Substituir variáveis {{ contact.name }}

// supabase/functions/cadence-pause/index.ts
// Pausar/retomar/parar cadência

// supabase/functions/cadence-analytics/index.ts
// Métricas de performance
```

**3. Frontend Components**
```typescript
// src/pages/SalesCadences.tsx
// Lista de cadências

// src/components/cadences/CadenceBuilder.tsx
// Builder visual de cadências
// Timeline com steps
// Drag-and-drop para reordenar

// src/components/cadences/StepEditor.tsx
// Editor de step
// Template selector
// Delay configuration

// src/components/cadences/CadenceEnrollmentDialog.tsx
// Inscrever contatos
// Bulk enrollment via segment

// src/components/cadences/CadenceAnalytics.tsx
// Métricas:
// - Enrollment rate
// - Completion rate
// - Response rate por step
// - Conversion rate
```

**4. Automações**
- Auto-enroll quando contato entra em determinado segmento
- Auto-stop se contato responde
- Auto-stop se deal avança no pipeline

**5. Tarefas**
- [ ] Criar tabelas de cadence
- [ ] Cadence builder UI
- [ ] Executor com cron job (Supabase pg_cron)
- [ ] Template variables substitution
- [ ] Multi-channel support (Email + WhatsApp)
- [ ] Analytics dashboard
- [ ] Bulk enrollment
- [ ] Testes de execução

---

### 🧪 Sprint 17: A/B Testing

#### Implementação

**1. Database Schema**
```sql
-- Experimentos A/B
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'campaign', 'template', 'chatbot', 'cadence'
  status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_variant_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Variantes
CREATE TABLE ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'A', 'B', 'C'
  traffic_percentage INTEGER DEFAULT 50, -- % de alocação
  config JSONB NOT NULL, -- Configuração da variante
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participantes do teste
CREATE TABLE ab_test_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id),
  variant_id UUID REFERENCES ab_test_variants(id),
  contact_id UUID REFERENCES contacts(id),
  conversation_id UUID REFERENCES conversations(id),
  campaign_id UUID REFERENCES campaigns(id),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos de conversão
CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES ab_tests(id),
  variant_id UUID REFERENCES ab_test_variants(id),
  participant_id UUID REFERENCES ab_test_participants(id),
  event_type TEXT NOT NULL, -- 'view', 'click', 'reply', 'conversion'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/ab-test-assign-variant/index.ts
// Atribuir variante ao contato
// - Weighted random selection
// - Garantir distribuição balanceada
// - Salvar em participants

// supabase/functions/ab-test-track-event/index.ts
// Rastrear evento (view, click, reply, conversion)

// supabase/functions/ab-test-calculate-stats/index.ts
// Calcular estatísticas
// - Conversion rate por variante
// - Chi-square test
// - Confidence interval
// - Declarar vencedor (95% confidence)
```

**3. Frontend Components**
```typescript
// src/pages/ABTests.tsx
// Lista de experimentos

// src/components/ab-testing/TestBuilder.tsx
// Criar experimento
// - Definir objetivo (reply rate, conversion, etc)
// - Configurar variantes
// - Definir duração
// - Sample size calculator

// src/components/ab-testing/TestResults.tsx
// Resultados em tempo real
// - Conversion rate chart
// - Statistical significance badge
// - Winner declaration

// src/components/campaigns/ABTestToggle.tsx
// Ativar A/B test em campanha
```

**4. Tipos de Testes Suportados**
- **Campaign A/B:** Testar diferentes mensagens
- **Template A/B:** Testar diferentes templates
- **Chatbot A/B:** Testar diferentes fluxos
- **Send Time A/B:** Testar horários de envio
- **Subject Line A/B:** Testar assuntos de email

**5. Tarefas**
- [ ] Criar tabelas de A/B testing
- [ ] Variant assignment algorithm
- [ ] Event tracking integration
- [ ] Statistical significance calculator
- [ ] Test builder UI
- [ ] Results dashboard com charts
- [ ] Auto-declare winner
- [ ] Integrar com campanhas e chatbots
- [ ] Testes estatísticos

---

### ⚡ Sprint 18: Triggers Avançados

#### Implementação

**1. Database Schema**
```sql
-- Triggers avançados
CREATE TABLE advanced_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- Ver lista abaixo
  is_active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  frequency_limit JSONB, -- { per_contact: '1/day', global: '100/day' }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Execuções de triggers
CREATE TABLE trigger_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID REFERENCES advanced_triggers(id),
  contact_id UUID REFERENCES contacts(id),
  conversation_id UUID REFERENCES conversations(id),
  executed_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN,
  error_message TEXT,
  metadata JSONB
);
```

**2. Tipos de Triggers**

**Inatividade:**
- Nenhuma mensagem em X dias
- Nenhuma compra em X dias
- Deal parado em stage por X dias

**Comportamento:**
- Abandonou carrinho
- Visualizou produto mas não comprou
- Abriu email mas não clicou
- Conversão em chatbot

**Datas Especiais:**
- Aniversário
- Aniversário de primeira compra
- Data customizada (renovação contrato)
- Fim do trial

**Engajamento:**
- Respondeu campanha
- Clicou em link
- Baixou material
- Assistiu vídeo

**Mudança de Status:**
- Deal avançou/regrediu no pipeline
- Contato mudou de segmento
- Lead score aumentou/diminuiu
- Tag adicionada/removida

**3. Edge Functions**
```typescript
// supabase/functions/trigger-checker/index.ts
// Cron job que verifica triggers a cada hora
// - Inactivity triggers
// - Birthday triggers
// - Cart abandonment
// - Deal stage duration

// supabase/functions/trigger-execute/index.ts
// Executar ações do trigger
// - Enviar mensagem
// - Criar task
// - Atribuir a vendedor
// - Adicionar a cadência
// - Atualizar campo customizado
```

**4. Frontend Components**
```typescript
// src/pages/Triggers.tsx
// Lista de triggers

// src/components/triggers/TriggerBuilder.tsx
// Builder de triggers
// - Select trigger type
// - Configure conditions (visual if-then builder)
// - Configure actions
// - Set frequency limits

// src/components/triggers/TriggerAnalytics.tsx
// Métricas de performance
// - Executions count
// - Success rate
// - Conversion rate
```

**5. Exemplos de Triggers**

**Trigger: Carrinho Abandonado**
```json
{
  "name": "Carrinho Abandonado 24h",
  "trigger_type": "cart_abandoned",
  "conditions": {
    "hours_since_last_update": 24,
    "cart_total_min": 50
  },
  "actions": [
    {
      "type": "send_message",
      "template_id": "abc-123",
      "variables": {
        "cart_total": "{{ cart.total }}",
        "cart_link": "{{ cart.checkout_url }}"
      }
    },
    {
      "type": "create_task",
      "task": {
        "title": "Follow-up carrinho abandonado - {{ contact.name }}",
        "assigned_to": "auto"
      }
    }
  ],
  "frequency_limit": {
    "per_contact": "1/week"
  }
}
```

**Trigger: Aniversário**
```json
{
  "name": "Parabéns Aniversário",
  "trigger_type": "birthday",
  "conditions": {
    "days_before": 0, // No dia do aniversário
    "segment_id": "vip-customers"
  },
  "actions": [
    {
      "type": "send_message",
      "template_id": "birthday-wishes",
      "variables": {
        "discount_code": "{{ generate_code('BDAY2024') }}"
      }
    }
  ]
}
```

**6. Tarefas**
- [ ] Criar tabela de triggers
- [ ] Implementar 10+ tipos de triggers
- [ ] Trigger checker cron job
- [ ] Frequency limiting
- [ ] Trigger builder UI
- [ ] Template variables support
- [ ] Analytics dashboard
- [ ] Testes de cada tipo de trigger

---

## 🟢 FASE 4 - ANALYTICS + INTEGRAÇÕES (Sprints 19-24)

### 📊 Sprint 19: Dashboards Customizáveis

#### Implementação

**1. Database Schema**
```sql
-- Dashboards customizados
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL, -- React-Grid-Layout config
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Widgets
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES custom_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'metric', 'chart', 'table', 'funnel', 'leaderboard'
  title TEXT,
  config JSONB NOT NULL,
  position JSONB NOT NULL, -- { x, y, w, h }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Compartilhamento de dashboards
CREATE TABLE dashboard_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES custom_dashboards(id),
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_with_team_id UUID REFERENCES teams(id),
  permissions TEXT DEFAULT 'view', -- 'view', 'edit'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Tipos de Widgets**

**Métricas:**
- KPI Card (número grande com variação)
- Sparkline (mini-gráfico inline)
- Progress Bar
- Gauge

**Gráficos:**
- Line Chart (séries temporais)
- Bar Chart
- Pie/Donut Chart
- Area Chart
- Scatter Plot
- Heatmap

**Tabelas:**
- Data Table com sorting/filtering
- Pivot Table
- Top N list

**Funis:**
- Conversion Funnel
- Sales Pipeline
- Cadence Performance

**Outros:**
- Leaderboard
- Calendar Heatmap
- Map (conversas por região)

**3. Frontend Components**
```typescript
// src/pages/CustomDashboards.tsx
// Lista de dashboards

// src/components/dashboards/DashboardBuilder.tsx
// Editor drag-and-drop (React-Grid-Layout)
// - Widget palette
// - Canvas com grid
// - Configuração de widgets

// src/components/dashboards/widgets/
// ├── MetricWidget.tsx
// ├── ChartWidget.tsx
// ├── TableWidget.tsx
// ├── FunnelWidget.tsx
// └── WidgetConfigPanel.tsx

// src/components/dashboards/DashboardViewer.tsx
// Visualização do dashboard
// - Auto-refresh (30s, 1min, 5min)
// - Export to PDF
// - Fullscreen mode
```

**4. Data Sources para Widgets**
- Conversations
- Messages
- Deals
- Contacts
- Campaigns
- Tasks
- Products/Orders
- Custom queries (SQL Builder simples)

**5. Features**
- Filtros globais (date range, team, channel)
- Real-time updates via Supabase Realtime
- Template dashboards (Sales, Support, Marketing)
- Schedule email reports
- Public sharing links

**6. Tarefas**
- [ ] Implementar React-Grid-Layout
- [ ] Criar 15+ widget types
- [ ] Widget configuration UI
- [ ] Data fetching layer
- [ ] Filtros globais
- [ ] Auto-refresh
- [ ] PDF export
- [ ] Template dashboards
- [ ] Testes

---

### 👥 Sprint 20: Cohort Analysis

#### Implementação

**1. Database Schema**
```sql
-- Cohorts
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cohort_date DATE NOT NULL, -- Data de criação da cohort (ex: mês de cadastro)
  cohort_type TEXT NOT NULL, -- 'registration', 'first_purchase', 'campaign'
  contact_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas de cohort
CREATE TABLE cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  period INTEGER NOT NULL, -- 0, 1, 2, 3... (semanas/meses desde cohort_date)
  active_count INTEGER,
  churned_count INTEGER,
  revenue DECIMAL(10,2),
  ltv DECIMAL(10,2),
  measured_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**
```typescript
// supabase/functions/cohort-builder/index.ts
// Gerar cohorts automaticamente
// - Agrupar contatos por mês de registro
// - Agrupar por mês de primeira compra
// - Agrupar por campanha de origem

// supabase/functions/cohort-calculate-retention/index.ts
// Calcular retenção por cohort
// Exemplo: dos 100 contatos que se cadastraram em Jan/2024,
// quantos ainda estão ativos em Fev, Mar, Abr...?

// supabase/functions/cohort-calculate-ltv/index.ts
// Calcular Lifetime Value por cohort
```

**3. Frontend Components**
```typescript
// src/pages/CohortAnalysis.tsx
// Página de análise de cohorts

// src/components/cohorts/CohortRetentionMatrix.tsx
// Matriz de retenção (heatmap)
// Linhas: Cohorts (Jan, Feb, Mar...)
// Colunas: Períodos (0, 1, 2, 3...)
// Valores: % de retenção

// src/components/cohorts/CohortLTVChart.tsx
// Gráfico de LTV por cohort

// src/components/cohorts/ChurnPrediction.tsx
// ML model para prever churn
```

**4. Análises**

**Retention Cohort:**
```
         Week 0  Week 1  Week 2  Week 3  Week 4
Jan 2024  100%    65%     52%     45%     40%
Feb 2024  100%    70%     58%     50%     -
Mar 2024  100%    68%     55%     -       -
Apr 2024  100%    72%     -       -       -
```

**Revenue Cohort:**
```
         Month 0  Month 1  Month 2  Month 3  LTV
Jan 2024  $5,000  $3,200   $2,800   $2,500  $13,500
Feb 2024  $6,000  $4,000   $3,500   -       $13,500
Mar 2024  $5,500  $3,800   -        -       $9,300
```

**5. Tarefas**
- [ ] Criar tabelas de cohort
- [ ] Cohort generation algorithm
- [ ] Retention calculation
- [ ] LTV calculation
- [ ] Retention matrix UI (heatmap)
- [ ] LTV chart
- [ ] Churn prediction (ML opcional)
- [ ] Export cohort data
- [ ] Testes

---

### 🎯 Sprint 21: Attribution Tracking

#### Implementação

**1. Database Schema**
```sql
-- Touchpoints (pontos de contato na jornada)
CREATE TABLE attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  touchpoint_type TEXT NOT NULL, -- 'campaign', 'email', 'whatsapp', 'ad', 'website'
  channel TEXT, -- 'whatsapp', 'instagram', 'email', 'facebook_ads'
  campaign_id UUID REFERENCES campaigns(id),
  source TEXT, -- UTM source
  medium TEXT, -- UTM medium
  campaign_name TEXT, -- UTM campaign
  content TEXT, -- UTM content
  timestamp TIMESTAMPTZ DEFAULT now(),
  revenue_attributed DECIMAL(10,2), -- Revenue atribuído a este touchpoint
  metadata JSONB
);

-- Modelos de atribuição
CREATE TABLE attribution_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'first_touch', 'last_touch', 'linear', 'time_decay', 'u_shaped'
  is_active BOOLEAN DEFAULT false,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Resultados de atribuição
CREATE TABLE attribution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES attribution_models(id),
  deal_id UUID REFERENCES deals(id),
  channel TEXT,
  campaign_id UUID,
  attributed_revenue DECIMAL(10,2),
  attribution_percentage DECIMAL(5,2),
  calculated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Modelos de Atribuição**

**First-Touch:**
- 100% do crédito para o primeiro touchpoint

**Last-Touch:**
- 100% do crédito para o último touchpoint

**Linear:**
- Crédito dividido igualmente entre todos os touchpoints

**Time-Decay:**
- Mais crédito para touchpoints recentes
- Exemplo: 50% último, 30% penúltimo, 20% primeiro

**U-Shaped (Position-Based):**
- 40% primeiro, 40% último, 20% dividido no meio

**W-Shaped:**
- 30% primeiro, 30% conversão, 30% último, 10% no meio

**3. Edge Functions**
```typescript
// supabase/functions/attribution-calculate/index.ts
// Calcular atribuição quando deal é ganho
// - Buscar todos touchpoints do contato
// - Aplicar modelo de atribuição selecionado
// - Distribuir revenue entre touchpoints

// supabase/functions/attribution-track-touchpoint/index.ts
// Rastrear novo touchpoint
// - UTM parameters
// - Campaign click
// - WhatsApp message received
```

**4. Frontend Components**
```typescript
// src/pages/Attribution.tsx
// Página de análise de atribuição

// src/components/attribution/AttributionChart.tsx
// Visualização de atribuição
// - Sunburst chart (hierárquico)
// - Sankey diagram (fluxo)

// src/components/attribution/ChannelROI.tsx
// ROI por canal
// Revenue / Custo

// src/components/attribution/JourneyMap.tsx
// Visualização da jornada do cliente
// Timeline de touchpoints

// src/components/attribution/ModelSelector.tsx
// Selecionar modelo de atribuição
// Compare diferentes modelos
```

**5. Integrações**
- Facebook Ads (via API): Custo por campanha
- Google Ads (via API): Custo por campanha
- UTM tracking automático em links
- Webhook para rastrear conversões externas

**6. Tarefas**
- [ ] Criar tabelas de attribution
- [ ] Implementar 6 modelos de atribuição
- [ ] Touchpoint tracking automático
- [ ] Attribution calculation engine
- [ ] Channel ROI dashboard
- [ ] Journey map visualization
- [ ] Model comparison UI
- [ ] Integrar com Facebook/Google Ads APIs
- [ ] Testes

---

### 🔗 Sprint 22: Zapier/Make Integration

#### Implementação

**1. Criar App no Zapier Platform**

**Triggers:**
- New Contact Created
- New Conversation Started
- New Message Received
- Deal Stage Changed
- Deal Won/Lost
- Campaign Sent
- Task Completed
- Tag Added to Contact

**Actions:**
- Create Contact
- Send Message
- Create Deal
- Update Deal Stage
- Add Tag to Contact
- Create Task
- Send Campaign

**Searches:**
- Find Contact by Phone
- Find Deal by ID
- Find Conversation by Contact

**2. Edge Functions para Zapier**
```typescript
// supabase/functions/zapier-webhook-trigger/index.ts
// Enviar dados para Zapier quando evento ocorre

// supabase/functions/zapier-create-contact/index.ts
// Action: criar contato

// supabase/functions/zapier-send-message/index.ts
// Action: enviar mensagem
```

**3. Webhooks**
```sql
-- Configurar webhooks na tabela existente
INSERT INTO webhooks (company_id, event, url, is_active) VALUES
  ('...', 'contact.created', 'https://hooks.zapier.com/...', true),
  ('...', 'message.received', 'https://hooks.zapier.com/...', true);
```

**4. Make (Integromat) Integration**
- Similar ao Zapier
- Criar módulos no Make Developer Platform

**5. N8N Integration**
- Self-hosted alternative
- HTTP Request nodes
- Webhook nodes

**6. Tarefas**
- [ ] Criar app no Zapier Platform
- [ ] Definir triggers/actions/searches
- [ ] Implementar authentication (API Key)
- [ ] Testing environment no Zapier
- [ ] Publicar app no Zapier Marketplace
- [ ] Criar app no Make
- [ ] Documentação de integração
- [ ] Exemplos de workflows (Zap Templates)

---

### 📈 Sprint 23: RD Station + HubSpot Integration

#### Implementação

**1. Database Schema**
```sql
-- Configuração de integrações CRM
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'rdstation', 'hubspot', 'pipedrive', 'salesforce'
  is_active BOOLEAN DEFAULT false,
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  token_expires_at TIMESTAMPTZ,
  config JSONB, -- Provider-specific config
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mapeamento de campos
CREATE TABLE crm_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id),
  local_entity TEXT, -- 'contact', 'deal', 'company'
  local_field TEXT,
  remote_field TEXT,
  sync_direction TEXT, -- 'bidirectional', 'to_remote', 'to_local'
  transform_function TEXT, -- Função de transformação (ex: uppercase)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de sincronização
CREATE TABLE crm_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id),
  entity_type TEXT,
  entity_id UUID,
  action TEXT, -- 'create', 'update', 'delete'
  direction TEXT, -- 'to_remote', 'from_remote'
  success BOOLEAN,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);
```

**2. RD Station Integration**

**OAuth Flow:**
```typescript
// supabase/functions/rdstation-oauth-callback/index.ts
// Trocar code por access_token
```

**Sync Functions:**
```typescript
// supabase/functions/rdstation-sync-contacts/index.ts
// Sincronizar contatos
// - Buscar contatos atualizados desde last_sync
// - Atualizar no RD Station
// - Importar novos leads do RD

// supabase/functions/rdstation-create-event/index.ts
// Criar evento de conversão no RD Station
// - Quando deal é ganho
// - Quando email é aberto
```

**RD Station API Endpoints:**
- GET /platform/contacts
- POST /platform/contacts
- PATCH /platform/contacts/{uuid}
- POST /platform/conversions
- POST /platform/events

**3. HubSpot Integration**

**OAuth Flow:**
```typescript
// supabase/functions/hubspot-oauth-callback/index.ts
```

**Sync Functions:**
```typescript
// supabase/functions/hubspot-sync-contacts/index.ts
// Bidirectional sync de contatos

// supabase/functions/hubspot-sync-deals/index.ts
// Bidirectional sync de deals

// supabase/functions/hubspot-sync-companies/index.ts
// Sync de empresas
```

**HubSpot API:**
- CRM API v3
- Contacts, Deals, Companies
- Properties
- Associations
- Webhooks

**4. Frontend Components**
```typescript
// src/pages/Integrations.tsx
// Central de integrações

// src/components/integrations/RDStationSetup.tsx
// OAuth flow + configuração

// src/components/integrations/HubSpotSetup.tsx
// OAuth flow + configuração

// src/components/integrations/FieldMapper.tsx
// UI para mapear campos
// Drag-and-drop de campos

// src/components/integrations/SyncLog.tsx
// Histórico de sincronizações
```

**5. Features**
- **Bidirectional Sync:** Mudanças em ambos os sistemas se refletem
- **Conflict Resolution:** Last-write-wins ou manual
- **Custom Field Mapping:** Usuário define mapeamento
- **Selective Sync:** Escolher quais pipelines/listas sincronizar
- **Real-time Webhooks:** Mudanças instantâneas via webhooks

**6. Tarefas**
- [ ] OAuth flow para RD Station
- [ ] OAuth flow para HubSpot
- [ ] Bidirectional sync engine
- [ ] Field mapping UI
- [ ] Conflict resolution
- [ ] Webhook handling
- [ ] Sync log e monitoring
- [ ] Error handling e retry logic
- [ ] Testes de integração

---

### 🏭 Sprint 24: Tiny/Bling ERP Integration

#### Implementação

**1. Database Schema**
```sql
-- Configuração ERP
CREATE TABLE erp_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'tiny', 'bling', 'omie'
  api_token TEXT ENCRYPTED,
  is_active BOOLEAN DEFAULT false,
  config JSONB,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sincronização de produtos
CREATE TABLE erp_product_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES erp_integrations(id),
  local_product_id UUID REFERENCES products(id),
  remote_product_id TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT -- 'synced', 'pending', 'error'
);

-- Sincronização de pedidos
CREATE TABLE erp_order_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES erp_integrations(id),
  local_order_id UUID REFERENCES orders(id),
  remote_order_id TEXT,
  remote_invoice_id TEXT, -- ID da NF-e
  invoice_url TEXT,
  sync_status TEXT,
  synced_at TIMESTAMPTZ
);
```

**2. Tiny ERP Integration**

**API Endpoints:**
```typescript
// supabase/functions/tiny-sync-products/index.ts
// GET /produtos.pesquisa.php
// POST /produto.incluir.php

// supabase/functions/tiny-create-order/index.ts
// POST /pedido.incluir.php

// supabase/functions/tiny-update-stock/index.ts
// POST /produto.alterar.estoque.php

// supabase/functions/tiny-get-invoice/index.ts
// GET /nota.fiscal.obter.php
```

**Features:**
- Sincronizar catálogo de produtos
- Atualizar estoque em tempo real
- Criar pedido no Tiny quando order é pago
- Buscar NF-e emitida
- Enviar link da NF-e para cliente no WhatsApp

**3. Bling ERP Integration**

**API Endpoints:**
```typescript
// supabase/functions/bling-sync-products/index.ts
// GET /produtos/page={page}

// supabase/functions/bling-create-order/index.ts
// POST /pedido/json

// supabase/functions/bling-get-nfe/index.ts
// GET /notafiscal/{numero}
```

**4. Frontend Components**
```typescript
// src/components/integrations/ERPSetup.tsx
// Configuração de ERP (Tiny/Bling)

// src/components/integrations/ProductSyncManager.tsx
// Gerenciar sincronização de produtos
// - Mapear produtos locais com ERP
// - Forçar sync manual
// - Resolver conflitos

// src/components/integrations/OrderSync.tsx
// Visualizar status de sincronização de pedidos
```

**5. Fluxo Completo**
```
1. Cliente faz pedido no WhatsApp
2. Order é criado no sistema
3. Cliente paga via PIX
4. Payment webhook confirma pagamento
5. Edge function cria pedido no Tiny/Bling
6. ERP processa pedido
7. ERP emite NF-e
8. Webhook do ERP notifica NF-e emitida
9. Sistema busca NF-e
10. Envia link da NF-e para cliente no WhatsApp
11. Atualiza status do pedido para "Faturado"
```

**6. Tarefas**
- [ ] Implementar Tiny API wrapper
- [ ] Implementar Bling API wrapper
- [ ] Product sync bidirectional
- [ ] Stock updates em tempo real
- [ ] Order creation no ERP
- [ ] NF-e retrieval
- [ ] Automated WhatsApp notification com NF-e
- [ ] Error handling e retry
- [ ] Testes de integração

---

## 🔵 FASE 5 - MOBILE + ENTERPRISE (Sprints 25-32)

### 📱 Sprint 25-27: App React Native

#### Implementação

**1. Setup do Projeto**
```bash
npx create-expo-app@latest evotalk-mobile --template blank-typescript
cd evotalk-mobile
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/stack
npm install react-native-safe-area-context react-native-screens
```

**2. Estrutura do App**
```
evotalk-mobile/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Chat/
│   │   │   ├── ConversationListScreen.tsx
│   │   │   ├── MessageScreen.tsx
│   │   │   └── ContactDetailScreen.tsx
│   │   ├── CRM/
│   │   │   ├── PipelineScreen.tsx
│   │   │   └── DealDetailScreen.tsx
│   │   ├── Contacts/
│   │   │   └── ContactListScreen.tsx
│   │   ├── Tasks/
│   │   │   └── TaskListScreen.tsx
│   │   └── Profile/
│   │       └── ProfileScreen.tsx
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── DealCard.tsx
│   │   └── ...
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   └── push-notifications.ts
│   ├── hooks/
│   │   ├── useConversations.ts
│   │   ├── useMessages.ts
│   │   └── usePushNotifications.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   └── theme/
│       └── colors.ts
└── app.json
```

**3. Features Essenciais**

**Sprint 25: Core + Auth**
- Autenticação (login/logout)
- Navigation stack
- Supabase client setup
- Token refresh
- Biometric auth (Face ID/Touch ID)

**Sprint 26: Chat + Notifications**
- Lista de conversas
- Tela de mensagens
- Enviar mensagem (texto, imagem, áudio)
- Push notifications (FCM/APNs)
- Badge count de não lidas
- Real-time updates (Supabase Realtime)

**Sprint 27: CRM + Polish**
- Pipeline visual
- Detalhes de deal
- Lista de tarefas
- Perfil do usuário
- Offline mode (AsyncStorage)
- Deep linking
- Share extension

**4. Push Notifications**
```typescript
// src/services/push-notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}
```

**5. Database Schema**
```sql
-- Device tokens para push notifications
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios', 'android'
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**6. Edge Functions**
```typescript
// supabase/functions/send-push-notification/index.ts
// Enviar push notification via Expo Push Service
// Triggered quando nova mensagem chega
```

**7. Tarefas**
- [ ] Setup Expo project
- [ ] Implementar autenticação
- [ ] Navigation structure
- [ ] Chat screens (lista + mensagens)
- [ ] CRM screens (pipeline + deals)
- [ ] Tasks screen
- [ ] Push notifications setup
- [ ] Offline support
- [ ] Deep linking
- [ ] TestFlight/Google Play beta
- [ ] Publicação nas stores

---

### 🔐 Sprint 28: SSO (SAML/OAuth)

#### Implementação

**1. Database Schema**
```sql
-- Configuração SSO
CREATE TABLE sso_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'microsoft', 'okta', 'saml'
  is_enabled BOOLEAN DEFAULT false,
  client_id TEXT,
  client_secret TEXT ENCRYPTED,
  metadata_url TEXT, -- SAML metadata URL
  certificate TEXT, -- SAML certificate
  enforce_sso BOOLEAN DEFAULT false, -- Forçar SSO para todos usuários
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mapeamento de usuários SSO
CREATE TABLE sso_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);
```

**2. Providers Suportados**

**Google OAuth:**
```typescript
// supabase/functions/sso-google-callback/index.ts
// OAuth flow do Google
```

**Microsoft Azure AD:**
```typescript
// supabase/functions/sso-azure-callback/index.ts
// OAuth flow do Azure AD
```

**Okta:**
```typescript
// supabase/functions/sso-okta-callback/index.ts
// SAML flow do Okta
```

**SAML Generic:**
```typescript
// supabase/functions/sso-saml-acs/index.ts
// Assertion Consumer Service
// Processar SAML response
```

**3. Frontend Components**
```typescript
// src/components/auth/SSOLoginButton.tsx
// Botão "Login with Google / Microsoft / Okta"

// src/pages/SSOSettings.tsx
// Configuração de SSO (admin)
// - Upload de certificate
// - Metadata URL
// - Test connection
```

**4. SAML Flow**
```
1. User clica "Login with Okta"
2. Redirect para IdP (Okta)
3. User autentica no Okta
4. Okta retorna SAML assertion
5. ACS valida assertion
6. Cria/atualiza user no Supabase
7. Gera session token
8. Redirect para app
```

**5. Features**
- **Just-in-Time (JIT) Provisioning:** Criar usuário automaticamente no primeiro login
- **Attribute Mapping:** Mapear atributos SAML para campos do usuário
- **Group Sync:** Sincronizar grupos do IdP com roles no app
- **Enforce SSO:** Forçar todos usuários da empresa a usar SSO
- **Multi-IdP:** Suportar múltiplos IdPs por empresa

**6. Tarefas**
- [ ] Implementar Google OAuth
- [ ] Implementar Microsoft OAuth
- [ ] Implementar SAML generic
- [ ] JIT provisioning
- [ ] Attribute mapping
- [ ] Group sync
- [ ] SSO settings UI
- [ ] Test connection feature
- [ ] Enforce SSO logic
- [ ] Testes com cada provider

---

### 📋 Sprint 29: Audit Logs (Aprimoramento)

#### Implementação

**1. Database Schema (já existe, vamos aprimorar)**
```sql
-- Aprimorar tabela existente
ALTER TABLE access_audit_log ADD COLUMN ip_address INET;
ALTER TABLE access_audit_log ADD COLUMN user_agent TEXT;
ALTER TABLE access_audit_log ADD COLUMN session_id TEXT;
ALTER TABLE access_audit_log ADD COLUMN risk_score INTEGER; -- 0-100
ALTER TABLE access_audit_log ADD COLUMN geo_location JSONB; -- { country, city, lat, lon }

-- Criar índices para performance
CREATE INDEX idx_audit_log_company_timestamp ON access_audit_log(company_id, created_at DESC);
CREATE INDEX idx_audit_log_user_id ON access_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON access_audit_log(action);

-- Tabela de eventos suspeitos
CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL, -- 'unusual_location', 'multiple_failed_logins', 'data_export'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'resolved'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Eventos Auditados**

**Autenticação:**
- Login success/failure
- Logout
- Password change
- 2FA enabled/disabled
- Session timeout

**Dados:**
- Contact created/updated/deleted
- Deal created/updated/deleted
- Bulk data export
- Import contacts

**Configurações:**
- User invited/removed
- Role changed
- Integration connected/disconnected
- API key created/revoked

**Mensagens:**
- Message sent
- Campaign created/sent
- Template created/updated

**Segurança:**
- Failed login attempts (> 5)
- Access from new location
- Access from new device
- Permission denied

**3. Edge Functions**
```typescript
// supabase/functions/audit-log-create/index.ts
// Wrapper para criar log de auditoria
export async function createAuditLog(params: {
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Detectar localização por IP (GeoIP)
  const geoLocation = await getGeoLocation(params.ipAddress);

  // Calcular risk score
  const riskScore = calculateRiskScore({
    action: params.action,
    location: geoLocation,
    timeOfDay: new Date().getHours(),
  });

  // Salvar no banco
  await supabase.from('access_audit_log').insert({
    ...params,
    geo_location: geoLocation,
    risk_score: riskScore,
  });

  // Se risco alto, criar alerta
  if (riskScore > 70) {
    await createSecurityAlert({
      companyId: params.companyId,
      userId: params.userId,
      alertType: 'high_risk_action',
      severity: 'high',
      description: `High risk action detected: ${params.action}`,
      metadata: params.metadata,
    });
  }
}

// supabase/functions/security-monitor/index.ts
// Cron job para detectar padrões suspeitos
// - Múltiplos logins falhados
// - Acesso de localização incomum
// - Exportação em massa de dados
```

**4. Frontend Components**
```typescript
// src/pages/AuditLogs.tsx
// Página de audit logs (já existe, vamos aprimorar)

// src/components/audit/AuditLogViewer.tsx
// Visualizador avançado
// - Filtros: user, action, date range, entity type
// - Timeline view
// - Export to CSV

// src/components/audit/SecurityAlerts.tsx
// Dashboard de alertas de segurança
// - Alertas críticos em destaque
// - Ações: acknowledge, resolve, block user

// src/components/audit/UserActivityTimeline.tsx
// Timeline de atividades de um usuário específico
```

**5. Features**
- **Real-time Monitoring:** Dashboard com eventos em tempo real
- **Advanced Filtering:** Por usuário, ação, data, IP, localização
- **Anomaly Detection:** ML para detectar comportamentos anômalos
- **Retention Policy:** Configurar quanto tempo manter logs
- **Compliance Reports:** Relatórios para auditoria (SOC2, ISO 27001)
- **Export:** Exportar logs para análise externa (SIEM)

**6. Tarefas**
- [ ] Aprimorar tabela de audit log
- [ ] Implementar GeoIP lookup
- [ ] Risk scoring algorithm
- [ ] Security alerts system
- [ ] Anomaly detection (padrões suspeitos)
- [ ] Advanced filtering UI
- [ ] Real-time monitoring dashboard
- [ ] Compliance reports (PDF)
- [ ] Export to CSV/JSON
- [ ] Testes

---

### 🔒 Sprint 30: 2FA Obrigatório

#### Implementação

**1. Database Schema**
```sql
-- Configuração de 2FA por empresa
CREATE TABLE company_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false, -- Obrigatório para todos
  grace_period_days INTEGER DEFAULT 7, -- Período de adaptação
  allowed_methods TEXT[] DEFAULT ARRAY['totp', 'sms'], -- 'totp', 'sms', 'email'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2FA do usuário
CREATE TABLE user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL, -- 'totp', 'sms'
  is_enabled BOOLEAN DEFAULT false,
  secret TEXT ENCRYPTED, -- TOTP secret
  backup_codes TEXT[] ENCRYPTED, -- 10 códigos de backup
  phone_number TEXT, -- Para SMS
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

-- Tentativas de 2FA
CREATE TABLE two_fa_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  method TEXT,
  success BOOLEAN,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. TOTP Implementation**
```typescript
// supabase/functions/2fa-setup-totp/index.ts
import { authenticator } from 'otplib';

export async function setupTOTP(userId: string) {
  // Gerar secret
  const secret = authenticator.generateSecret();

  // Gerar QR code
  const otpauth = authenticator.keyuri(
    userEmail,
    'EvoTalk Gateway',
    secret
  );

  const qrCode = await QRCode.toDataURL(otpauth);

  // Gerar backup codes
  const backupCodes = generateBackupCodes(10);

  // Salvar no banco (ainda não verified)
  await supabase.from('user_2fa').insert({
    user_id: userId,
    method: 'totp',
    secret: encrypt(secret),
    backup_codes: backupCodes.map(encrypt),
    is_enabled: false, // Só habilita após verificar
  });

  return { qrCode, secret, backupCodes };
}

// supabase/functions/2fa-verify-totp/index.ts
export async function verifyTOTP(userId: string, token: string) {
  const { secret } = await get2FAConfig(userId);
  const isValid = authenticator.verify({ token, secret });

  if (isValid) {
    // Marcar como verificado e habilitado
    await supabase.from('user_2fa')
      .update({ is_enabled: true, verified_at: new Date() })
      .eq('user_id', userId);
  }

  return isValid;
}

// supabase/functions/2fa-login-verify/index.ts
// Verificar código 2FA no login
```

**3. SMS Implementation**
```typescript
// supabase/functions/2fa-send-sms/index.ts
// Enviar código via SMS (Twilio)
export async function send2FASMS(phoneNumber: string) {
  const code = generateRandomCode(6); // 6 dígitos

  // Salvar em cache (5 min)
  await redis.set(`2fa:${phoneNumber}`, code, 'EX', 300);

  // Enviar via Twilio
  await twilioClient.messages.create({
    body: `Seu código de verificação é: ${code}`,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER,
  });

  return true;
}
```

**4. Frontend Components**
```typescript
// src/components/auth/Setup2FA.tsx
// Wizard de setup
// Step 1: Escolher método (TOTP/SMS)
// Step 2: Scan QR code / Inserir número
// Step 3: Verificar código
// Step 4: Baixar backup codes

// src/components/auth/Verify2FA.tsx
// Tela de verificação no login
// Input de 6 dígitos
// Link "Usar backup code"
// Link "Não tenho acesso"

// src/pages/Security2FA.tsx
// Settings de 2FA
// - Enable/disable
// - Regenerate backup codes
// - Change phone number
// - Trusted devices

// src/components/admin/Enforce2FA.tsx
// Admin: forçar 2FA para toda empresa
// - Toggle obrigatório
// - Grace period
// - Métodos permitidos
```

**5. Enforcement Logic**
```typescript
// Quando 2FA é obrigatório:
// 1. User faz login
// 2. Se 2FA não configurado:
//    - Mostrar aviso
//    - Permitir acesso limitado (grace period)
//    - Após grace period: forçar setup
// 3. Se 2FA configurado:
//    - Solicitar código
//    - Verificar
//    - Permitir acesso
```

**6. Backup Codes**
- Gerar 10 códigos de backup
- Usar somente uma vez cada
- Permitir regenerar (invalidar anteriores)
- Salvar encrypted no banco

**7. Trusted Devices**
```sql
CREATE TABLE trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  device_fingerprint TEXT UNIQUE,
  device_name TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 30 dias
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- Usuário pode marcar dispositivo como confiável (30 dias)
- Não solicitar 2FA em dispositivos confiáveis

**8. Tarefas**
- [ ] Implementar TOTP (otplib)
- [ ] QR code generation
- [ ] Backup codes
- [ ] SMS 2FA (Twilio)
- [ ] 2FA verification no login
- [ ] Setup wizard UI
- [ ] Admin enforcement settings
- [ ] Grace period logic
- [ ] Trusted devices
- [ ] Recovery flow (perdeu acesso)
- [ ] Testes

---

### 🇧🇷 Sprint 31: LGPD Compliance

#### Implementação

**1. Database Schema**
```sql
-- Consentimentos LGPD
CREATE TABLE lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  consent_type TEXT NOT NULL, -- 'data_processing', 'marketing', 'third_party_sharing'
  is_granted BOOLEAN NOT NULL,
  consent_source TEXT, -- 'form', 'chat', 'email', 'api'
  ip_address INET,
  user_agent TEXT,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitações de titular de dados (DSAR - Data Subject Access Request)
CREATE TABLE lgpd_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  request_type TEXT NOT NULL, -- 'access', 'correction', 'deletion', 'portability'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  requested_by TEXT, -- Email/phone do solicitante
  verification_status TEXT, -- 'pending', 'verified'
  verification_token TEXT,
  processing_notes TEXT,
  completed_at TIMESTAMPTZ,
  export_url TEXT, -- URL do arquivo exportado (se type = access/portability)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Política de retenção de dados
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  data_type TEXT NOT NULL, -- 'contacts', 'messages', 'audit_logs'
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de anonimização/deleção
CREATE TABLE lgpd_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  entity_type TEXT, -- 'contact', 'message', 'deal'
  entity_id UUID,
  deletion_type TEXT, -- 'anonymization', 'hard_delete'
  reason TEXT,
  requested_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**

```typescript
// supabase/functions/lgpd-export-data/index.ts
// Exportar todos dados de um contato
export async function exportContactData(contactId: string) {
  // Buscar TODOS os dados relacionados ao contato
  const contact = await supabase.from('contacts').select('*').eq('id', contactId).single();
  const messages = await supabase.from('messages').select('*').eq('contact_id', contactId);
  const deals = await supabase.from('deals').select('*').eq('contact_id', contactId);
  const conversations = await supabase.from('conversations').select('*').eq('contact_id', contactId);
  const consents = await supabase.from('lgpd_consents').select('*').eq('contact_id', contactId);

  // Gerar JSON estruturado
  const exportData = {
    contact,
    messages: messages.data,
    deals: deals.data,
    conversations: conversations.data,
    consents: consents.data,
    exported_at: new Date().toISOString(),
  };

  // Fazer upload para Supabase Storage
  const fileName = `lgpd-export-${contactId}-${Date.now()}.json`;
  const { data } = await supabase.storage
    .from('lgpd-exports')
    .upload(fileName, JSON.stringify(exportData, null, 2));

  // Gerar URL temporária (expires em 7 dias)
  const { signedURL } = await supabase.storage
    .from('lgpd-exports')
    .createSignedUrl(fileName, 604800);

  return signedURL;
}

// supabase/functions/lgpd-anonymize-contact/index.ts
// Anonimizar dados de um contato
export async function anonymizeContact(contactId: string) {
  const anonymizedData = {
    name: 'Usuário Anonimizado',
    email: null,
    phone: `ANON-${contactId.slice(0, 8)}`,
    cpf: null,
    avatar_url: null,
    custom_fields: {},
    notes: null,
    anonymized_at: new Date(),
  };

  await supabase.from('contacts').update(anonymizedData).eq('id', contactId);

  // Anonimizar mensagens
  await supabase.from('messages')
    .update({ content: '[Mensagem anonimizada]' })
    .eq('contact_id', contactId);

  // Log de anonimização
  await supabase.from('lgpd_deletion_log').insert({
    entity_type: 'contact',
    entity_id: contactId,
    deletion_type: 'anonymization',
    reason: 'LGPD data request',
  });
}

// supabase/functions/lgpd-delete-contact/index.ts
// Hard delete de todos dados de um contato
export async function deleteContact(contactId: string) {
  // Deletar em cascata (foreign keys com ON DELETE CASCADE)
  await supabase.from('contacts').delete().eq('id', contactId);

  // Log
  await supabase.from('lgpd_deletion_log').insert({
    entity_type: 'contact',
    entity_id: contactId,
    deletion_type: 'hard_delete',
    reason: 'LGPD data request',
  });
}

// supabase/functions/lgpd-auto-cleanup/index.ts
// Cron job diário para limpar dados expirados
export async function autoCleanup() {
  // Buscar políticas de retenção
  const policies = await supabase.from('data_retention_policies').select('*').eq('auto_delete', true);

  for (const policy of policies.data) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - policy.retention_days);

    if (policy.data_type === 'messages') {
      // Anonimizar mensagens antigas
      await supabase.from('messages')
        .update({ content: '[Mensagem expirada]' })
        .lt('created_at', expiryDate.toISOString());
    }
  }
}
```

**3. Frontend Components**

```typescript
// src/pages/LGPDCompliance.tsx
// Central de LGPD

// src/components/lgpd/ConsentManager.tsx
// Gerenciar consentimentos de contatos
// - Visualizar consentimentos ativos
// - Histórico de consentimentos
// - Solicitar novo consentimento via WhatsApp

// src/components/lgpd/DataRequestManager.tsx
// Gerenciar solicitações de titulares
// - Lista de solicitações pendentes
// - Processar solicitação (exportar/anonimizar/deletar)
// - Verificar identidade do solicitante

// src/components/lgpd/RetentionPolicySettings.tsx
// Configurar políticas de retenção
// - Definir período de retenção por tipo de dado
// - Ativar auto-delete

// src/components/lgpd/PrivacyPolicyEditor.tsx
// Editor de Política de Privacidade
// - Template LGPD-compliant
// - Customizar por empresa
// - Versioning

// src/components/lgpd/ConsentForm.tsx
// Formulário de consentimento para exibir ao contato
// - Checkboxes para diferentes tipos de consentimento
// - Aceite de Termos de Uso
// - Aceite de Política de Privacidade
```

**4. Features**

**Portal do Titular:**
- Página pública onde titular pode:
  - Solicitar cópia dos dados
  - Solicitar correção
  - Solicitar exclusão
  - Revogar consentimentos
  - Verificação de identidade (email/SMS)

**Consent Management:**
- Double opt-in para marketing
- Rastreamento de consentimentos
- Renovação automática (expires_at)
- Audit trail completo

**Data Requests (DSAR):**
- Workflow de aprovação
- Prazo de 15 dias (LGPD)
- Verificação de identidade
- Export em formato legível (JSON/PDF)

**Retention Policies:**
- Definir por tipo de dado
- Auto-delete após período
- Notificações antes de deletar

**Privacy by Design:**
- Minimização de dados
- Anonimização onde possível
- Encryption at rest

**5. Tarefas**
- [ ] Criar tabelas LGPD
- [ ] Export data function
- [ ] Anonymization function
- [ ] Hard delete function
- [ ] Consent management UI
- [ ] Data request workflow
- [ ] Public DSAR portal
- [ ] Identity verification
- [ ] Retention policies
- [ ] Auto-cleanup cron job
- [ ] Privacy policy template
- [ ] Consent forms
- [ ] Audit logging para LGPD
- [ ] Testes de compliance

---

### 💰 Sprint 32: Commission Tracking

#### Implementação

**1. Database Schema**

```sql
-- Regras de comissão
CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  rule_type TEXT NOT NULL, -- 'percentage', 'fixed', 'tiered'
  applies_to TEXT NOT NULL, -- 'all_deals', 'specific_products', 'specific_pipeline'
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exemplo de config:
-- Percentage: { percentage: 10 }
-- Fixed: { amount: 500 }
-- Tiered: { tiers: [{ min: 0, max: 10000, percentage: 5 }, { min: 10000, max: null, percentage: 10 }] }

-- Comissões calculadas
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  deal_id UUID REFERENCES deals(id),
  member_id UUID REFERENCES company_members(id),
  rule_id UUID REFERENCES commission_rules(id),
  deal_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  approved_by UUID REFERENCES company_members(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajustes manuais de comissão
CREATE TABLE commission_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID REFERENCES commissions(id),
  adjusted_by UUID REFERENCES company_members(id),
  original_amount DECIMAL(10,2),
  new_amount DECIMAL(10,2),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Períodos de fechamento
CREATE TABLE commission_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'paid'
  total_amount DECIMAL(10,2),
  closed_by UUID REFERENCES company_members(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Edge Functions**

```typescript
// supabase/functions/commission-calculate/index.ts
// Triggered quando deal é marcado como "won"
export async function calculateCommission(dealId: string) {
  const deal = await supabase.from('deals').select('*, pipeline:pipelines(*)').eq('id', dealId).single();

  // Buscar regras aplicáveis
  const rules = await supabase.from('commission_rules')
    .select('*')
    .eq('company_id', deal.company_id)
    .eq('is_active', true);

  for (const rule of rules.data) {
    // Verificar se regra se aplica a este deal
    if (!ruleApplies(rule, deal)) continue;

    // Calcular comissão
    const commissionAmount = calculateAmount(rule, deal.value);

    // Criar registro de comissão
    await supabase.from('commissions').insert({
      company_id: deal.company_id,
      deal_id: deal.id,
      member_id: deal.owner_id,
      rule_id: rule.id,
      deal_value: deal.value,
      commission_amount: commissionAmount,
      status: 'pending',
    });
  }
}

function calculateAmount(rule: CommissionRule, dealValue: number): number {
  switch (rule.rule_type) {
    case 'percentage':
      return dealValue * (rule.config.percentage / 100);

    case 'fixed':
      return rule.config.amount;

    case 'tiered':
      const tier = rule.config.tiers.find(t =>
        dealValue >= t.min && (t.max === null || dealValue < t.max)
      );
      return tier ? dealValue * (tier.percentage / 100) : 0;

    default:
      return 0;
  }
}

// supabase/functions/commission-approve/index.ts
// Aprovar comissão (manager/admin)

// supabase/functions/commission-close-period/index.ts
// Fechar período de comissão (ex: mensal)
```

**3. Frontend Components**

```typescript
// src/pages/Commissions.tsx
// Página de comissões

// src/components/commissions/CommissionRulesManager.tsx
// Gerenciar regras de comissão
// - Criar nova regra
// - Editar regra existente
// - Desativar regra
// - Preview de cálculo

// src/components/commissions/CommissionDashboard.tsx
// Dashboard de comissões
// - Total pending/approved/paid
// - Top earners
// - Comissões por período
// - Gráfico de comissões ao longo do tempo

// src/components/commissions/CommissionTable.tsx
// Tabela de comissões
// - Filtros: member, status, period, deal
// - Sorting
// - Ações: approve, adjust, mark as paid

// src/components/commissions/CommissionApprovalFlow.tsx
// Fluxo de aprovação
// - Manager revisa
// - Pode fazer ajustes
// - Aprovar/rejeitar

// src/components/commissions/CommissionStatement.tsx
// Extrato de comissões (PDF)
// - Período
// - Deals que geraram comissão
// - Total a receber
// - Assinatura digital
```

**4. Tipos de Regras**

**Percentage (Porcentagem):**
```json
{
  "name": "Comissão Padrão Vendas",
  "rule_type": "percentage",
  "applies_to": "all_deals",
  "config": {
    "percentage": 10
  }
}
```
Deal de R$ 10.000 → Comissão de R$ 1.000

**Fixed (Fixo):**
```json
{
  "name": "Bônus Venda Enterprise",
  "rule_type": "fixed",
  "applies_to": "specific_products",
  "config": {
    "amount": 500,
    "product_ids": ["abc-123"]
  }
}
```
Qualquer venda do produto Enterprise → R$ 500

**Tiered (Escalonado):**
```json
{
  "name": "Comissão Progressiva",
  "rule_type": "tiered",
  "applies_to": "all_deals",
  "config": {
    "tiers": [
      { "min": 0, "max": 10000, "percentage": 5 },
      { "min": 10000, "max": 50000, "percentage": 7 },
      { "min": 50000, "max": null, "percentage": 10 }
    ]
  }
}
```
- R$ 0 - R$ 10k: 5%
- R$ 10k - R$ 50k: 7%
- Acima de R$ 50k: 10%

**5. Features**

**Commission Tracking:**
- Auto-calculate quando deal é won
- Múltiplas regras (stack ou exclusive)
- Split commission (dividir entre SDR + Closer)

**Approval Workflow:**
- Manager aprova comissões
- Pode fazer ajustes manuais
- Histórico de ajustes

**Payment Tracking:**
- Marcar como pago
- Referência de pagamento (PIX/transferência)
- Export para folha de pagamento

**Reporting:**
- Extrato mensal por vendedor
- Comparativo de performance
- Projeção de comissões (pipeline * conv rate)

**Gamification Integration:**
- Ranking de comissões
- Metas de comissão
- Badges por atingimento

**6. Tarefas**
- [ ] Criar tabelas de commission
- [ ] Auto-calculation on deal won
- [ ] Multiple rule types (percentage/fixed/tiered)
- [ ] Split commission
- [ ] Approval workflow
- [ ] Manual adjustments
- [ ] Period management (mensal)
- [ ] Commission dashboard
- [ ] PDF statement generation
- [ ] Integration com gamification
- [ ] Testes

---

## 📋 RESUMO EXECUTIVO

### Total de Sprints: 32 (64 semanas / ~16 meses)

### Distribuição de Esforço

**Fase 2 - Omnichannel + IA:** 8 sprints (16 sem)
- Instagram DM: 2 sprints
- Facebook Messenger: 2 sprints
- Inbox Unificado: 1 sprint
- Chatbot Builder: 1 sprint
- Knowledge Base + RAG: 1 sprint
- Transcrição de Áudios: 1 sprint

**Fase 3 - E-commerce + Automação:** 6 sprints (12 sem)
- Catálogo WhatsApp + Mini-Loja: 2 sprints
- Pagamento via Chat: 1 sprint
- Sales Cadences: 1 sprint
- A/B Testing: 1 sprint
- Triggers Avançados: 1 sprint

**Fase 4 - Analytics + Integrações:** 6 sprints (12 sem)
- Dashboards Customizáveis: 1 sprint
- Cohort Analysis: 1 sprint
- Attribution Tracking: 1 sprint
- Zapier/Make: 1 sprint
- RD Station + HubSpot: 1 sprint
- Tiny/Bling ERP: 1 sprint

**Fase 5 - Mobile + Enterprise:** 8 sprints (16 sem)
- App React Native: 3 sprints
- SSO (SAML/OAuth): 1 sprint
- Audit Logs (aprimoramento): 1 sprint
- 2FA Obrigatório: 1 sprint
- LGPD Compliance: 1 sprint
- Commission Tracking: 1 sprint

---

## 🎯 PRIORIZAÇÃO RECOMENDADA

### Quick Wins (Maior Impacto / Menor Esforço)
1. **Transcrição de Áudios** - Groq Whisper API (1 sprint)
2. **A/B Testing** - Aproveitar estrutura de campanhas (1 sprint)
3. **Triggers Avançados** - Extender workflows existentes (1 sprint)
4. **Commission Tracking** - Incentiva equipe de vendas (1 sprint)

### Alto Impacto (Diferenciadores de Mercado)
1. **Knowledge Base + RAG** - IA contextualizada (1 sprint)
2. **Sales Cadences** - Automação multi-canal (1 sprint)
3. **Mini-Loja + Pagamento** - E-commerce completo (3 sprints)
4. **Dashboards Customizáveis** - Flexibilidade para clientes (1 sprint)

### Enterprise Features (Para clientes grandes)
1. **SSO** - Obrigatório para empresas médias/grandes (1 sprint)
2. **2FA Obrigatório** - Segurança corporativa (1 sprint)
3. **LGPD Compliance** - Compliance regulatório (1 sprint)
4. **Audit Logs Avançado** - Governança (1 sprint)

### Expansão de Canais (Omnichannel)
1. **Instagram DM** - Alto engajamento (2 sprints)
2. **Facebook Messenger** - Complementar ao IG (2 sprints)
3. **Inbox Unificado** - Necessário após multi-canal (1 sprint)

### Integrações Estratégicas
1. **Zapier/Make** - Extensibilidade infinita (1 sprint)
2. **RD Station + HubSpot** - Integração com CRMs populares (1 sprint)
3. **Tiny/Bling ERP** - E-commerce completo (1 sprint)

---

## 🚨 DEPENDÊNCIAS CRÍTICAS

### Antes de Fase 2:
- [ ] Evolution API estável (já implementado ✅)
- [ ] Supabase com capacidade de scale

### Antes de Instagram/Messenger:
- [ ] Facebook Business Manager configurado
- [ ] Apps aprovados no Facebook Developers
- [ ] Webhooks configurados

### Antes de RAG:
- [ ] Habilitar extensão pgvector no Supabase
- [ ] Testar performance de busca vetorial
- [ ] Definir strategy de chunking

### Antes de E-commerce:
- [ ] Gateway de pagamento escolhido (Stripe/Mercado Pago)
- [ ] Conta empresarial configurada
- [ ] Testes de webhook

### Antes de Mobile App:
- [ ] Apple Developer Account ($99/ano)
- [ ] Google Play Console ($25 one-time)
- [ ] Certificados de push notification

### Antes de SSO:
- [ ] Definir IdPs suportados
- [ ] Certificados SAML configurados
- [ ] Testing com cada IdP

---

## 📦 ENTREGÁVEIS POR FASE

### Fase 2:
- 3 canais de comunicação (WhatsApp + Instagram + Messenger)
- Inbox unificado multi-canal
- Chatbot builder visual com 10+ tipos de nodes
- Knowledge Base com busca semântica (RAG)
- Transcrição automática de áudios

### Fase 3:
- E-commerce completo (catálogo + carrinho + checkout)
- Pagamento via PIX + Cartão no chat
- Sales Cadences multi-canal
- A/B Testing de campanhas e templates
- 10+ tipos de triggers avançados

### Fase 4:
- Dashboard builder drag-and-drop
- Cohort analysis com retention matrix
- Attribution tracking com 6 modelos
- Integração com Zapier/Make
- Sync bidirectional com RD Station e HubSpot
- Integração com ERPs (Tiny/Bling)

### Fase 5:
- App mobile nativo (iOS + Android)
- SSO com Google/Microsoft/Okta/SAML
- Audit logs avançado com security alerts
- 2FA obrigatório (TOTP + SMS)
- LGPD compliance completo
- Commission tracking automático

---

## 💡 RECOMENDAÇÕES FINAIS

### Estratégia de Rollout:
1. **Beta fechado** com 5-10 clientes selecionados por feature
2. **Feedback loop** rápido (sprints de 2 semanas)
3. **Release incremental** (não esperar fase completa)
4. **Feature flags** para controlar rollout

### Stack Tecnológica Sugerida:
- **Vector DB:** pgvector (já no Supabase) ✅
- **Payment:** Stripe (melhor DX) ou Mercado Pago (mais popular BR)
- **Chatbot Engine:** State machine custom (controle total)
- **Mobile:** Expo (faster development)
- **2FA:** otplib + Twilio
- **SSO:** saml2-js ou Supabase Auth plugins

### Riscos Identificados:
1. **Instagram/Messenger API:** Aprovação de apps pode levar semanas
2. **RAG Performance:** Busca vetorial pode ser lenta em grandes bases
3. **Mobile App:** Review process da Apple pode reprovar
4. **SSO:** Complexidade de integração com cada IdP
5. **LGPD:** Conformidade legal requer validação jurídica

### Próximos Passos Imediatos:
1. Validar roadmap com stakeholders
2. Priorizar primeiros 3-4 sprints
3. Setup de ambientes (Facebook Apps, payment gateways)
4. Contratar/alocar recursos (devs, QA)
5. Definir métricas de sucesso por feature

---

## 📞 SUPORTE À IMPLEMENTAÇÃO

Este documento fornece um plano detalhado e técnico para implementação das Fases 2-5. Cada sprint contém:
- Schemas de banco de dados
- Edge Functions necessárias
- Componentes frontend
- Integrações externas
- Checklist de tarefas

**Pronto para começar a implementação!** 🚀
