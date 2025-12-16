# PLANO DE FINALIZAÇÃO - CHAT MELON

**Objetivo:** Completar funcionalidades prometidas, integrar comunicação entre sistemas e estabilizar o produto para lançamento.

**Status Atual:** ~70-75% completo
**Estimativa:** 100% funcional após implementação completa deste plano

---

## ARQUITETURA ATUAL IDENTIFICADA

### Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions Deno)
- **Bibliotecas principais:**
  - React Query para state management
  - ReactFlow para visual builders (Playbooks, Chatbots)
  - Radix UI para componentes
  - Recharts para gráficos

### Integrações Ativas
- ✅ Evolution API (WhatsApp Business) - 43 edge functions
- ✅ OpenAI, Groq, Anthropic (IA)
- ✅ Google Calendar (OAuth + sync)
- ✅ Stripe (pagamentos/assinaturas)
- ✅ Supabase Realtime (sync de conversas)
- ⚠️ Instagram/Messenger (webhooks criados mas não testados)

### Estrutura de Dados
- **Multi-tenancy:** `company_id` em todas tabelas
- **RBAC:** 6 roles (super_admin, admin, manager, agent, viewer, guest)
- **Channels:** WhatsApp, Instagram, Messenger (estrutura preparada)
- **pgvector:** Habilitado para Knowledge Base RAG

---

## FASE 1: CRÍTICO - FUNCIONALIDADES VISÍVEIS MAS NÃO FUNCIONAIS

### 1.1 CADENCES (Sequências de Follow-up) 📧
**Status:** 75% completo - FALTA APENAS AUTOMAÇÃO DE ENVIO
**Prioridade:** 🔴 CRÍTICA

**O que já existe:**
- ✅ Hook `useCadences` completo (CRUD)
- ✅ Tabelas: `cadences`, `cadence_steps`, `cadence_enrollments`
- ✅ UI de builder funcional
- ✅ Enrollment de contatos funcional
- ✅ Analytics por cadence

**O que FALTA implementar:**

#### 1.1.1 Edge Function: `execute-cadence-step`
**Arquivo:** `supabase/functions/execute-cadence-step/index.ts`

**Funcionalidade:**
```typescript
// Input: enrollmentId
// Processo:
// 1. Buscar enrollment ativo com next_step_at <= now()
// 2. Buscar cadence.steps[current_step]
// 3. Interpolar variáveis {{nome}}, {{empresa}}, etc.
// 4. Enviar via canal apropriado (WhatsApp, email)
// 5. Atualizar enrollment:
//    - current_step++
//    - last_step_executed_at = now()
//    - next_step_at = now() + steps[current_step+1].day (em dias)
// 6. Se último step: status = 'completed'
// 7. Se resposta recebida: status = 'replied'
```

**Dependências:**
- `evolution-send-message` (já existe)
- `send-email` (já existe)
- Tabela `cadence_enrollments` (já existe)

**Chamada na edge function:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { enrollmentId } = await req.json();

  // Buscar enrollment
  const { data: enrollment } = await supabase
    .from('cadence_enrollments')
    .select('*, cadence:cadences(*), contact:contacts(*)')
    .eq('id', enrollmentId)
    .single();

  // Buscar step atual
  const currentStep = enrollment.cadence.steps[enrollment.current_step];

  // Interpolar variáveis
  const message = interpolateVariables(currentStep.message_content, enrollment.contact);

  // Enviar via canal
  if (currentStep.channel === 'whatsapp') {
    await sendWhatsAppMessage(enrollment.contact.phone_number, message);
  }

  // Atualizar enrollment
  await updateEnrollment(enrollment);
});
```

#### 1.1.2 Database Function: Trigger automático
**Arquivo:** Migration SQL

**Funcionalidade:**
- Cron job (pg_cron) ou trigger baseado em tempo
- Executa a cada 5 minutos
- Seleciona enrollments com `status='active'` e `next_step_at <= now()`
- Chama edge function `execute-cadence-step` para cada

**SQL:**
```sql
-- Criar função para executar cadences pendentes
CREATE OR REPLACE FUNCTION process_pending_cadence_steps()
RETURNS void AS $$
DECLARE
  enrollment_record RECORD;
