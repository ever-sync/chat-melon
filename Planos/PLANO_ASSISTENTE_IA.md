# Plano de Implementação: Assistente de IA para Monitoramento de Atendentes

## 📋 Visão Geral

Criar um assistente de IA flutuante que monitora em tempo real o desempenho dos atendentes, analisa qualidade das conversas, tempo de resposta e fornece sugestões contextuais para melhorar o atendimento. O assistente será um balão flutuante no canto inferior esquerdo que observa tudo que está acontecendo no app.

---

## 🎯 Objetivos Principais

1. **Monitoramento em Tempo Real**: Acompanhar atendente enquanto ele trabalha
2. **Análise de Qualidade**: Avaliar tom, empatia, resolutividade das conversas
3. **Alertas de Performance**: Notificar sobre tempo de resposta, conversas esquecidas
4. **Sugestões Contextuais**: Oferecer recomendações baseadas no contexto da conversa
5. **Dashboard Gerencial**: Mostrar métricas consolidadas para gestores
6. **Coaching Automático**: Fornecer feedback e insights para melhoria contínua

---

## 🏗️ Arquitetura do Sistema

### Componentes Frontend

```
src/
├── components/ai-assistant/
│   ├── FloatingAssistant.tsx           # Balão flutuante principal
│   ├── AssistantPanel.tsx              # Painel expandido com abas
│   ├── PerformanceMonitor.tsx          # Métricas em tempo real
│   ├── QualityAnalysis.tsx             # Análise de qualidade da conversa
│   ├── ContextualSuggestions.tsx       # Sugestões baseadas no contexto
│   ├── AlertsPanel.tsx                 # Alertas e notificações
│   ├── CoachingInsights.tsx            # Insights e dicas de melhoria
│   ├── ConversationPatterns.tsx        # Padrões identificados
│   └── ManagerDashboard.tsx            # Dashboard para gestores
│
├── hooks/ai-assistant/
│   ├── useAssistantMonitoring.ts       # Hook principal de monitoramento
│   ├── useConversationQuality.ts       # Análise de qualidade
│   ├── useAgentPerformance.ts          # Métricas de performance
│   ├── useContextualSuggestions.ts     # Sugestões inteligentes
│   ├── usePatternDetection.ts          # Detecção de padrões
│   └── useAssistantSettings.ts         # Configurações do assistente
│
├── lib/ai-assistant/
│   ├── qualityScoring.ts               # Algoritmos de pontuação
│   ├── patternDetection.ts             # Detecção de padrões
│   ├── suggestionEngine.ts             # Motor de sugestões
│   └── performanceCalculator.ts        # Cálculos de performance
│
└── types/ai-assistant.ts               # Tipos TypeScript
```

### Componentes Backend (Supabase)

```
supabase/
├── functions/
│   ├── ai-analyze-agent-performance/   # Análise de performance
│   ├── ai-generate-suggestions/        # Gerar sugestões contextuais
│   ├── ai-quality-scoring/             # Scoring de qualidade
│   ├── ai-pattern-detection/           # Detectar padrões
│   └── ai-coaching-insights/           # Gerar insights de coaching
│
└── migrations/
    └── 20251223000010_ai_assistant_tables.sql
```

### Tabelas do Banco de Dados

```sql
-- Métricas de qualidade por conversa
CREATE TABLE conversation_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  company_id UUID REFERENCES companies(id),
  agent_id UUID REFERENCES profiles(id),

  -- Scores (0-100)
  overall_score INTEGER,
  empathy_score INTEGER,
  resolution_score INTEGER,
  tone_score INTEGER,
  professionalism_score INTEGER,
  response_quality_score INTEGER,

  -- Análises
  sentiment VARCHAR, -- positive, neutral, negative
  detected_issues JSONB, -- Array de problemas identificados
  positive_highlights JSONB, -- Pontos positivos
  improvement_areas JSONB, -- Áreas de melhoria

  -- Métricas
  avg_response_time INTEGER, -- segundos
  message_count INTEGER,
  customer_satisfaction INTEGER, -- se disponível

  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance do agente em tempo real
CREATE TABLE agent_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),

  -- Métricas do momento
  active_conversations INTEGER,
  waiting_conversations INTEGER,
  avg_response_time INTEGER, -- últimos 30min
  conversations_handled_today INTEGER,
  quality_score_today DECIMAL(5,2),

  -- Status
  is_online BOOLEAN,
  current_load VARCHAR, -- low, medium, high, overloaded

  snapshot_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sugestões geradas
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  agent_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),

  -- Sugestão
  type VARCHAR, -- response, action, alert, tip
  priority VARCHAR, -- low, medium, high, urgent
  title TEXT,
  description TEXT,
  suggested_response TEXT, -- se aplicável
  reasoning TEXT, -- Por que foi sugerido

  -- Contexto
  trigger_context JSONB, -- O que disparou a sugestão

  -- Feedback
  was_useful BOOLEAN,
  was_used BOOLEAN,
  agent_feedback TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Padrões detectados
CREATE TABLE detected_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  agent_id UUID REFERENCES profiles(id), -- null se for padrão geral

  -- Padrão
  pattern_type VARCHAR, -- recurring_issue, success_pattern, bottleneck, etc.
  pattern_name TEXT,
  description TEXT,

  -- Dados
  occurrences INTEGER,
  confidence_score DECIMAL(5,2),
  impact_level VARCHAR, -- low, medium, high

  -- Recomendações
  recommended_actions JSONB,

  -- Período
  detected_from TIMESTAMP,
  detected_to TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Insights de coaching
CREATE TABLE coaching_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  manager_id UUID REFERENCES profiles(id), -- quem deve ver

  -- Insight
  category VARCHAR, -- strength, improvement_area, achievement, concern
  title TEXT,
  description TEXT,

  -- Evidências
  evidence JSONB, -- Exemplos, dados, conversas

  -- Ação recomendada
  recommended_action TEXT,
  priority VARCHAR,

  -- Acompanhamento
  status VARCHAR, -- new, acknowledged, in_progress, resolved
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Configurações do assistente
CREATE TABLE assistant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),

  -- Preferências
  is_enabled BOOLEAN DEFAULT true,
  position VARCHAR DEFAULT 'bottom-left', -- bottom-left, bottom-right
  notification_level VARCHAR DEFAULT 'all', -- all, important, critical, none

  -- Tipos de alertas habilitados
  alert_slow_response BOOLEAN DEFAULT true,
  alert_quality_issues BOOLEAN DEFAULT true,
  alert_customer_frustration BOOLEAN DEFAULT true,
  alert_forgotten_conversations BOOLEAN DEFAULT true,

  -- Limites personalizados
  slow_response_threshold INTEGER DEFAULT 300, -- segundos
  quality_threshold INTEGER DEFAULT 70, -- score mínimo

  -- Sugestões
  show_response_suggestions BOOLEAN DEFAULT true,
  show_action_suggestions BOOLEAN DEFAULT true,
  show_coaching_tips BOOLEAN DEFAULT true,

  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_quality_scores_conversation ON conversation_quality_scores(conversation_id);
CREATE INDEX idx_quality_scores_agent ON conversation_quality_scores(agent_id);
CREATE INDEX idx_quality_scores_date ON conversation_quality_scores(analyzed_at);

CREATE INDEX idx_performance_snapshots_agent ON agent_performance_snapshots(agent_id);
CREATE INDEX idx_performance_snapshots_time ON agent_performance_snapshots(snapshot_at);

CREATE INDEX idx_suggestions_conversation ON ai_suggestions(conversation_id);
CREATE INDEX idx_suggestions_agent ON ai_suggestions(agent_id);
CREATE INDEX idx_suggestions_active ON ai_suggestions(expires_at) WHERE was_used IS NULL;

CREATE INDEX idx_patterns_company ON detected_patterns(company_id);
CREATE INDEX idx_patterns_agent ON detected_patterns(agent_id);

CREATE INDEX idx_coaching_agent ON coaching_insights(agent_id);
CREATE INDEX idx_coaching_status ON coaching_insights(status);
```

---

## 🔄 Fluxo de Funcionamento

### 1. Inicialização do Assistente

```typescript
// Quando o usuário entra no app (Chat.tsx)

1. Verificar permissões do usuário
   - Atendentes: veem suas próprias métricas + sugestões
   - Gestores: veem métricas de toda equipe + coaching insights

2. Carregar configurações do assistente
   - assistant_settings para o user_id atual
   - Aplicar preferências de notificação e alertas

3. Iniciar monitoramento em tempo real
   - Subscrever eventos de conversas
   - Subscrever eventos de mensagens
   - Subscrever snapshots de performance

4. Renderizar FloatingAssistant
   - Posição: canto inferior esquerdo
   - Estado inicial: minimizado (apenas ícone)
   - Badge com contador de alertas
```

### 2. Monitoramento Contínuo

```typescript
// Hook: useAssistantMonitoring.ts

MONITORAR:

A. Conversas do Atendente
   - Novas conversas atribuídas
   - Mensagens enviadas/recebidas
   - Tempo desde última resposta
   - Status das conversas (ativas, esperando, fechadas)

B. Qualidade das Interações
   - Tom das mensagens (positivo/negativo/neutro)
   - Palavras-chave de frustração do cliente
   - Uso de empatia e cortesia
   - Clareza das respostas
   - Uso de templates vs. respostas personalizadas

C. Performance em Tempo Real
   - Tempo médio de resposta (últimos 30min)
   - Número de conversas simultâneas
   - Conversas sem resposta há X minutos
   - Taxa de resolução
   - Score de qualidade da sessão atual

D. Padrões e Anomalias
   - Queda súbita na qualidade
   - Aumento no tempo de resposta
   - Picos de conversas não atendidas
   - Problemas recorrentes
```

### 3. Análise e Geração de Insights

```typescript
// Edge Function: ai-quality-scoring

QUANDO: Nova mensagem do atendente é enviada

PROCESSAR:
1. Extrair contexto da conversa
   - Histórico de mensagens (últimas 10)
   - Intenção do cliente (detectada pelo analyze-conversation)
   - Sentimento do cliente
   - Produtos/serviços mencionados

2. Analisar resposta do atendente
   - Tom e cortesia
   - Clareza e completude
   - Empatia e personalização
   - Tempo para responder
   - Uso de informações corretas (verificar knowledge base)

3. Calcular scores
   - Empathy Score (0-100)
   - Resolution Score (0-100)
   - Tone Score (0-100)
   - Professionalism Score (0-100)
   - Overall Score (média ponderada)

4. Identificar issues
   - "Resposta muito curta"
   - "Tom pode ser percebido como rude"
   - "Não abordou a dúvida principal"
   - "Resposta demorada (5min+)"

5. Gerar sugestões
   - "Considere adicionar uma pergunta para entender melhor"
   - "Cliente parece frustrado, tente demonstrar mais empatia"
   - "Você pode usar o template X para responder mais rápido"

6. Salvar em conversation_quality_scores
```

```typescript
// Edge Function: ai-generate-suggestions

QUANDO:
- Nova mensagem do cliente recebida
- Conversa sem resposta há > 3 minutos
- Padrão detectado
- Score de qualidade baixo

PROCESSAR:
1. Analisar contexto
   - Intenção do cliente
   - Histórico da conversa
   - Perfil do contato (CRM)
   - Deals relacionados
   - Interações anteriores

2. Gerar sugestões contextuais

   TIPO: response (sugestão de resposta)
   - Usar analyze-conversation para entender intent
   - Buscar em kb-generate-answer para resposta técnica
   - Adaptar tom ao perfil do cliente
   - Incluir personalização (nome, empresa, etc.)

   TIPO: action (ação recomendada)
   - "Mover deal para próximo estágio"
   - "Criar task de follow-up"
   - "Transferir para setor técnico"
   - "Pausar automação (cliente irritado)"

   TIPO: alert (alerta importante)
   - "Cliente VIP aguardando há 5min"
   - "Conversa sem resposta há 10min"
   - "Cliente mencionou cancelamento"
   - "Oportunidade de upsell detectada"

   TIPO: tip (dica de coaching)
   - "Este tipo de objeção pode ser contornada com X"
   - "Você está indo muito bem em Y!"
   - "Tente fazer perguntas abertas para qualificar"

3. Priorizar sugestões
   - urgent: cliente irritado, VIP, menção de cancelamento
   - high: sem resposta 5min+, oportunidade clara
   - medium: sugestões de melhoria, otimizações
   - low: dicas gerais, coaching

4. Salvar em ai_suggestions
```