BEGIN
  FOR enrollment_record IN
    SELECT id FROM cadence_enrollments
    WHERE status = 'active'
    AND next_step_at <= now()
    ORDER BY next_step_at ASC
    LIMIT 100
  LOOP
    -- Chamar edge function via HTTP
    PERFORM net.http_post(
      url := 'https://[PROJECT].supabase.co/functions/v1/execute-cadence-step',
      body := json_build_object('enrollmentId', enrollment_record.id)::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Agendar com pg_cron (executar a cada 5 minutos)
SELECT cron.schedule(
  'process-cadences',
  '*/5 * * * *', -- A cada 5 minutos
  $$SELECT process_pending_cadence_steps()$$
);
```

#### 1.1.3 Tratamento de respostas
**Hook:** Adicionar em `useConversations` ou criar hook dedicado

**Funcionalidade:**
- Quando mensagem incoming é recebida de contato inscrito em cadence
- Atualizar enrollment: `status='replied'`, `reply_received_at=now()`
- Incrementar `cadence.total_replied`

**Implementação sugerida:**
- Adicionar no webhook `handle-evolution-webhook`
- Verificar se contact_id tem enrollment ativo
- Atualizar status automaticamente

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Nenhum
**Teste:** Criar cadence de 2 steps com delay de 1 dia

---

### 1.2 CHATBOTS (Execution Engine) 🤖
**Status:** 60% completo - UI PRONTA, FALTA RUNTIME
**Prioridade:** 🔴 CRÍTICA

**O que já existe:**
- ✅ `ChatbotBuilder.tsx` com ReactFlow visual editor
- ✅ CRUD de chatbots funcional
- ✅ Tipos de nós: message, question, condition, api_call, tag_contact, webhook
- ✅ Tabela `chatbots` com campo `flow_data` (JSON)

**O que FALTA implementar:**

#### 1.2.1 Edge Function: `execute-chatbot`
**Arquivo:** `supabase/functions/execute-chatbot/index.ts`

**Funcionalidade:**
```typescript
// Input: { conversationId, contactId, userMessage }
// Processo:
// 1. Verificar se contact tem chatbot ativo
// 2. Se não: verificar triggers (novo contato, palavra-chave, horário)
// 3. Iniciar novo session ou continuar existente
// 4. Processar flow a partir do nó atual:
//    - message: enviar e avançar
//    - question: enviar e aguardar resposta
//    - condition: avaliar expressão e seguir path
//    - api_call: executar fetch e processar resposta
//    - tag_contact: adicionar tag
//    - webhook: chamar URL externa
// 5. Salvar state em chatbot_sessions
// 6. Se terminou: marcar session como completed
```

**Estrutura de dados necessária:**
```sql
CREATE TABLE chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  chatbot_id UUID REFERENCES chatbots(id),
  conversation_id UUID REFERENCES conversations(id),
  contact_id UUID REFERENCES contacts(id),
  current_node_id TEXT, -- ID do nó atual no flow
  variables JSONB DEFAULT '{}', -- Variáveis coletadas (nome, email, etc)
  status TEXT DEFAULT 'active', -- active, paused, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_chatbot_sessions_active ON chatbot_sessions(conversation_id, status);
```

#### 1.2.2 Integração com chat real
**Arquivo:** Modificar `handle-evolution-webhook/index.ts`

**Adicionar após criar mensagem:**
```typescript
// Após salvar mensagem incoming
// Verificar se há chatbot ativo para esta conversa
const { data: session } = await supabase
  .from('chatbot_sessions')
  .select('*')
  .eq('conversation_id', conversationId)
  .eq('status', 'active')
  .single();

if (session) {
  // Chamar engine do chatbot
  await fetch(`${SUPABASE_URL}/functions/v1/execute-chatbot`, {
    method: 'POST',
    body: JSON.stringify({
      sessionId: session.id,
      userMessage: messageContent,
    }),
  });
}
```

#### 1.2.3 Triggers para iniciar chatbot
**Opções:**
1. **Novo contato:** Primeira mensagem de contato desconhecido
2. **Palavra-chave:** Mensagem contém palavra específica (ex: "suporte", "vendas")
3. **Horário:** Fora do horário de atendimento
4. **Manual:** Agente clica "Iniciar bot" na conversa

**Implementar em:**
- `chatbots` table: adicionar campo `triggers: { type, config }`
- `execute-chatbot`: verificar triggers antes de iniciar

**Esforço estimado:** 16-24 horas
**Bloqueadores:** Nenhum
**Teste:** Criar bot simples de boas-vindas com 3 nós

---

### 1.3 OMNICHANNEL (Instagram/Messenger) 📱
**Status:** 20% completo - WEBHOOKS PRONTOS, FALTA TESTAR/ATIVAR
**Prioridade:** 🟡 ALTA (ou REMOVER do menu)

**O que já existe:**
- ✅ Edge functions: `instagram-webhook`, `messenger-webhook`
- ✅ Edge functions: `instagram-send-message`, `messenger-send-message`
- ✅ Edge function: `meta-oauth` (autenticação)
- ✅ Página `/channels` com UI completa
- ⚠️ Tabela `channels` pode não existir

**O que FALTA implementar:**

#### 1.3.1 Verificar e criar tabela `channels`
```sql
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  type TEXT NOT NULL, -- 'whatsapp', 'instagram', 'messenger', 'telegram'
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, inactive, error
  credentials JSONB, -- { access_token, page_id, instagram_id, etc }
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_channels_company ON channels(company_id, type);
```

#### 1.3.2 Testar fluxo completo Instagram
**Checklist:**
1. ✅ Criar app no Meta for Developers
2. ✅ Configurar webhook URL: `https://[project].supabase.co/functions/v1/instagram-webhook`
3. ✅ Definir `META_VERIFY_TOKEN` nas env vars
4. ✅ Solicitar permissões: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`
5. ✅ Testar OAuth flow em `/channels`
6. ✅ Enviar mensagem de teste
7. ✅ Receber mensagem de resposta

**Nota:** Instagram webhook (lines 1-224 do arquivo) está completo, mas precisa:
- Testar se tabela `channels` existe
- Verificar se `credentials.access_token` é válido
- Confirmar estrutura de `conversations.channel_id`

#### 1.3.3 Testar fluxo completo Messenger
- Mesmo processo do Instagram
- Webhook já implementado: `messenger-webhook/index.ts`

**DECISÃO CRÍTICA:**
- **Opção A:** Implementar e testar completamente (esforço: 16-24h)
- **Opção B:** Remover páginas e features do menu até implementação real
- **Recomendação:** Opção B temporariamente, mover para roadmap futuro

**Esforço estimado (se implementar):** 16-24 horas
**Bloqueadores:** Necessita app Meta configurado, review de permissões

---

### 1.4 ORDERS/PEDIDOS (Integração PIX) 💳
**Status:** 50% completo - CRUD OK, PAGAMENTO NÃO
**Prioridade:** 🟡 MÉDIA

**O que já existe:**
- ✅ Hook `useOrders` com analytics
- ✅ Página de listagem funcional
- ✅ Status: pending, paid, shipped, delivered, cancelled
- ❌ Edge function `create-pix-charge` referenciada mas não implementada

**O que FALTA implementar:**

#### 1.4.1 Edge Function: `create-pix-charge`
**Escolher gateway:**
- **Opção 1:** Mercado Pago API
- **Opção 2:** PagSeguro
- **Opção 3:** Pagar.me

**Exemplo com Mercado Pago:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { orderId, amount, description } = await req.json();

  const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

  // Criar cobrança PIX
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: { email: "customer@email.com" },
      external_reference: orderId,
    }),
  });

  const payment = await response.json();

  // Retornar QR code e copia-e-cola
  return new Response(JSON.stringify({
    qr_code: payment.point_of_interaction.transaction_data.qr_code,
    qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
    ticket_url: payment.point_of_interaction.transaction_data.ticket_url,
    payment_id: payment.id,
  }));
});
```

#### 1.4.2 Webhook para confirmação de pagamento
**Arquivo:** Criar `supabase/functions/mercadopago-webhook/index.ts`

```typescript
serve(async (req) => {
  const body = await req.json();

  if (body.action === "payment.updated" && body.data.status === "approved") {
    const paymentId = body.data.id;

    // Buscar detalhes do pagamento
    const payment = await fetchPaymentDetails(paymentId);
    const orderId = payment.external_reference;

    // Atualizar order
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId);

    // Notificar usuário via WhatsApp
    await notifyPaymentConfirmed(orderId);
  }

  return new Response(JSON.stringify({ ok: true }));
});
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Necessita conta em gateway de pagamento

---

### 1.5 SECURITY (2FA, SSO, Audit Logs) 🔒
**Status:** 30% completo - UI PRONTA, BACKEND MOCKADO
**Prioridade:** 🟢 BAIXA (enterprise feature)

**O que já existe:**
- ✅ Página `/security` com tabs
- ✅ Tabela `access_audit_log` existe
- ❌ Dados exibidos são mockados

**O que FALTA implementar:**

#### 1.5.1 2FA (Two-Factor Authentication)
**Usar Supabase Auth nativo:**
```typescript
// Enable 2FA for user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});

// Verify code
await supabase.auth.mfa.verify({
  factorId: data.id,
  code: userInputCode,
});
```

**Adicionar toggle em `/security`:**
- Botão "Ativar 2FA"
- Mostrar QR code
- Validar código de teste
- Salvar em user metadata

#### 1.5.2 Audit Logs (populando tabela)
**Implementar middleware global:**
```typescript
// No AuthGuard ou em cada mutation importante
async function logAction(action: string, userId: string, metadata: any) {
  await supabase.from('access_audit_log').insert({
    user_id: userId,
    action,
    resource_type: metadata.resourceType,
    resource_id: metadata.resourceId,
    ip_address: metadata.ip,
    user_agent: navigator.userAgent,
    company_id: currentCompany.id,
  });
}

// Usar em hooks críticos
logAction('deal.created', user.id, { resourceType: 'deal', resourceId: dealId });
logAction('contact.exported', user.id, { resourceType: 'export', resourceId: exportId });
```

#### 1.5.3 SSO (Single Sign-On)
**Usar Supabase Auth providers:**
- Google OAuth (já suportado)
- Microsoft Azure AD
- Okta (via SAML)

**Configurar em Supabase Dashboard:**
- Authentication > Providers > Enable Google/Azure
- Adicionar callback URL
- Frontend: usar `supabase.auth.signInWithOAuth({ provider: 'google' })`

**Esforço estimado:** 12-16 horas
**Bloqueadores:** Feature enterprise, baixa prioridade para MVP

---

### 1.6 INTEGRAÇÕES EXTERNAS (Zapier, RD, HubSpot) 🔌
**Status:** 5% completo - APENAS UI PLACEHOLDER
**Prioridade:** 🟢 BAIXA (ou REMOVER do menu)

**RECOMENDAÇÃO: REMOVER DA UI ATÉ IMPLEMENTAÇÃO REAL**

Alternativa atual que JÁ FUNCIONA:
- ✅ Webhooks customizados em `/settings/webhooks`
- ✅ API REST via `api-v1` edge function
- Usuário pode integrar manualmente via n8n, Make, Zapier

**Se for implementar no futuro:**
- Zapier: Criar app no Zapier Developer Platform
- RD Station: API REST + OAuth
- HubSpot: API REST + OAuth

**Esforço estimado:** 40-60 horas (cada integração ~15h)

---

## FASE 2: IMPORTANTE - COMPLETAR FEATURES INICIADAS

### 2.1 KNOWLEDGE BASE (Integração com IA Assistant) 🧠
**Status:** 70% completo - RAG OK, FALTA INTEGRAÇÃO
**Prioridade:** 🔴 ALTA

**O que já existe:**
- ✅ pgvector habilitado
- ✅ Edge function `kb-ingest-document`
- ✅ Edge function `kb-semantic-search`
- ✅ Edge function `kb-generate-answer` (RAG completo)
- ✅ Página `/knowledge-base` com DocumentList

**O que FALTA implementar:**

#### 2.1.1 Integrar KB no AI Assistant do chat
**Arquivo:** Modificar `src/components/chat/AIAssistant.tsx`

**Adicionar opção:**
```typescript
const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);

async function sendAIMessage(message: string) {
  if (useKnowledgeBase) {
    // Chamar kb-generate-answer ao invés de OpenAI diretamente
    const response = await fetch(`${SUPABASE_URL}/functions/v1/kb-generate-answer`, {
      method: 'POST',
      body: JSON.stringify({
        query: message,
        companyId: currentCompany.id,
        conversationId: conversation.id,
        context: getConversationContext(), // Últimas 5 mensagens
      }),
    });

    const { answer, sources, confidence } = await response.json();

    // Exibir resposta + fontes
    displayAIResponse(answer, sources, confidence);
  } else {
    // Usar OpenAI diretamente (comportamento atual)
    sendToOpenAI(message);
  }
}
```

**UI:**
- Toggle "Usar Base de Conhecimento" no painel da IA
- Mostrar fontes consultadas abaixo da resposta
- Badge de confiança (confidence score)

#### 2.1.2 KB Analytics Dashboard
**Arquivo:** Completar `src/components/knowledge-base/KBAnalytics.tsx`

**Métricas a exibir:**
```typescript
// Queries da tabela kb_queries
- Total de consultas
- Média de confidence score
- Top 10 perguntas mais frequentes
- Documentos mais consultados
- Taxa de "respostas não encontradas"
- Queries com baixo confidence (<0.5)