```typescript
// Edge Function: ai-pattern-detection

QUANDO: A cada 5 minutos (cron job)

PROCESSAR:
1. Buscar dados dos últimos 7 dias
   - conversation_quality_scores
   - conversations
   - messages
   - deals

2. Detectar padrões por agente

   PADRÃO: recurring_issue
   - Mesmo tipo de dúvida/problema repetido
   - Baixo score em categoria específica
   - Cliente retornando com mesma questão

   PADRÃO: success_pattern
   - Alta taxa de conversão em horário específico
   - Abordagem que funciona bem
   - Templates com melhor engajamento

   PADRÃO: bottleneck
   - Sempre trava em estágio específico do funil
   - Tempo excessivo em tipo de conversa
   - Transferências frequentes

   PADRÃO: performance_trend
   - Melhoria contínua em métrica
   - Queda gradual em score
   - Inconsistência (varia muito)

3. Calcular confiança do padrão
   - Quantidade de ocorrências
   - Consistência temporal
   - Correlação estatística

4. Gerar recomendações
   - Para recurring_issue: "Criar artigo na KB", "Treinar equipe"
   - Para bottleneck: "Revisar processo", "Adicionar automação"
   - Para success_pattern: "Compartilhar com equipe", "Documentar"

5. Salvar em detected_patterns
```

```typescript
// Edge Function: ai-coaching-insights

QUANDO: A cada 24 horas (cron job noturno)

PROCESSAR:
1. Agregar dados do dia por agente
   - Conversation quality scores
   - Performance snapshots
   - Patterns detectados
   - Feedback de clientes (CSAT)

2. Identificar conquistas
   - "Bateu meta de tempo de resposta"
   - "Melhor score de qualidade da semana"
   - "100% de satisfação hoje"
   - "Resolveu 50 conversas em um dia"

3. Identificar áreas de melhoria
   - "Score de empatia abaixo da média"
   - "Tempo de resposta aumentou 30%"
   - "3 clientes reclamaram de falta de follow-up"

4. Gerar insights acionáveis
   - Strengths: "João é excelente em lidar com objeções"
   - Improvement: "Maria pode melhorar personalização das respostas"
   - Achievement: "Pedro bateu recorde de conversões esta semana"
   - Concern: "Ana está com carga muito alta (20 conversas simultâneas)"

5. Criar ações recomendadas para gestor
   - "Reconhecer João publicamente"
   - "Agendar 1:1 com Maria para treinar personalização"
   - "Celebrar resultado de Pedro"
   - "Redistribuir conversas de Ana"

6. Salvar em coaching_insights
```

### 4. Interface do Assistente

```typescript
// Componente: FloatingAssistant.tsx

ESTADOS:

1. MINIMIZADO (padrão)
   ┌─────────────┐
   │     🤖      │
   │  Assistente │
   │     (3)     │  <- badge com alertas
   └─────────────┘

   Tamanho: 80px x 80px
   Posição: fixed, bottom-left (20px, 20px)
   Animação: pulso suave quando há novos alertas

2. EXPANDIDO (ao clicar)
   ┌────────────────────────────────────┐
   │  🤖 Assistente IA          [ - ]  │
   │  ────────────────────────────────  │
   │                                    │
   │  📊 Performance  🎯 Sugestões     │
   │  💡 Dicas        ⚠️  Alertas (3)  │
   │  ────────────────────────────────  │
   │                                    │
   │  [CONTEÚDO DA ABA SELECIONADA]    │
   │                                    │
   │                                    │
   │                                    │
   └────────────────────────────────────┘

   Tamanho: 400px x 600px
   Posição: fixed, bottom-left (20px, 20px)
   Animação: slide up + fade in
   Abas: Performance, Sugestões, Dicas, Alertas
```

```typescript
// Aba: Performance (PerformanceMonitor.tsx)

MOSTRAR:

┌────────────────────────────────────┐
│  📊 Sua Performance Hoje           │
├────────────────────────────────────┤
│                                    │
│  ⏱️  Tempo Médio de Resposta       │
│     2min 34s  🟢 -15% vs ontem    │
│                                    │
│  💬 Conversas Atendidas            │
│     23 conversas  🟢 +3 vs média  │
│                                    │
│  ⭐ Score de Qualidade             │
│     87/100  🟡 -3 pontos          │
│     ├─ Empatia: 92/100 🟢         │
│     ├─ Profissionalismo: 95/100 🟢│
│     ├─ Resolução: 78/100 🟡       │
│     └─ Tom: 85/100 🟢             │
│                                    │
│  🎯 Conversas Ativas               │
│     4 conversas                    │
│     └─ 1 aguardando >5min ⚠️      │
│                                    │
│  📈 Tendência (últimas 2h)         │
│     [Mini gráfico de linha]        │
│                                    │
└────────────────────────────────────┘

ATUALIZAÇÃO: Tempo real (a cada nova mensagem/evento)
DADOS: agent_performance_snapshots + conversation_quality_scores
```