// Queries da tabela kb_answer_cache
- Taxa de hit do cache
- Economia de tokens (cache vs. geração)
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Nenhum

---

### 2.2 MÉTRICAS DE TEMPO DE RESPOSTA ⏱️
**Status:** TODO explícito no código
**Prioridade:** 🟡 MÉDIA

**Localização do TODO:**
- `src/hooks/useActivityReport.ts:58` (linha onde calcula)
- `src/hooks/useAnalytics.ts:112`

**Implementação:**

#### 2.2.1 Database Function
```sql
CREATE OR REPLACE FUNCTION calculate_avg_response_time(
  company_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS INTERVAL AS $$
  SELECT AVG(
    EXTRACT(EPOCH FROM (agent_msg.created_at - customer_msg.created_at))
  ) * INTERVAL '1 second'
  FROM messages agent_msg
  JOIN LATERAL (
    SELECT created_at
    FROM messages
    WHERE conversation_id = agent_msg.conversation_id
      AND direction = 'incoming'
      AND created_at < agent_msg.created_at
    ORDER BY created_at DESC
    LIMIT 1
  ) customer_msg ON true
  WHERE agent_msg.direction = 'outgoing'
    AND agent_msg.created_at BETWEEN start_date AND end_date
    AND agent_msg.conversation_id IN (
      SELECT id FROM conversations WHERE company_id = company_uuid
    );
$$ LANGUAGE sql;
```