```typescript
// Aba: Sugestões (ContextualSuggestions.tsx)

MOSTRAR:

┌────────────────────────────────────┐
│  🎯 Sugestões para Você            │
├────────────────────────────────────┤
│                                    │
│  🔴 URGENTE                        │
│  Cliente VIP aguardando            │
│  João Silva - 8min sem resposta   │
│  [Ir para conversa]                │
│                                    │
│  🟡 IMPORTANTE                     │
│  Oportunidade de upsell            │
│  Cliente perguntou sobre plano Pro │
│  💡 "Posso te mostrar os recursos  │
│      do plano Pro que se encaixam  │
│      perfeitamente no seu caso..." │
│  [Usar sugestão] [Ignorar]         │
│                                    │
│  🟢 DICA                           │
│  Você está indo muito bem!         │
│  Seu tempo de resposta melhorou    │
│  15% hoje. Continue assim! 🚀      │
│  [Ok, obrigado]                    │
│                                    │
│  ─────────────────────────         │
│  📝 3 sugestões anteriores         │
│                                    │
└────────────────────────────────────┘

ATUALIZAÇÃO: Real-time (quando nova sugestão é gerada)
DADOS: ai_suggestions (ordenado por priority + created_at)
AÇÕES:
  - Clicar em sugestão de resposta → copia para input
  - Clicar em "Ir para conversa" → muda selectedConversation
  - Feedback: 👍 útil / 👎 não útil
```

```typescript
// Aba: Dicas (CoachingInsights.tsx)

MOSTRAR:

┌────────────────────────────────────┐
│  💡 Dicas para Melhorar            │
├────────────────────────────────────┤
│                                    │
│  🌟 Seus Pontos Fortes             │
│                                    │
│  ✓ Excelente empatia               │
│    Você sempre demonstra que se    │
│    importa com o cliente           │
│                                    │
│  ✓ Respostas claras                │
│    Suas mensagens são objetivas    │
│    e fáceis de entender            │
│                                    │
│  ─────────────────────────         │
│                                    │
│  📈 Oportunidades de Crescimento   │
│                                    │
│  • Tempo de resposta               │
│    Tente responder em até 3min     │
│    💡 Use templates para dúvidas   │
│       frequentes                   │
│                                    │
│  • Personalização                  │
│    Adicione mais detalhes pessoais │
│    💡 Use o nome do cliente e      │
│       referencie conversas anteriores│
│                                    │
│  ─────────────────────────         │
│                                    │
│  🎯 Meta da Semana                 │
│  Manter score de qualidade >85     │
│  Progresso: ████████░░ 80%         │
│                                    │
└────────────────────────────────────┘

ATUALIZAÇÃO: Diária (coaching_insights novos)
DADOS: coaching_insights + detected_patterns
```

```typescript
// Aba: Alertas (AlertsPanel.tsx)

MOSTRAR:

┌────────────────────────────────────┐
│  ⚠️  Alertas (3)                   │
├────────────────────────────────────┤
│                                    │
│  🔴 Maria Santos                   │
│     Cliente aguardando há 12min    │
│     Última msg: "Alguém pode me    │
│     ajudar? Estou com pressa!"     │
│     [Responder agora]              │
│     Há 12 minutos                  │
│                                    │
│  🟡 Pedro Costa                    │
│     Score de qualidade baixo (65)  │
│     Cliente demonstrou frustração  │
│     [Ver conversa] [Sugerir frase] │
│     Há 5 minutos                   │
│                                    │
│  🟡 Ana Lima                       │
│     Mencionou "cancelar"           │
│     Possível churn risk            │
│     [Ver conversa] [Criar task]    │
│     Há 8 minutos                   │
│                                    │
│  ─────────────────────────         │
│  ✓ 15 alertas resolvidos hoje     │
│                                    │
└────────────────────────────────────┘

ATUALIZAÇÃO: Real-time
DADOS: ai_suggestions (type=alert, priority=high/urgent)
SONS: Notificação sonora para alertas urgentes
```

### 5. Dashboard para Gestores

```typescript
// Componente: ManagerDashboard.tsx
// Acesso: Apenas roles admin/manager
// Rota: /ai-insights ou aba dentro de /settings

MOSTRAR:

┌──────────────────────────────────────────────────────────┐
│  🎯 Dashboard de Performance da Equipe                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  📊 Visão Geral (Hoje)                                   │
│                                                           │
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │ Conversas    │ Tempo Médio  │ Qualidade    │         │
│  │ 147          │ 3min 22s     │ 82/100       │         │
│  │ 🟢 +12%      │ 🟢 -18%      │ 🟡 -3pts     │         │
│  └──────────────┴──────────────┴──────────────┘         │
│                                                           │
│  ─────────────────────────────────────────────           │
│                                                           │
│  👥 Performance Individual                                │
│                                                           │
│  Agente          Conv  Tempo  Qualidade  Status          │
│  ───────────────────────────────────────────────         │
│  João Silva       23   2:15   87  🟢     🟢 Online       │
│  Maria Santos     19   4:30   78  🟡     🟢 Online       │
│  Pedro Costa      31   2:45   92  🟢     🟢 Online       │
│  Ana Lima         18   6:12   68  🔴     🟡 Sobrecarga   │
│                                                           │
│  [Ver detalhes] [Exportar relatório]                     │
│                                                           │
│  ─────────────────────────────────────────────           │
│                                                           │
│  🔍 Padrões Detectados                                   │
│                                                           │
│  🔴 Alta prioridade                                       │
│  • Pico de conversas sem resposta (15h-16h)              │
│    Ação: Adicionar atendente neste horário              │
│                                                           │
│  🟡 Média prioridade                                      │
│  • Dúvidas sobre "integração" recorrentes                │
│    Ação: Criar artigo na base de conhecimento           │
│                                                           │
│  🟢 Padrão de sucesso                                     │
│  • Uso de template "Boas-vindas V2" aumentou CSAT        │
│    Ação: Compartilhar com toda equipe                    │
│                                                           │
│  ─────────────────────────────────────────────           │
│                                                           │
│  💼 Insights de Coaching                                  │
│                                                           │
│  Ana Lima - Precisa de atenção                           │
│  • Score de qualidade em queda (68, era 78)              │
│  • Tempo de resposta aumentou 40%                        │
│  • 4 conversas simultâneas (sobrecarga)                  │
│  📌 Ação recomendada: 1:1 + redistribuir conversas       │
│  [Marcar reunião] [Ver detalhes]                         │
│                                                           │
│  Pedro Costa - Destaque do mês! 🌟                       │
│  • Melhor score de qualidade (92)                        │
│  • 31 conversas resolvidas hoje                          │
│  • 95% de satisfação do cliente                          │
│  📌 Ação recomendada: Reconhecer publicamente            │
│  [Enviar parabéns] [Ver detalhes]                        │
│                                                           │
└──────────────────────────────────────────────────────────┘

ATUALIZAÇÃO: Real-time para métricas, Daily para insights
DADOS: Agregação de todas as tabelas do assistente
EXPORTAÇÃO: PDF, Excel com relatórios detalhados
```