#### 2.2.2 Atualizar hooks
```typescript
// useActivityReport.ts
const { data: avgResponseTime } = await supabase.rpc('calculate_avg_response_time', {
  company_uuid: companyId,
  start_date: startDate,
  end_date: endDate,
});

// Converter interval para segundos/minutos
const avgSeconds = parseInterval(avgResponseTime);
```

**Esforço estimado:** 4-6 horas
**Bloqueadores:** Nenhum

---

### 2.3 COMPONENTES MÓVEIS (PWA Optimizations) 📱
**Status:** Componentes criados mas não integrados
**Prioridade:** 🟢 BAIXA

**Componentes órfãos:**
1. `SwipeActions.tsx` - gestos de swipe em listas
2. `VirtualizedList.tsx` - lista virtualizada para performance
3. `PullToRefresh.tsx` - pull-to-refresh
4. `MobilePipelineLayout.tsx` - layout otimizado para pipeline mobile

**Onde integrar:**

#### 2.3.1 SwipeActions em listas
```typescript
// src/pages/Conversations.tsx
import { SwipeActions } from '@/components/mobile/SwipeActions';

<SwipeActions
  onSwipeLeft={() => archiveConversation(conv.id)}
  onSwipeRight={() => markAsUnread(conv.id)}
  leftLabel="Arquivar"
  rightLabel="Não lida"
>
  <ConversationCard conversation={conv} />
</SwipeActions>
```

#### 2.3.2 VirtualizedList em conversas
```typescript
// Para listas grandes (>100 itens)
import { VirtualizedList } from '@/components/mobile/VirtualizedList';

<VirtualizedList
  items={messages}
  itemHeight={80}
  renderItem={(msg) => <MessageBubble message={msg} />}
/>
```

#### 2.3.3 PullToRefresh
```typescript
// src/pages/Dashboard.tsx
import { PullToRefresh } from '@/components/mobile/PullToRefresh';

<PullToRefresh onRefresh={async () => await refetch()}>
  <DashboardContent />
</PullToRefresh>
```

**Esforço estimado:** 6-8 horas
**Bloqueadores:** Nenhum

---

### 2.4 INTERNAL CHAT (Chat entre equipe) 💬
**Status:** Componente órfão
**Prioridade:** 🟢 BAIXA (ou REMOVER)

**DECISÃO NECESSÁRIA:**
- **Opção A:** Integrar componente no Header ou Sidebar
- **Opção B:** Remover componente e feature do roadmap

**Se implementar:**

#### 2.4.1 Criar tabela
```sql
CREATE TABLE internal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id), -- NULL = mensagem para todos
  thread_id UUID, -- Para agrupar respostas
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_internal_messages_recipient ON internal_messages(recipient_id, read);
```

#### 2.4.2 Integrar componente
```typescript
// src/components/layout/Header.tsx
import { InternalChatPanel } from '@/components/chat/InternalChatPanel';

<Popover>
  <PopoverTrigger>
    <MessageSquare /> {unreadCount}
  </PopoverTrigger>
  <PopoverContent>
    <InternalChatPanel />
  </PopoverContent>
</Popover>
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Decisão de produto (necessário?)

---

## FASE 3: FUNCIONALIDADES CORE FALTANTES

### 3.1 AUTO-ASSIGNMENT (Distribuição automática de conversas) 🎯
**Status:** Não implementado
**Prioridade:** 🟡 ALTA (para escala)

**Funcionalidade:**
- Quando nova conversa chega, atribuir automaticamente a um agente
- Métodos: Round-robin, load balancing, skill-based

**Implementação:**

#### 3.1.1 Adicionar campo em queues
```sql
ALTER TABLE queues ADD COLUMN assignment_method TEXT DEFAULT 'manual';
-- Valores: 'manual', 'round_robin', 'load_balancing', 'skill_based'

ALTER TABLE queues ADD COLUMN assignment_config JSONB DEFAULT '{}';
-- Ex: { maxActiveConversations: 5, skills: ['sales', 'support'] }
```

#### 3.1.2 Database Function
```sql
CREATE OR REPLACE FUNCTION assign_conversation_to_agent(
  conv_id UUID,
  queue_id UUID
)
RETURNS UUID AS $$
DECLARE
  selected_agent_id UUID;
  assignment_type TEXT;