---

## 🛠️ Implementação Passo a Passo

### FASE 1: Infraestrutura Base (3-5 dias)

#### Task 1.1: Criar Tabelas do Banco de Dados
```bash
# Arquivo: supabase/migrations/20251223000010_ai_assistant_tables.sql
```
- [ ] Criar tabela `conversation_quality_scores`
- [ ] Criar tabela `agent_performance_snapshots`
- [ ] Criar tabela `ai_suggestions`
- [ ] Criar tabela `detected_patterns`
- [ ] Criar tabela `coaching_insights`
- [ ] Criar tabela `assistant_settings`
- [ ] Criar índices para performance
- [ ] Criar políticas RLS (filtrar por company_id)
- [ ] Testar migração em ambiente de dev

#### Task 1.2: Tipos TypeScript
```typescript
// Arquivo: src/types/ai-assistant.ts
```
- [ ] Definir interface `ConversationQualityScore`
- [ ] Definir interface `AgentPerformanceSnapshot`
- [ ] Definir interface `AISuggestion`
- [ ] Definir interface `DetectedPattern`
- [ ] Definir interface `CoachingInsight`
- [ ] Definir interface `AssistantSettings`
- [ ] Definir enums (SuggestionType, Priority, PatternType, etc.)

#### Task 1.3: Edge Functions Base
```bash
# Criar estrutura básica das funções
```
- [ ] Criar `supabase/functions/ai-quality-scoring/index.ts`
- [ ] Criar `supabase/functions/ai-generate-suggestions/index.ts`
- [ ] Criar `supabase/functions/ai-pattern-detection/index.ts`
- [ ] Criar `supabase/functions/ai-coaching-insights/index.ts`
- [ ] Configurar variáveis de ambiente (API keys de IA)
- [ ] Configurar CORS e autenticação
- [ ] Testar deploy local

---

### FASE 2: Monitoramento e Análise (5-7 dias)

#### Task 2.1: Hook de Monitoramento Principal
```typescript
// Arquivo: src/hooks/ai-assistant/useAssistantMonitoring.ts
```
- [ ] Criar hook `useAssistantMonitoring()`
- [ ] Implementar subscrição real-time de conversas
- [ ] Implementar subscrição real-time de mensagens
- [ ] Detectar eventos importantes (nova mensagem, tempo sem resposta, etc.)
- [ ] Triggerar análises quando necessário
- [ ] Gerenciar estado global do assistente (usando Context ou Zustand)

#### Task 2.2: Análise de Qualidade
```typescript
// Edge Function: ai-quality-scoring
```
- [ ] Integrar com API de IA (OpenAI/Gemini/Groq)
- [ ] Criar prompt para análise de qualidade
- [ ] Implementar cálculo de scores (empathy, tone, resolution, etc.)
- [ ] Identificar issues (respostas curtas, tom negativo, etc.)
- [ ] Salvar em `conversation_quality_scores`
- [ ] Otimizar para não analisar todas mensagens (apenas respostas do agente)

```typescript
// Hook: useConversationQuality.ts
```
- [ ] Hook para buscar quality scores de conversa
- [ ] Hook para buscar histórico de quality scores
- [ ] Calcular médias e tendências
- [ ] Cache com React Query

#### Task 2.3: Performance em Tempo Real
```typescript
// Edge Function: calculate-performance-snapshot
```
- [ ] Calcular métricas do momento para um agente
  - Conversas ativas
  - Conversas aguardando
  - Tempo médio de resposta (últimos 30min)
  - Score de qualidade (últimas conversas)
- [ ] Determinar carga atual (low/medium/high/overloaded)
- [ ] Salvar em `agent_performance_snapshots`
- [ ] Criar cron job para rodar a cada 5 minutos

```typescript
// Hook: useAgentPerformance.ts
```
- [ ] Buscar snapshot mais recente
- [ ] Buscar histórico de snapshots (gráfico de tendência)
- [ ] Comparar com períodos anteriores (hoje vs ontem)
- [ ] Real-time updates via subscription

#### Task 2.4: Motor de Sugestões
```typescript
// Edge Function: ai-generate-suggestions
```
- [ ] Analisar contexto da conversa atual
- [ ] Integrar com `analyze-conversation` existente
- [ ] Integrar com `kb-generate-answer` para sugestões técnicas
- [ ] Gerar sugestões de resposta personalizadas
- [ ] Gerar sugestões de ação (criar task, mover deal, etc.)
- [ ] Gerar alertas (cliente VIP, tempo longo, palavras-chave críticas)
- [ ] Priorizar sugestões (urgent > high > medium > low)
- [ ] Salvar em `ai_suggestions` com expiração
- [ ] Configurar triggers:
  - Nova mensagem do cliente
  - Conversa sem resposta >3min
  - Score de qualidade baixo detectado

```typescript
// Hook: useContextualSuggestions.ts
```
- [ ] Buscar sugestões ativas (não expiradas, não usadas)
- [ ] Ordenar por prioridade + timestamp
- [ ] Marcar sugestão como usada
- [ ] Registrar feedback (útil/não útil)
- [ ] Real-time updates

---

### FASE 3: Interface do Assistente (5-7 dias)

#### Task 3.1: Componente Flutuante Base
```typescript
// Arquivo: src/components/ai-assistant/FloatingAssistant.tsx
```
- [ ] Criar botão flutuante (minimizado)
- [ ] Implementar animação de pulso para novos alertas
- [ ] Badge com contador de alertas
- [ ] Toggle entre minimizado/expandido
- [ ] Persistir estado (localStorage)
- [ ] Posicionar no canto inferior esquerdo
- [ ] Arrastar para reposicionar (opcional)
- [ ] Responsividade mobile (esconder ou ajustar)

#### Task 3.2: Painel Expandido
```typescript
// Arquivo: src/components/ai-assistant/AssistantPanel.tsx
```
- [ ] Container principal (400x600px)
- [ ] Header com título e botão minimizar
- [ ] Sistema de abas (Tabs do Radix UI)
- [ ] Animações de transição (framer-motion)
- [ ] Scroll interno (ScrollArea do Radix UI)
- [ ] Loading states

#### Task 3.3: Aba de Performance
```typescript
// Arquivo: src/components/ai-assistant/PerformanceMonitor.tsx
```
- [ ] Integrar com `useAgentPerformance()`
- [ ] Exibir métricas principais:
  - Tempo médio de resposta (com comparação)
  - Conversas atendidas (com comparação)
  - Score de qualidade (com breakdown)
  - Conversas ativas + alertas
- [ ] Mini gráfico de tendência (recharts ou lightweight-charts)
- [ ] Ícones coloridos para indicadores (🟢🟡🔴)
- [ ] Atualização em tempo real

#### Task 3.4: Aba de Sugestões
```typescript
// Arquivo: src/components/ai-assistant/ContextualSuggestions.tsx
```
- [ ] Integrar com `useContextualSuggestions()`
- [ ] Listar sugestões por prioridade
- [ ] Card para cada sugestão:
  - Ícone de prioridade
  - Título e descrição
  - Botões de ação (usar, ignorar)
  - Timestamp
- [ ] Copiar sugestão de resposta para input do chat
- [ ] Executar ação sugerida (ir para conversa, criar task, etc.)
- [ ] Feedback buttons (👍👎)
- [ ] Animação para novas sugestões
- [ ] Histórico colapsável

#### Task 3.5: Aba de Dicas
```typescript
// Arquivo: src/components/ai-assistant/CoachingInsights.tsx
```
- [ ] Integrar com `useCoachingInsights()`
- [ ] Seção "Seus Pontos Fortes"
- [ ] Seção "Oportunidades de Crescimento"
- [ ] Dicas acionáveis com ícones 💡
- [ ] Meta da semana com progress bar
- [ ] Conquistas recentes (achievements)
- [ ] Animação de confete para conquistas (canvas-confetti)

#### Task 3.6: Aba de Alertas
```typescript
// Arquivo: src/components/ai-assistant/AlertsPanel.tsx
```
- [ ] Integrar com `useContextualSuggestions()` (filtrar type=alert)
- [ ] Listar alertas ativos por urgência
- [ ] Card de alerta:
  - Ícone de severidade
  - Nome do cliente
  - Descrição do problema
  - Botões de ação rápida
  - Tempo desde o alerta
- [ ] Auto-dismiss quando resolvido
- [ ] Som de notificação (opcional, configurável)
- [ ] Histórico de alertas resolvidos

---

### FASE 4: Detecção de Padrões e Coaching (4-6 dias)

#### Task 4.1: Detecção de Padrões
```typescript
// Edge Function: ai-pattern-detection
```
- [ ] Configurar cron job (a cada 6 horas)
- [ ] Buscar dados agregados (últimos 7 dias):
  - Quality scores por agente
  - Conversas e outcomes
  - Mensagens e temas recorrentes
- [ ] Algoritmos de detecção:
  - Recurring issues (mesmos problemas repetidos)
  - Success patterns (o que funciona)
  - Bottlenecks (onde trava)
  - Performance trends (tendências)
- [ ] Calcular confiança do padrão (score)
- [ ] Gerar recomendações automáticas
- [ ] Salvar em `detected_patterns`

```typescript
// Hook: usePatternDetection.ts
```
- [ ] Buscar padrões detectados (geral + por agente)
- [ ] Filtrar por tipo e impacto
- [ ] Marcar padrão como resolvido

#### Task 4.2: Insights de Coaching
```typescript
// Edge Function: ai-coaching-insights
```
- [ ] Configurar cron job (daily, 00:00)
- [ ] Agregar dados do dia por agente
- [ ] Identificar conquistas (achievements)
- [ ] Identificar áreas de melhoria
- [ ] Comparar com baseline (média da equipe)
- [ ] Gerar insights categorizados:
  - Strengths (pontos fortes)
  - Improvements (melhorias)
  - Achievements (conquistas)
  - Concerns (preocupações)
- [ ] Criar ações recomendadas para gestor
- [ ] Salvar em `coaching_insights`
- [ ] Notificar gestor (email opcional)

```typescript
// Hook: useCoachingInsights.ts
```
- [ ] Buscar insights do agente atual
- [ ] Buscar insights da equipe (para gestores)
- [ ] Marcar insight como acknowledged
- [ ] Marcar insight como resolvido
- [ ] Filtrar por categoria e status

#### Task 4.3: Componente de Padrões
```typescript
// Arquivo: src/components/ai-assistant/ConversationPatterns.tsx
```
- [ ] Integrar com `usePatternDetection()`
- [ ] Listar padrões detectados
- [ ] Card de padrão:
  - Tipo e nome
  - Descrição
  - Número de ocorrências
  - Nível de impacto
  - Recomendações
  - Botão "Marcar como resolvido"
- [ ] Filtros (tipo, impacto)

---

### FASE 5: Dashboard Gerencial (4-5 dias)

#### Task 5.1: Página de Insights para Gestores
```typescript
// Arquivo: src/pages/AIInsights.tsx
```
- [ ] Criar rota `/ai-insights` (protegida para admin/manager)
- [ ] Layout com seções:
  - Visão Geral (cards de métricas)
  - Performance Individual (tabela)
  - Padrões Detectados
  - Insights de Coaching