BEGIN
  -- Buscar método de assignment
  SELECT assignment_method INTO assignment_type
  FROM queues WHERE id = queue_id;

  IF assignment_type = 'round_robin' THEN
    -- Selecionar próximo agente na fila
    SELECT member_id INTO selected_agent_id
    FROM queue_members
    WHERE queue_id = queue_id AND status = 'online'
    ORDER BY last_assigned_at NULLS FIRST, created_at
    LIMIT 1;

    -- Atualizar last_assigned_at
    UPDATE queue_members
    SET last_assigned_at = now()
    WHERE member_id = selected_agent_id;

  ELSIF assignment_type = 'load_balancing' THEN
    -- Selecionar agente com menos conversas ativas
    SELECT member_id INTO selected_agent_id
    FROM queue_members qm
    LEFT JOIN conversations c ON c.assigned_to = qm.member_id AND c.status = 'open'
    WHERE qm.queue_id = queue_id AND qm.status = 'online'
    GROUP BY qm.member_id
    ORDER BY COUNT(c.id) ASC
    LIMIT 1;
  END IF;

  -- Atribuir conversa
  UPDATE conversations
  SET assigned_to = selected_agent_id
  WHERE id = conv_id;

  RETURN selected_agent_id;
END;
$$ LANGUAGE plpgsql;
```

#### 3.1.3 Chamar função no webhook
```typescript
// handle-evolution-webhook/index.ts
// Após criar nova conversa
if (conversation.queue_id) {
  await supabase.rpc('assign_conversation_to_agent', {
    conv_id: conversation.id,
    queue_id: conversation.queue_id,
  });
}
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Nenhum

---

### 3.2 SLA TRACKING (Service Level Agreement) ⏰
**Status:** Não implementado
**Prioridade:** 🟡 MÉDIA (compliance)

**Funcionalidade:**
- Definir tempo máximo de primeira resposta e resolução
- Alertar quando SLA está próximo de vencer
- Métricas de cumprimento de SLA

**Implementação:**

#### 3.2.1 Adicionar campos em queues
```sql
ALTER TABLE queues ADD COLUMN sla_first_response_minutes INTEGER DEFAULT 60;
ALTER TABLE queues ADD COLUMN sla_resolution_hours INTEGER DEFAULT 24;

ALTER TABLE conversations ADD COLUMN sla_first_response_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN sla_resolution_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN sla_first_response_met BOOLEAN;
ALTER TABLE conversations ADD COLUMN sla_resolution_met BOOLEAN;
```

#### 3.2.2 Trigger para calcular SLA
```sql
CREATE OR REPLACE FUNCTION calculate_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  queue_config RECORD;
BEGIN
  -- Buscar config SLA da fila
  SELECT sla_first_response_minutes, sla_resolution_hours
  INTO queue_config
  FROM queues
  WHERE id = NEW.queue_id;

  -- Calcular deadlines
  NEW.sla_first_response_at := NEW.created_at +
    (queue_config.sla_first_response_minutes || ' minutes')::INTERVAL;

  NEW.sla_resolution_at := NEW.created_at +
    (queue_config.sla_resolution_hours || ' hours')::INTERVAL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sla_deadlines
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sla_deadlines();
```

#### 3.2.3 UI de alertas
```typescript
// src/components/conversations/SLAIndicator.tsx
export function SLAIndicator({ conversation }) {
  const now = new Date();
  const slaDeadline = new Date(conversation.sla_first_response_at);
  const timeLeft = differenceInMinutes(slaDeadline, now);

  if (timeLeft < 0) {
    return <Badge variant="destructive">SLA vencido há {Math.abs(timeLeft)}m</Badge>;
  }

  if (timeLeft < 10) {
    return <Badge variant="warning">SLA vence em {timeLeft}m</Badge>;
  }

  return <Badge variant="default">SLA OK ({timeLeft}m)</Badge>;
}
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Nenhum

---

### 3.3 CHAT ROUTING RULES (Roteamento inteligente) 🔀
**Status:** Não implementado
**Prioridade:** 🟡 MÉDIA

**Funcionalidade:**
- Rotear conversa para fila específica baseado em:
  - Palavra-chave na mensagem
  - Horário de atendimento
  - Origem do contato (telefone, tag)

**Implementação:**

#### 3.3.1 Criar tabela routing_rules
```sql
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Maior = maior prioridade
  conditions JSONB NOT NULL, -- { type: 'keyword', value: 'vendas' }
  action JSONB NOT NULL, -- { type: 'assign_queue', queue_id: '...' }
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exemplo de condition:
{
  "type": "keyword",
  "keywords": ["vendas", "comprar", "preço"],
  "case_sensitive": false
}

-- Exemplo de action:
{
  "type": "assign_queue",
  "queue_id": "uuid-da-fila-vendas"
}
```

#### 3.3.2 Database Function para avaliar rules
```sql
CREATE OR REPLACE FUNCTION apply_routing_rules(
  conv_id UUID,
  first_message TEXT
)
RETURNS UUID AS $$
DECLARE
  rule RECORD;
  queue_id_result UUID;
BEGIN
  -- Buscar rules por ordem de prioridade
  FOR rule IN
    SELECT * FROM routing_rules
    WHERE enabled = TRUE
    ORDER BY priority DESC
  LOOP
    -- Avaliar keyword
    IF rule.conditions->>'type' = 'keyword' THEN
      IF first_message ~* ANY(ARRAY(SELECT jsonb_array_elements_text(rule.conditions->'keywords'))) THEN
        queue_id_result := (rule.action->>'queue_id')::UUID;
        EXIT; -- Primeira rule que bater
      END IF;
    END IF;
  END LOOP;

  -- Atribuir queue
  IF queue_id_result IS NOT NULL THEN
    UPDATE conversations
    SET queue_id = queue_id_result
    WHERE id = conv_id;
  END IF;

  RETURN queue_id_result;
END;
$$ LANGUAGE plpgsql;
```

#### 3.3.3 UI de gerenciamento
```typescript
// src/pages/settings/RoutingRules.tsx
- Lista de rules com drag-and-drop para ordenar prioridade
- Formulário: Condição (keyword, horário) + Ação (fila, agente, bot)
- Toggle enabled/disabled
```

**Esforço estimado:** 12-16 horas
**Bloqueadores:** Nenhum

---

### 3.4 BULK ACTIONS (Ações em massa) ⚡
**Status:** Não implementado
**Prioridade:** 🟢 BAIXA (produtividade)

**Funcionalidade:**
- Selecionar múltiplas conversas
- Aplicar ação: atribuir, adicionar tag, arquivar, deletar

**Implementação:**

#### 3.4.1 Estado de seleção
```typescript
// src/pages/Conversations.tsx
const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());

function toggleSelect(id: string) {
  const newSet = new Set(selectedConversations);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  setSelectedConversations(newSet);
}
```

#### 3.4.2 Toolbar de ações
```tsx
{selectedConversations.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 flex gap-2">
    <span>{selectedConversations.size} selecionadas</span>
    <Button onClick={() => bulkAssign(selectedConversations)}>Atribuir</Button>
    <Button onClick={() => bulkArchive(selectedConversations)}>Arquivar</Button>
    <Button onClick={() => bulkTag(selectedConversations)}>Adicionar Tag</Button>
  </div>
)}
```

#### 3.4.3 Database Function
```sql
CREATE OR REPLACE FUNCTION bulk_update_conversations(
  conv_ids UUID[],
  updates JSONB
)
RETURNS INTEGER AS $$
  UPDATE conversations
  SET
    assigned_to = COALESCE((updates->>'assigned_to')::UUID, assigned_to),
    status = COALESCE(updates->>'status', status),
    updated_at = now()
  WHERE id = ANY(conv_ids)
  RETURNING COUNT(*);
$$ LANGUAGE sql;
```

**Esforço estimado:** 6-8 horas
**Bloqueadores:** Nenhum

---

### 3.5 PUSH NOTIFICATIONS 🔔
**Status:** Service worker registrado, push não funcional
**Prioridade:** 🟢 BAIXA

**TODO no código:** `src/utils/pushNotifications.ts:12`

**Implementação:**

#### 3.5.1 Criar tabela push_subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- { p256dh, auth }
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
```

#### 3.5.2 Salvar subscription no frontend
```typescript
// src/utils/pushNotifications.ts
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Salvar no banco
  await supabase.from('push_subscriptions').insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys,
    user_agent: navigator.userAgent,
  });
}
```

#### 3.5.3 Edge Function para enviar push
```typescript
// supabase/functions/send-push-notification/index.ts
import webpush from 'npm:web-push';

serve(async (req) => {
  const { userId, title, body, url } = await req.json();

  // Buscar subscriptions do usuário
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  // Enviar para cada dispositivo
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({ title, body, url })
      );
    } catch (error) {
      // Se falhar (subscription expirada), deletar
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
    }
  }
});
```

**Esforço estimado:** 8-12 horas
**Bloqueadores:** Necessita VAPID keys

---

## FASE 4: LIMPEZA E POLISH

### 4.1 REMOVER FEATURES NÃO IMPLEMENTADAS DO MENU
**Prioridade:** 🔴 CRÍTICA (UX)