- [ ] Integrar com hooks existentes
- [ ] Adicionar ao menu de navegação (para gestores)

#### Task 5.2: Dashboard de Performance da Equipe
```typescript
// Arquivo: src/components/ai-assistant/ManagerDashboard.tsx
```
- [ ] Visão Geral (KPIs agregados)
  - Total de conversas
  - Tempo médio da equipe
  - Score de qualidade médio
  - Comparações com períodos anteriores
- [ ] Tabela de Performance Individual
  - Ordenável por coluna
  - Status em tempo real (online/offline/sobrecarga)
  - Drill-down para detalhes do agente
- [ ] Gráficos:
  - Tendência de qualidade (últimos 7 dias)
  - Distribuição de tempo de resposta
  - Conversas por agente (bar chart)

#### Task 5.3: Seção de Padrões para Gestores
- [ ] Listar padrões detectados (toda equipe)
- [ ] Priorizar por impacto
- [ ] Exibir recomendações acionáveis
- [ ] Criar tasks a partir de padrões
- [ ] Exportar relatório de padrões (PDF/Excel)

#### Task 5.4: Seção de Coaching para Gestores
- [ ] Listar insights de todos agentes
- [ ] Filtrar por agente, categoria, status
- [ ] Destacar insights críticos (concerns)
- [ ] Celebrar conquistas (achievements)
- [ ] Ações rápidas:
  - Marcar reunião 1:1
  - Enviar mensagem de parabéns
  - Criar plano de ação
- [ ] Histórico de coaching

#### Task 5.5: Exportação de Relatórios
```typescript
// Arquivo: src/lib/ai-assistant/reportExporter.ts
```
- [ ] Gerar relatório PDF
  - Header com logo e período
  - Métricas principais
  - Tabela de performance
  - Gráficos
  - Insights destacados
- [ ] Gerar relatório Excel
  - Múltiplas planilhas (overview, individual, padrões, insights)
  - Formatação condicional
  - Gráficos embutidos
- [ ] Botão de download no dashboard

---

### FASE 6: Configurações e Personalização (2-3 dias)

#### Task 6.1: Painel de Configurações
```typescript
// Arquivo: src/components/ai-assistant/AssistantSettings.tsx
```
- [ ] Adicionar aba "Assistente IA" em /settings
- [ ] Formulário de configuração:
  - Habilitar/desabilitar assistente
  - Posição do botão (bottom-left/bottom-right)
  - Nível de notificações (all/important/critical/none)
  - Tipos de alertas habilitados (checkboxes)
  - Limites personalizados (sliders):
    - Tempo de resposta lento (threshold)
    - Score de qualidade mínimo
  - Sugestões habilitadas (toggles)
- [ ] Salvar em `assistant_settings`

#### Task 6.2: Hook de Configurações
```typescript
// Arquivo: src/hooks/ai-assistant/useAssistantSettings.ts
```
- [ ] Buscar configurações do usuário
- [ ] Criar configurações padrão se não existir
- [ ] Atualizar configurações
- [ ] Validar thresholds (min/max)
- [ ] Aplicar configurações no assistente

#### Task 6.3: Sistema de Notificações
```typescript
// Integrar com src/hooks/ui/useNotifications.ts
```
- [ ] Respeitar nível de notificação configurado
- [ ] Mostrar toast para novos alertas
- [ ] Badge no ícone flutuante
- [ ] Som de notificação (opcional)
- [ ] Notificação push (PWA) para alertas urgentes
- [ ] Histórico de notificações

---

### FASE 7: Otimizações e Testes (3-4 dias)

#### Task 7.1: Performance
- [ ] Lazy load do AssistantPanel (só carregar quando expandir)
- [ ] Debounce em análises (não analisar cada keystroke)
- [ ] Cache agressivo com React Query
- [ ] Virtualização de listas longas (react-window)
- [ ] Otimizar queries SQL (EXPLAIN ANALYZE)
- [ ] Índices adicionais se necessário
- [ ] Rate limiting nas Edge Functions
- [ ] Batch processing de análises

#### Task 7.2: Testes
- [ ] Testes unitários dos hooks
- [ ] Testes de integração das Edge Functions
- [ ] Testes E2E do fluxo completo
  - Receber mensagem → Análise → Sugestão → Usar sugestão
- [ ] Testes de carga (simular 50+ agentes simultâneos)
- [ ] Testar em diferentes resoluções
- [ ] Testar em mobile

#### Task 7.3: Acessibilidade
- [ ] Navegação por teclado
- [ ] ARIA labels em todos componentes
- [ ] Contraste de cores (WCAG AA)
- [ ] Screen reader friendly
- [ ] Focus management

#### Task 7.4: Error Handling
- [ ] Fallbacks quando IA não responde
- [ ] Retry automático com backoff exponencial
- [ ] Mensagens de erro amigáveis
- [ ] Logging de erros (Sentry ou similar)
- [ ] Degradação graciosa (assistente continua funcionando sem IA)

---

### FASE 8: Documentação e Lançamento (2-3 dias)

#### Task 8.1: Documentação
- [ ] README do assistente (como funciona)
- [ ] Documentação técnica (arquitetura, APIs)
- [ ] Guia de uso para atendentes
- [ ] Guia de uso para gestores
- [ ] FAQ
- [ ] Vídeo tutorial (opcional)

#### Task 8.2: Onboarding
- [ ] Tour guiado para novos usuários (react-joyride)
- [ ] Tooltips explicativos
- [ ] Modal de boas-vindas
- [ ] Sugestões de configuração inicial

#### Task 8.3: Rollout Gradual
- [ ] Feature flag para habilitar assistente
- [ ] Beta com grupo pequeno (5-10 usuários)
- [ ] Coletar feedback
- [ ] Ajustar com base no feedback
- [ ] Lançamento para todos