**Features a considerar remoção/ocultação:**
1. `/channels` - Se Instagram/Messenger não forem implementados
2. `/integrations` - Apenas placeholder
3. `/security` - Se 2FA/SSO não forem implementados

**Implementação:**
```typescript
// src/lib/navigation.ts
const menuItems = [
  {
    path: '/channels',
    label: 'Canais',
    icon: Megaphone,
    requiresFeatureFlag: 'omnichannel', // Ocultar se flag não ativa
  },
  {
    path: '/integrations',
    label: 'Integrações',
    icon: Puzzle,
    comingSoon: true, // Adicionar badge "Em breve"
  },
];
```

---

### 4.2 DOCUMENTAÇÃO TÉCNICA
**Arquivo:** `TECHNICAL_DOCS.md`

**Conteúdo:**
- Arquitetura geral do sistema
- Fluxo de dados (webhooks → conversas → mensagens)
- Guia de desenvolvimento de edge functions
- Schema do banco de dados (ERD)
- Guia de deployment
- Variáveis de ambiente obrigatórias

---

### 4.3 TESTES E2E CRÍTICOS
**Ferramentas:** Playwright ou Cypress

**Cenários prioritários:**
1. Login → Criar conversa → Enviar mensagem → Receber resposta
2. Criar deal → Mover pipeline → Criar proposta → Enviar por WhatsApp
3. Criar campanha → Agendar → Executar → Ver relatório
4. Criar cadence → Enrollar contato → Verificar envio automático
5. Chatbot → Novo contato → Bot responde → Transfere para humano

---

## CRONOGRAMA SUGERIDO

### Sprint 1 (1-2 semanas) - CRÍTICO
- ✅ Cadences (execution engine)
- ✅ Knowledge Base (integrar com chat)
- ✅ Métricas de tempo de resposta
- ✅ Decisão sobre Omnichannel (implementar ou remover)

### Sprint 2 (1-2 semanas) - IMPORTANTE
- ✅ Chatbots (execution engine)
- ✅ Auto-assignment de conversas
- ✅ SLA tracking
- ✅ Routing rules

### Sprint 3 (1 semana) - POLISH
- ✅ Bulk actions
- ✅ Mobile optimizations
- ✅ Remover features não implementadas
- ✅ Documentação técnica

### Sprint 4 (1 semana) - ESTABILIZAÇÃO
- ✅ Testes E2E
- ✅ Correção de bugs
- ✅ Performance optimization
- ✅ Deploy em produção

**Total estimado:** 4-6 semanas para 100% funcional

---

## DECISÕES TÉCNICAS E TRADE-OFFS

### 1. Cadences: Cron vs. Trigger
**Decisão:** pg_cron (polling a cada 5 minutos)
**Pros:** Simples, confiável, fácil debug
**Cons:** Delay de até 5 minutos
**Alternativa:** Database trigger baseado em tempo (mais complexo)

### 2. Chatbots: State em banco vs. cache
**Decisão:** PostgreSQL (tabela `chatbot_sessions`)
**Pros:** Persistente, auditável, suporta retomada
**Cons:** Mais queries ao banco
**Alternativa:** Redis (mais rápido mas requer infraestrutura extra)

### 3. Omnichannel: Implementar ou adiar?
**Decisão:** ADIAR para pós-MVP
**Razão:** WhatsApp já funciona perfeitamente, Instagram/Messenger exigem review do Meta (semanas), baixo ROI inicial
**Ação:** Remover do menu principal, mover para "Em breve"

### 4. Orders/PIX: Gateway a escolher
**Recomendação:** Mercado Pago
**Razão:** Maior mercado BR, API mais simples, sandbox gratuito
**Alternativa:** Pagar.me (melhor taxa, mais complexo)

### 5. Push Notifications: Prioridade
**Decisão:** BAIXA prioridade
**Razão:** Notificações in-app + email já funcionam, PWA tem notificações limitadas no iOS
**Quando implementar:** Pós-lançamento, baseado em feedback

---

## MÉTRICAS DE SUCESSO

**App considerado "finalizado" quando:**
- ✅ 0 features visíveis no menu que não funcionam
- ✅ Cadences executam automaticamente
- ✅ Chatbots respondem em conversas reais
- ✅ Knowledge Base integrada no chat AI
- ✅ Tempo de resposta calculado corretamente
- ✅ Auto-assignment funcional
- ✅ SLA tracking operacional
- ✅ Testes E2E passando em cenários críticos
- ✅ Documentação técnica completa

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **VALIDAR PRIORIDADES** com stakeholders
2. **DECIDIR sobre Omnichannel:** implementar ou remover?
3. **COMEÇAR Sprint 1:** Cadences execution engine
4. **CONFIGURAR ambiente de staging** para testes

---

**Última atualização:** 2025-12-16
**Versão:** 1.0