#### Task 8.4: Monitoramento Pós-Lançamento
- [ ] Dashboards de uso (Amplitude, Mixpanel, etc.)
- [ ] Métricas de adoção
- [ ] Feedback de usuários (NPS específico do assistente)
- [ ] Monitorar custos de API de IA
- [ ] Otimizar prompts com base em resultados

---

## 📊 Métricas de Sucesso

### Métricas de Produto
- **Adoção**: % de usuários que habilitam o assistente
- **Engajamento**: Média de interações por dia
- **Utilidade**: % de sugestões marcadas como úteis
- **Conversão**: % de sugestões efetivamente usadas

### Métricas de Impacto
- **Tempo de Resposta**: Redução de X% após usar assistente
- **Qualidade**: Aumento de X pontos no score médio
- **Satisfação**: Aumento de X% no CSAT
- **Produtividade**: Aumento de X% em conversas atendidas por agente

### Métricas Técnicas
- **Latência**: Tempo médio para gerar sugestão (<2s)
- **Acurácia**: % de sugestões relevantes (>80%)
- **Uptime**: Disponibilidade do sistema (>99.5%)
- **Custo**: Custo de IA por conversa analisada

---

## 🔐 Segurança e Privacidade

### Considerações de Segurança
- [ ] Todas análises de IA respeitam RLS (company_id)
- [ ] Dados sensíveis não enviados para APIs externas
- [ ] Logs de análises com retenção limitada (30 dias)
- [ ] Criptografia de dados em trânsito e repouso
- [ ] Auditoria de acessos aos insights de coaching

### Privacidade
- [ ] Consentimento do usuário para monitoramento
- [ ] Opção de opt-out a qualquer momento
- [ ] Transparência sobre o que é monitorado
- [ ] Anonimização de dados para análises agregadas
- [ ] LGPD/GDPR compliance

---

## 💰 Estimativa de Custos

### Custos de IA (por conversa analisada)
- **OpenAI GPT-4**: ~$0.02/conversa
- **Gemini Pro**: ~$0.005/conversa
- **Groq (Llama)**: ~$0.001/conversa

### Estratégia de Otimização
- Usar modelo mais barato para análises simples (sentiment)
- Usar modelo avançado para sugestões complexas
- Cache de análises similares
- Batch processing
- Rate limiting por usuário

### Estimativa Mensal (100 agentes, 50 conversas/dia/agente)
- Total de conversas: 150.000/mês
- Custo com Gemini Pro: ~$750/mês
- Custo com Groq: ~$150/mês

---

## 🚀 Roadmap Futuro

### V2 (3-6 meses após lançamento)
- [ ] Integração com calendário (sugerir horários de follow-up)
- [ ] Análise de voz (transcrição + análise de chamadas)
- [ ] Gamificação (pontos, badges, rankings)
- [ ] Assistente proativo (notifica sem precisar abrir app)
- [ ] Multi-idioma
- [ ] Personalização de prompts por empresa

### V3 (6-12 meses)
- [ ] Treinamento de modelo próprio (fine-tuning)
- [ ] Previsão de churn com ML
- [ ] Recomendação automática de treinamentos
- [ ] Integração com LMS (Learning Management System)
- [ ] Simulações de conversas para treinamento
- [ ] Analytics preditivos (forecast de performance)

---

## 📝 Checklist de Implementação

### Pré-requisitos
- [ ] Acesso a API de IA (OpenAI/Gemini/Groq)
- [ ] Permissões para criar Edge Functions
- [ ] Permissões para criar tabelas no Supabase
- [ ] Ambiente de desenvolvimento configurado

### Pronto para Implementar
Este plano está completo e detalhado o suficiente para um agente de IA implementar de forma autônoma. Cada fase tem tasks claras com arquivos específicos e funcionalidades bem definidas.

### Ordem de Execução Recomendada
1. **Começar pela Fase 1** (infraestrutura) - sem ela, nada funciona
2. **Fase 2** (monitoramento) - core do sistema
3. **Fase 3** (interface) - tornar visível para usuários
4. **Fase 4** (padrões) - valor adicional
5. **Fase 5** (dashboard gestor) - valor para liderança
6. **Fases 6-8** (polish e lançamento)

### Estimativa Total
- **Desenvolvimento**: 25-35 dias (1 desenvolvedor full-time)
- **Com equipe de 2-3**: 15-20 dias
- **MVP (Fases 1-3)**: 10-15 dias

---

## 🎨 Mockups de Referência

### Botão Flutuante Minimizado
```
┌─────────┐
│   🤖    │  <- Ícone animado
│Assistant│
│   (3)   │  <- Badge de alertas
└─────────┘
  80x80px
  Sombra suave
  Hover: scale 1.05
```

### Painel Expandido
```
┌──────────────────────────────────────┐
│  🤖 Assistente IA            [━] [✕] │ <- Header
├──────────────────────────────────────┤
│  📊 Performance  🎯 Sugestões ⚠️ ... │ <- Tabs
├──────────────────────────────────────┤
│                                      │
│  [Conteúdo da aba selecionada]       │
│                                      │
│  [Scroll vertical se necessário]    │
│                                      │
│                                      │
└──────────────────────────────────────┘
   400x600px
   Animação: slide up + fade in
   Backdrop blur no fundo (opcional)
```

---

## 🎯 Conclusão

Este plano fornece uma arquitetura completa e detalhada para implementar um assistente de IA que monitora e orienta atendentes em tempo real. O sistema é:

✅ **Escalável**: Arquitetura baseada em eventos e jobs assíncronos
✅ **Performante**: Cache agressivo, lazy loading, otimizações
✅ **Inteligente**: Múltiplas análises de IA para insights profundos
✅ **Acionável**: Sugestões contextuais e práticas
✅ **Valioso**: Para atendentes (melhorar) e gestores (acompanhar)

O assistente será um diferencial competitivo, melhorando a qualidade do atendimento, aumentando a produtividade dos agentes e fornecendo insights valiosos para a gestão.
