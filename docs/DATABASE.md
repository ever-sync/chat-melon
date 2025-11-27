# Documentação do Banco de Dados - CRM WhatsApp

Esta documentação descreve todas as tabelas, colunas e funcionalidades do sistema de CRM integrado com WhatsApp.

---

## 📋 Índice

1. [Empresas e Usuários](#empresas-e-usuários)
2. [Chat e Mensagens](#chat-e-mensagens)
3. [Contatos](#contatos)
4. [CRM - Negócios e Pipeline](#crm---negócios-e-pipeline)
5. [Tarefas](#tarefas)
6. [Propostas Comerciais](#propostas-comerciais)
7. [Produtos](#produtos)
8. [Campanhas em Massa](#campanhas-em-massa)
9. [Automações e Playbooks](#automações-e-playbooks)
10. [Inteligência Artificial](#inteligência-artificial)
11. [Gamificação](#gamificação)
12. [Notificações](#notificações)
13. [Integrações](#integrações)
14. [Segurança e Auditoria](#segurança-e-auditoria)

---

## 1. Empresas e Usuários

### `companies`
Armazena informações das empresas (clientes do sistema).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `name` | text | Nome da empresa |
| `cnpj` | text | CNPJ da empresa |
| `email` | text | Email de contato |
| `phone` | text | Telefone |
| `logo_url` | text | URL do logotipo |
| `address` | text | Endereço completo |
| `city` | text | Cidade |
| `state` | text | Estado (UF) |
| `postal_code` | text | CEP |
| `is_active` | boolean | Status de ativação |
| `status` | text | Status geral (active/inactive) |
| `business_status` | text | Status do horário comercial (open/closed) |
| `business_hours` | jsonb | Horários de funcionamento por dia da semana |
| `subscription_id` | uuid | Referência ao plano de assinatura |
| `created_by` | uuid | Usuário que criou a empresa |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar informações das empresas clientes do sistema. Cada empresa é um tenant isolado com seus próprios dados.

---

### `company_users`
Relacionamento entre usuários e empresas (many-to-many).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Referência ao usuário |
| `company_id` | uuid | Referência à empresa |
| `is_default` | boolean | Se é a empresa padrão do usuário |
| `created_at` | timestamptz | Data de vinculação |

**Propósito:** Permite que usuários pertençam a múltiplas empresas e define qual empresa é padrão para login.

---

### `company_members`
Informações detalhadas dos membros da equipe dentro de cada empresa.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Referência ao usuário |
| `company_id` | uuid | Referência à empresa |
| `role` | user_role | Papel do usuário (owner/admin/manager/supervisor/seller/viewer) |
| `display_name` | text | Nome de exibição |
| `email` | text | Email |
| `phone` | text | Telefone |
| `avatar_url` | text | URL do avatar |
| `is_active` | boolean | Status ativo/inativo |
| `is_online` | boolean | Status online em tempo real |
| `last_seen_at` | timestamptz | Último acesso |
| `current_status` | text | Status atual (online/offline/away/busy) |
| `can_receive_chats` | boolean | Pode receber atribuições de chat |
| `max_concurrent_chats` | integer | Limite de chats simultâneos |
| `team_id` | uuid | Time ao qual pertence |
| `reports_to` | uuid | Supervisor direto |
| `working_hours` | jsonb | Horário de trabalho configurado |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar perfis completos dos membros da equipe com controle de permissões e disponibilidade.

---

### `company_invites`
Convites pendentes para novos membros da equipe.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa que convida |
| `email` | text | Email do convidado |
| `role` | user_role | Papel que será atribuído |
| `team_id` | uuid | Time ao qual será atribuído |
| `invited_by` | uuid | Quem enviou o convite |
| `status` | text | Status (pending/accepted/expired) |
| `expires_at` | timestamptz | Data de expiração (7 dias) |
| `created_at` | timestamptz | Data do convite |

**Propósito:** Controlar convites pendentes para novos membros com expiração automática.

---

### `teams`
Organização de times dentro das empresas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do time |
| `description` | text | Descrição do time |
| `manager_id` | uuid | Gerente responsável |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Organizar vendedores em times para hierarquia e relatórios.

---

### `profiles`
Perfil base dos usuários autenticados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador (= auth.users.id) |
| `full_name` | text | Nome completo |
| `avatar_url` | text | URL do avatar |
| `google_calendar_token` | text | Token OAuth Google Calendar |
| `google_calendar_refresh_token` | text | Refresh token Google |
| `google_calendar_email` | text | Email vinculado ao Google Calendar |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Informações básicas do perfil do usuário e tokens de integração externa.

---

### `platform_admins`
Administradores da plataforma (super admins).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Referência ao usuário |
| `is_active` | boolean | Status ativo |
| `created_at` | timestamptz | Data de concessão |

**Propósito:** Controlar quem tem acesso ao painel administrativo da plataforma.

---

## 2. Chat e Mensagens

### `conversations`
Conversas individuais com clientes via WhatsApp.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Usuário proprietário |
| `company_id` | uuid | Empresa proprietária |
| `contact_id` | uuid | Contato relacionado |
| `contact_name` | text | Nome do contato |
| `contact_number` | text | Número do WhatsApp |
| `profile_pic_url` | text | Foto de perfil do contato |
| `status` | conversation_status | Status (waiting/active/resolved/closed) |
| `assigned_to` | uuid | Usuário responsável |
| `queue_id` | uuid | Fila de atendimento |
| `sector_id` | uuid | Setor responsável |
| `last_message` | text | Preview da última mensagem |
| `last_message_time` | timestamptz | Timestamp da última mensagem |
| `unread_count` | integer | Quantidade de mensagens não lidas |
| `tags` | text[] | Tags atribuídas |
| `is_online` | boolean | Se o contato está online |
| `is_typing` | boolean | Se o contato está digitando |
| `is_recording` | boolean | Se o contato está gravando áudio |
| `last_seen` | timestamptz | Último visto do contato |
| `opted_in` | boolean | Se aceitou receber mensagens |
| `ai_enabled` | boolean | Se IA está habilitada |
| `ai_mode` | text | Modo de IA (auto/suggestion/off) |
| `ai_messages_count` | integer | Contador de mensagens da IA |
| `ai_handoff_at` | timestamptz | Quando houve handoff para humano |
| `ai_handoff_reason` | text | Motivo do handoff |
| `ai_paused_at` | timestamptz | Quando IA foi pausada |
| `ai_paused_by` | uuid | Quem pausou a IA |
| `ai_paused_reason` | text | Motivo da pausa |
| `ai_summary` | text | Resumo gerado por IA |
| `ai_summary_updated_at` | timestamptz | Última atualização do resumo |
| `ai_next_step_suggestion` | text | Próximo passo sugerido por IA |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar conversas individuais com clientes, incluindo controle de IA e atribuição de responsáveis.

---

### `messages`
Mensagens individuais dentro das conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `conversation_id` | uuid | Conversa à qual pertence |
| `contact_id` | uuid | Contato que enviou/recebeu |
| `user_id` | uuid | Usuário que enviou (se outbound) |
| `external_id` | text | ID externo da Evolution API |
| `is_from_me` | boolean | Se foi enviada pelo sistema |
| `is_from_ai` | boolean | Se foi enviada pela IA |
| `content` | text | Conteúdo da mensagem |
| `media_url` | text | URL da mídia anexada |
| `media_type` | text | Tipo de mídia (image/video/audio/document) |
| `media_mime_type` | text | MIME type da mídia |
| `quoted_message_id` | uuid | Mensagem citada (reply) |
| `status` | text | Status (pending/sent/delivered/read/played/failed) |
| `sent_at` | timestamptz | Quando foi enviada |
| `delivered_at` | timestamptz | Quando foi entregue |
| `read_at` | timestamptz | Quando foi lida |
| `played_at` | timestamptz | Quando áudio/vídeo foi reproduzido |
| `metadata` | jsonb | Metadados adicionais |
| `deleted_for_everyone` | boolean | Se foi deletada para todos |
| `deleted_at` | timestamptz | Quando foi deletada |
| `ai_metadata` | jsonb | Metadados de IA (model, confidence, response_time_ms, sentiment, intent) |
| `timestamp` | timestamptz | Timestamp da mensagem |
| `created_at` | timestamptz | Data de criação no banco |

**Propósito:** Armazenar todas as mensagens trocadas com rastreamento de status e metadados de IA.

---

### `message_templates`
Templates de mensagens rápidas reutilizáveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `created_by` | uuid | Quem criou o template |
| `name` | text | Nome do template |
| `content` | text | Conteúdo com variáveis {{nome}}, {{empresa}} |
| `category` | text | Categoria (saudação/despedida/follow-up) |
| `usage_count` | integer | Quantas vezes foi usado |
| `is_favorite` | boolean | Se é favorito |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Respostas rápidas padronizadas com substituição de variáveis.

---

### `conversation_labels`
Relacionamento entre conversas e labels.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `conversation_id` | uuid | Conversa |
| `label_id` | uuid | Label aplicado |
| `created_at` | timestamptz | Data de aplicação |

**Propósito:** Organizar conversas com múltiplas labels para filtros e categorização.

---

### `labels`
Labels/etiquetas para organização de conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome da label |
| `color` | text | Cor (hex) |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Sistema de etiquetagem para organizar e filtrar conversas.

---

### `conversation_notes`
Notas internas sobre conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `conversation_id` | uuid | Conversa relacionada |
| `user_id` | uuid | Quem criou a nota |
| `content` | text | Conteúdo da nota |
| `note_type` | text | Tipo (general/important/follow_up) |
| `metadata` | jsonb | Metadados adicionais |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Anotações internas da equipe sobre conversas específicas.

---

### `queues`
Filas de atendimento para distribuição de conversas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome da fila |
| `description` | text | Descrição |
| `color` | text | Cor de identificação |
| `is_active` | boolean | Status ativo |
| `distribution_mode` | text | Modo de distribuição (round_robin/least_busy/manual) |
| `max_concurrent_chats` | integer | Limite de chats por agente |
| `priority` | integer | Prioridade da fila |
| `business_hours_only` | boolean | Só aceita em horário comercial |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Organizar distribuição automática de conversas entre agentes.

---

### `queue_members`
Membros atribuídos a cada fila.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `queue_id` | uuid | Fila |
| `member_id` | uuid | Membro da equipe |
| `is_active` | boolean | Status ativo na fila |
| `created_at` | timestamptz | Data de atribuição |

**Propósito:** Controlar quais agentes pertencem a quais filas.

---

### `sectors`
Setores/departamentos para organização.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do setor |
| `description` | text | Descrição |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Organizar conversas por departamentos (vendas, suporte, financeiro).

---

### `blocked_contacts`
Números bloqueados que não devem receber mensagens.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa que bloqueou |
| `user_id` | uuid | Quem bloqueou |
| `blocked_number` | text | Número bloqueado |
| `reason` | text | Motivo do bloqueio |
| `blocked_at` | timestamptz | Data do bloqueio |

**Propósito:** Prevenir envio de mensagens para números indesejados.

---

## 3. Contatos

### `contacts`
Cadastro central de contatos/leads.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `phone_number` | text | Número do WhatsApp (único por empresa) |
| `name` | text | Nome do contato |
| `push_name` | text | Nome no WhatsApp |
| `verified_name` | text | Nome verificado pelo WhatsApp Business |
| `profile_pic_url` | text | URL da foto de perfil |
| `profile_pic_cached_path` | text | Caminho local do cache |
| `profile_pic_updated_at` | timestamptz | Última atualização da foto |
| `about_status` | text | Status/bio do WhatsApp |
| `is_business` | boolean | Se é conta Business |
| `lead_score` | integer | Score de qualificação (0-100) |
| `score_breakdown` | jsonb | Detalhamento do score |
| `score_updated_at` | timestamptz | Última atualização do score |
| `linkedin_url` | text | URL do LinkedIn |
| `company_cnpj` | text | CNPJ da empresa do contato |
| `company_data` | jsonb | Dados da empresa enriquecidos |
| `enrichment_data` | jsonb | Dados de enriquecimento externo |
| `enrichment_status` | text | Status do enriquecimento (pending/enriched/failed) |
| `enriched_at` | timestamptz | Quando foi enriquecido |
| `ai_summary` | text | Resumo gerado por IA |
| `ai_tags` | text[] | Tags extraídas por IA |
| `ai_qualification_level` | text | Nível de qualificação (hot/warm/cold) |
| `ai_next_best_action` | text | Próxima ação sugerida por IA |
| `ai_last_analyzed_at` | timestamptz | Última análise de IA |
| `merged_into` | uuid | ID do contato para qual foi mesclado |
| `deleted_at` | timestamptz | Soft delete timestamp |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Base de dados central de contatos com enriquecimento e qualificação por IA.

---

### `contact_notes`
Notas sobre contatos específicos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `contact_id` | uuid | Contato relacionado |
| `user_id` | uuid | Quem criou a nota |
| `company_id` | uuid | Empresa proprietária |
| `note` | text | Conteúdo da nota |
| `is_pinned` | boolean | Se é fixada no topo |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Histórico de anotações sobre cada contato.

---

### `contact_duplicates`
Potenciais contatos duplicados detectados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `contact_id_1` | uuid | Primeiro contato |
| `contact_id_2` | uuid | Segundo contato |
| `similarity_score` | float | Score de similaridade (0-1) |
| `match_reason` | text | Motivo da detecção (same_phone/similar_name) |
| `status` | text | Status (pending/merged/ignored) |
| `merged_into` | uuid | ID do contato mantido após merge |
| `merged_by` | uuid | Quem fez o merge |
| `merged_at` | timestamptz | Data do merge |
| `created_at` | timestamptz | Data de detecção |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Detectar e resolver duplicatas de contatos.

---

### `segments`
Segmentos/grupos de contatos baseados em filtros.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do segmento |
| `description` | text | Descrição |
| `filter_rules` | jsonb | Regras de filtro (tags, score, etc) |
| `is_dynamic` | boolean | Se atualiza automaticamente |
| `contact_count` | integer | Quantidade de contatos |
| `created_by` | uuid | Quem criou |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Criar grupos dinâmicos de contatos para campanhas e análises.

---

## 4. CRM - Negócios e Pipeline

### `pipelines`
Pipelines de vendas customizáveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do pipeline |
| `description` | text | Descrição |
| `is_default` | boolean | Se é o pipeline padrão |
| `order_index` | integer | Ordem de exibição |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Organizar diferentes processos de venda (ex: Enterprise, SMB, Inbound).

---

### `pipeline_stages`
Etapas dentro de cada pipeline.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `pipeline_id` | uuid | Pipeline ao qual pertence |
| `name` | text | Nome da etapa |
| `color` | text | Cor (hex) |
| `order_index` | integer | Ordem sequencial |
| `probability_default` | integer | Probabilidade padrão (0-100%) |
| `is_closed_won` | boolean | Se é etapa de "ganho" |
| `is_closed_lost` | boolean | Se é etapa de "perdido" |
| `automation_rules` | jsonb | Regras de automação ao entrar nesta etapa |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Definir etapas do funil de vendas (Qualificação → Proposta → Negociação → Fechado).

---

### `deals`
Oportunidades de negócio no funil de vendas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `pipeline_id` | uuid | Pipeline ao qual pertence |
| `stage_id` | uuid | Etapa atual |
| `contact_id` | uuid | Contato relacionado |
| `assigned_to` | uuid | Responsável pelo negócio |
| `title` | text | Título do negócio |
| `value` | numeric | Valor estimado |
| `probability` | integer | Probabilidade de fechamento (0-100%) |
| `expected_close_date` | date | Data prevista de fechamento |
| `priority` | text | Prioridade (low/medium/high/urgent) |
| `status` | text | Status (open/won/lost) |
| `temperature` | text | Temperatura do lead (hot/warm/cold) |
| `temperature_score` | integer | Score numérico de temperatura |
| `products` | jsonb | Produtos de interesse |
| `custom_fields` | jsonb | Campos customizados |
| `budget_confirmed` | boolean | BANT: Budget confirmado |
| `timeline_confirmed` | boolean | BANT: Timeline confirmado |
| `decision_maker` | text | BANT: Tomador de decisão |
| `need_identified` | text | BANT: Necessidade identificada |
| `competitor` | text | Concorrente principal |
| `competitor_strengths` | text | Forças do concorrente |
| `our_differentials` | text | Nossos diferenciais |
| `next_step` | text | Próximo passo planejado |
| `next_step_date` | date | Data do próximo passo |
| `win_reason` | text | Motivo da vitória |
| `loss_reason` | text | Motivo da perda (Price/Competitor/Timing/Budget/NoResponse/Other) |
| `loss_reason_detail` | text | Detalhes da perda |
| `churn_risk_score` | integer | Score de risco de churn |
| `last_activity` | timestamptz | Última atividade registrada |
| `won_at` | timestamptz | Data de fechamento ganho |
| `lost_at` | timestamptz | Data de fechamento perdido |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar oportunidades de venda com qualificação BANT e acompanhamento completo.

---

### `deal_activities`
Histórico de atividades em cada negócio.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `deal_id` | uuid | Negócio relacionado |
| `user_id` | uuid | Quem realizou a atividade |
| `activity_type` | text | Tipo (stage_change/value_change/note_added/call_made/email_sent/meeting/proposal_sent) |
| `description` | text | Descrição da atividade |
| `metadata` | jsonb | Dados adicionais |
| `created_at` | timestamptz | Data da atividade |

**Propósito:** Timeline completo de todas interações e mudanças em um negócio.

---

## 5. Tarefas

### `tasks`
Tarefas e follow-ups relacionados a contatos e deals.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `assigned_to` | uuid | Responsável pela tarefa |
| `created_by` | uuid | Quem criou |
| `contact_id` | uuid | Contato relacionado |
| `deal_id` | uuid | Negócio relacionado |
| `title` | text | Título da tarefa |
| `description` | text | Descrição detalhada |
| `task_type` | text | Tipo (call/email/meeting/follow_up/proposal/other) |
| `priority` | text | Prioridade (low/medium/high/urgent) |
| `status` | text | Status (pending/completed/cancelled) |
| `due_date` | timestamptz | Data e hora de vencimento |
| `completed_at` | timestamptz | Data de conclusão |
| `reminder_sent` | boolean | Se lembrete foi enviado |
| `add_to_google_calendar` | boolean | Se deve sincronizar com Google Calendar |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Organizar follow-ups e ações pendentes com clientes.

---

### `calendar_sync`
Sincronização com Google Calendar.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `task_id` | uuid | Tarefa sincronizada |
| `user_id` | uuid | Usuário proprietário |
| `company_id` | uuid | Empresa |
| `google_event_id` | text | ID do evento no Google Calendar |
| `sync_direction` | text | Direção (bidirectional/to_calendar/from_calendar) |
| `last_synced_at` | timestamptz | Última sincronização |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Manter tarefas sincronizadas com Google Calendar.

---

## 6. Propostas Comerciais

### `proposals`
Propostas comerciais enviadas aos clientes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `deal_id` | uuid | Negócio relacionado |
| `created_by` | uuid | Quem criou |
| `title` | text | Título da proposta |
| `items` | jsonb | Array de itens/produtos |
| `subtotal` | numeric | Subtotal |
| `discount` | numeric | Desconto aplicado |
| `discount_type` | text | Tipo de desconto (percentage/fixed) |
| `tax` | numeric | Impostos |
| `total` | numeric | Valor total |
| `payment_terms` | text | Condições de pagamento |
| `validity_days` | integer | Validade em dias |
| `status` | text | Status (draft/sent/viewed/accepted/rejected/expired) |
| `public_link` | text | Link público único |
| `pdf_url` | text | URL do PDF gerado |
| `viewed_at` | timestamptz | Data de visualização pelo cliente |
| `accepted_at` | timestamptz | Data de aceitação |
| `rejected_at` | timestamptz | Data de rejeição |
| `rejection_reason` | text | Motivo da rejeição |
| `signature_data` | text | Dados da assinatura digital |
| `client_name` | text | Nome do cliente que assinou |
| `client_document` | text | Documento do cliente |
| `version` | integer | Versão da proposta |
| `parent_proposal_id` | uuid | Proposta original (para versões) |
| `change_notes` | text | Notas sobre mudanças na versão |
| `notes` | text | Observações internas |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Criar, enviar e rastrear propostas comerciais com assinatura digital.

---

### `proposal_templates`
Templates reutilizáveis de propostas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do template |
| `description` | text | Descrição |
| `content` | jsonb | Estrutura de seções |
| `thumbnail` | text | URL da miniatura |
| `category` | text | Categoria |
| `usage_count` | integer | Vezes usado |
| `created_by` | uuid | Quem criou |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Padronizar criação de propostas com estrutura reutilizável.

---

### `proposal_views`
Rastreamento de visualizações de propostas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `proposal_id` | uuid | Proposta visualizada |
| `viewer_ip` | text | IP do visualizador |
| `viewer_user_agent` | text | User agent |
| `duration_seconds` | integer | Tempo de visualização |
| `viewed_at` | timestamptz | Data da visualização |

**Propósito:** Analytics de engajamento com propostas enviadas.

---

## 7. Produtos

### `products`
Catálogo de produtos/serviços.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do produto |
| `description` | text | Descrição |
| `sku` | text | Código SKU |
| `price` | numeric | Preço de venda |
| `cost` | numeric | Custo |
| `category` | text | Categoria |
| `images` | text[] | URLs das imagens |
| `is_active` | boolean | Status ativo |
| `metadata` | jsonb | Dados adicionais |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar catálogo de produtos para uso em propostas e deals.

---

## 8. Campanhas em Massa

### `campaigns`
Campanhas de envio em massa de mensagens.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `created_by` | uuid | Quem criou |
| `instance_id` | uuid | Instância WhatsApp a usar |
| `name` | text | Nome da campanha |
| `description` | text | Descrição |
| `message_content` | text | Conteúdo da mensagem |
| `message_media_url` | text | URL de mídia anexada |
| `message_type` | text | Tipo (text/image/video/document) |
| `segment_id` | uuid | Segmento alvo |
| `contact_filter` | jsonb | Filtros adicionais |
| `status` | text | Status (draft/scheduled/running/completed/paused/cancelled) |
| `schedule_at` | timestamptz | Agendamento |
| `business_hours_only` | boolean | Enviar apenas em horário comercial |
| `business_hours_start` | time | Início do horário |
| `business_hours_end` | time | Fim do horário |
| `sending_rate` | integer | Taxa de envio (msgs/min) |
| `total_contacts` | integer | Total de contatos |
| `sent_count` | integer | Quantidade enviada |
| `delivered_count` | integer | Quantidade entregue |
| `read_count` | integer | Quantidade lida |
| `failed_count` | integer | Quantidade falhada |
| `reply_count` | integer | Quantidade de respostas |
| `started_at` | timestamptz | Data de início |
| `completed_at` | timestamptz | Data de conclusão |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Enviar mensagens em massa com controle de taxa e horário comercial.

---

### `campaign_contacts`
Status de envio individual por contato.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `campaign_id` | uuid | Campanha relacionada |
| `contact_id` | uuid | Contato destinatário |
| `status` | text | Status (pending/sent/delivered/read/failed/replied) |
| `sent_at` | timestamptz | Data de envio |
| `delivered_at` | timestamptz | Data de entrega |
| `read_at` | timestamptz | Data de leitura |
| `replied_at` | timestamptz | Data de resposta |
| `reply_message` | text | Conteúdo da resposta |
| `error_message` | text | Mensagem de erro (se falhou) |

**Propósito:** Rastreamento detalhado de cada envio da campanha.

---

## 9. Automações e Playbooks

### `playbooks`
Automações/workflows configuráveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do playbook |
| `description` | text | Descrição |
| `trigger_type` | text | Gatilho (manual/stage_change/time_based/behavior/keyword) |
| `trigger_config` | jsonb | Configuração do gatilho |
| `steps` | jsonb | Array de passos da automação |
| `is_active` | boolean | Se está ativo |
| `usage_count` | integer | Vezes executado |
| `success_rate` | numeric | Taxa de sucesso |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Criar workflows automatizados visuais (enviar mensagem → esperar 2 dias → criar tarefa).

---

### `playbook_executions`
Histórico de execuções de playbooks.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `playbook_id` | uuid | Playbook executado |
| `deal_id` | uuid | Negócio relacionado |
| `conversation_id` | uuid | Conversa relacionada |
| `triggered_by` | uuid | Quem disparou |
| `status` | text | Status (running/completed/failed/paused) |
| `current_step` | integer | Passo atual |
| `steps_log` | jsonb | Log de cada passo |
| `started_at` | timestamptz | Início da execução |
| `completed_at` | timestamptz | Fim da execução |

**Propósito:** Rastrear e debugar execuções de automações.

---

## 10. Inteligência Artificial

### `ai_settings`
Configurações de IA por empresa.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `is_enabled` | boolean | IA habilitada |
| `default_mode` | text | Modo padrão (auto/suggestion/off) |
| `language` | text | Idioma (pt-BR) |
| `personality` | text | Personalidade (professional/friendly/technical) |
| `system_prompt` | text | Prompt customizado do sistema |
| `greeting_message` | text | Mensagem de saudação |
| `fallback_message` | text | Mensagem fora de horário |
| `response_delay_ms` | integer | Delay para simular digitação humana |
| `typing_indicator` | boolean | Mostrar indicador de digitação |
| `max_messages_before_handoff` | integer | Limite antes de transferir |
| `max_response_length` | integer | Tamanho máximo da resposta |
| `handoff_keywords` | text[] | Palavras-chave para handoff |
| `handoff_message` | text | Mensagem de transferência |
| `handoff_on_negative_sentiment` | boolean | Handoff em sentimento negativo |
| `handoff_on_high_value` | boolean | Handoff em valor alto |
| `high_value_threshold` | numeric | Limite de valor alto |
| `active_hours_start` | time | Início do horário ativo |
| `active_hours_end` | time | Fim do horário ativo |
| `active_on_weekends` | boolean | Ativo aos finais de semana |
| `n8n_webhook_url` | text | URL do webhook N8N |
| `n8n_api_key` | text | API key do N8N |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Controlar comportamento completo da IA por empresa.

---

### `ai_suggestions`
Sugestões de resposta geradas pela IA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `conversation_id` | uuid | Conversa relacionada |
| `contact_id` | uuid | Contato relacionado |
| `trigger_message_id` | uuid | Mensagem que gerou sugestão |
| `suggestion_type` | text | Tipo (response/question/objection_handler/product_recommendation) |
| `title` | text | Título da sugestão |
| `content` | text | Conteúdo sugerido |
| `confidence` | numeric | Confiança (0-1) |
| `priority` | text | Prioridade (high/medium/low) |
| `status` | text | Status (pending/used/dismissed/expired) |
| `used_at` | timestamptz | Quando foi usada |
| `used_by` | uuid | Quem usou |
| `dismissed_reason` | text | Motivo de descarte |
| `related_product_id` | uuid | Produto relacionado |
| `expires_at` | timestamptz | Expiração |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Armazenar sugestões de IA para modo copiloto.

---

### `ai_insights`
Insights de negócio gerados pela IA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `insight_type` | text | Tipo (deal_at_risk/upsell_opportunity/follow_up_needed/trend_detected) |
| `title` | text | Título do insight |
| `description` | text | Descrição |
| `data` | jsonb | Dados contextuais |
| `priority` | text | Prioridade (high/medium/low) |
| `is_actionable` | boolean | Se requer ação |
| `action_type` | text | Ação sugerida (create_task/send_message/move_deal) |
| `action_data` | jsonb | Dados para executar ação |
| `is_read` | boolean | Se foi lido |
| `expires_at` | timestamptz | Expiração |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Alertas inteligentes sobre oportunidades e riscos.

---

### `lead_insights`
Insights extraídos das conversas sobre leads.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `contact_id` | uuid | Contato relacionado |
| `conversation_id` | uuid | Conversa relacionada |
| `insight_type` | text | Tipo (product_interest/objection/sentiment_change/intent_detected/budget_mentioned/competitor_mentioned/urgency_detected/decision_maker) |
| `content` | text | Conteúdo do insight |
| `confidence` | numeric | Confiança (0-1) |
| `source` | text | Fonte (ai/manual/integration) |
| `metadata` | jsonb | Dados adicionais |
| `expires_at` | timestamptz | Expiração |
| `created_at` | timestamptz | Data de extração |

**Propósito:** Extrair inteligência de vendas das conversas automaticamente.

---

### `lead_qualification`
Qualificação BANT dos leads.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `contact_id` | uuid | Contato qualificado |
| `budget_score` | integer | Score de Budget (0-25) |
| `authority_score` | integer | Score de Authority (0-25) |
| `need_score` | integer | Score de Need (0-25) |
| `timing_score` | integer | Score de Timing (0-25) |
| `total_score` | integer | Score total (0-100) |
| `classification` | text | Classificação (hot/warm/cool/cold) |
| `communication_style` | text | Estilo (direct/detailed/emotional/analytical) |
| `price_sensitivity` | text | Sensibilidade (low/medium/high) |
| `decision_speed` | text | Velocidade (fast/medium/slow) |
| `preferred_channel` | text | Canal preferido |
| `best_contact_times` | text[] | Melhores horários |
| `updated_at` | timestamptz | Última atualização |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Qualificação automática de leads com framework BANT.

---

### `ai_metrics_daily`
Métricas diárias de performance da IA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `metric_date` | date | Data das métricas |
| `conversations_handled` | integer | Conversas atendidas |
| `messages_sent` | integer | Mensagens enviadas |
| `messages_received` | integer | Mensagens recebidas |
| `avg_response_time_ms` | integer | Tempo médio de resposta |
| `avg_confidence` | numeric | Confiança média |
| `handoffs_total` | integer | Total de handoffs |
| `handoffs_requested` | integer | Handoffs solicitados |
| `handoffs_automatic` | integer | Handoffs automáticos |
| `handoffs_sentiment` | integer | Handoffs por sentimento |
| `resolved_without_human` | integer | Resolvidos sem humano |
| `resolved_with_human` | integer | Resolvidos com humano |
| `sentiment_positive` | integer | Sentimentos positivos |
| `sentiment_neutral` | integer | Sentimentos neutros |
| `sentiment_negative` | integer | Sentimentos negativos |
| `intents_detected` | jsonb | Intenções detectadas |
| `leads_qualified` | integer | Leads qualificados |
| `deals_created` | integer | Negócios criados |
| `created_at` | timestamptz | Data de agregação |

**Propósito:** Monitorar performance e eficácia da IA.

---

### `conversation_embeddings`
Embeddings vetoriais para busca semântica.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `conversation_id` | uuid | Conversa relacionada |
| `content` | text | Texto usado para embedding |
| `embedding` | vector | Vetor de embedding |
| `metadata` | jsonb | Metadados |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Busca semântica de conversas similares (RAG).

---

## 11. Gamificação

### `goals`
Metas de vendas individuais.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `user_id` | uuid | Usuário da meta |
| `goal_type` | text | Tipo (revenue/deals/calls/meetings/response_time) |
| `target_value` | numeric | Valor alvo |
| `current_value` | numeric | Valor atual |
| `period` | text | Período (daily/weekly/monthly/quarterly/yearly) |
| `start_date` | date | Data de início |
| `end_date` | date | Data de fim |
| `status` | text | Status (active/completed/failed) |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Definir e acompanhar metas de vendas individuais.

---

### `achievements`
Conquistas desbloqueáveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome da conquista |
| `description` | text | Descrição |
| `icon` | text | Emoji/ícone |
| `criteria` | jsonb | Critérios para desbloquear |
| `points` | integer | Pontos concedidos |
| `badge_url` | text | URL do badge |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Sistema de conquistas para engajamento da equipe.

---

### `user_achievements`
Conquistas desbloqueadas por cada usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Usuário |
| `achievement_id` | uuid | Conquista desbloqueada |
| `earned_at` | timestamptz | Data do desbloqueio |

**Propósito:** Rastrear quais conquistas cada usuário já ganhou.

---

### `leaderboard_snapshots`
Snapshots do ranking para histórico.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `period` | text | Período (week/month/quarter) |
| `snapshot_date` | date | Data do snapshot |
| `rankings` | jsonb | Dados do ranking |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Preservar rankings históricos para análise.

---

### `sales_goals`
Metas de vendas com tracking detalhado.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `member_id` | uuid | Membro da equipe |
| `team_id` | uuid | Time (opcional) |
| `goal_type` | text | Tipo (revenue/deals_count/calls/meetings) |
| `target_value` | numeric | Valor alvo |
| `current_value` | numeric | Valor atual |
| `period_start` | date | Início do período |
| `period_end` | date | Fim do período |
| `status` | text | Status (active/completed/failed) |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Metas de vendas com tracking automático.

---

### `member_metrics_daily`
Métricas agregadas diárias por vendedor.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `member_id` | uuid | Membro da equipe |
| `metric_date` | date | Data das métricas |
| `conversations_assigned` | integer | Conversas atribuídas |
| `conversations_resolved` | integer | Conversas resolvidas |
| `messages_sent` | integer | Mensagens enviadas |
| `avg_first_response_time_seconds` | integer | Tempo de primeira resposta |
| `avg_response_time_seconds` | integer | Tempo médio de resposta |
| `deals_created` | integer | Negócios criados |
| `deals_won` | integer | Negócios ganhos |
| `deals_lost` | integer | Negócios perdidos |
| `deals_won_value` | numeric | Valor ganho |
| `deals_lost_value` | numeric | Valor perdido |
| `csat_responses` | integer | Respostas CSAT |
| `csat_sum` | integer | Soma CSAT |
| `nps_promoters` | integer | Promotores NPS |
| `nps_passives` | integer | Passivos NPS |
| `nps_detractors` | integer | Detratores NPS |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Agregar métricas diárias para dashboards de performance.

---

## 12. Notificações

### `notifications`
Notificações in-app para usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Usuário destinatário |
| `company_id` | uuid | Empresa |
| `title` | text | Título da notificação |
| `message` | text | Mensagem |
| `type` | text | Tipo (info/success/warning/error/mention/deal/task/message) |
| `entity_type` | text | Tipo de entidade relacionada |
| `entity_id` | uuid | ID da entidade |
| `action_url` | text | URL para ação |
| `metadata` | jsonb | Dados adicionais |
| `is_read` | boolean | Se foi lida |
| `read_at` | timestamptz | Data de leitura |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Sistema de notificações em tempo real para eventos importantes.

---

### `satisfaction_surveys`
Pesquisas de satisfação CSAT/NPS.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `conversation_id` | uuid | Conversa relacionada |
| `contact_id` | uuid | Contato avaliado |
| `agent_id` | uuid | Agente avaliado |
| `company_id` | uuid | Empresa |
| `survey_type` | text | Tipo (csat/nps) |
| `score` | integer | Score (1-5 para CSAT, 0-10 para NPS) |
| `feedback` | text | Feedback textual |
| `status` | text | Status (sent/answered/expired) |
| `sent_at` | timestamptz | Data de envio |
| `answered_at` | timestamptz | Data de resposta |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Coletar e rastrear satisfação do cliente pós-atendimento.

---

### `satisfaction_settings`
Configurações de pesquisas de satisfação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `enabled` | boolean | Se está habilitado |
| `survey_type` | text | Tipo (csat/nps) |
| `auto_send` | boolean | Enviar automaticamente |
| `delay_minutes` | integer | Delay após fechamento |
| `message_template` | text | Template da mensagem |
| `follow_up_on_low_score` | boolean | Follow-up em score baixo |
| `low_score_threshold` | integer | Limite de score baixo |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Configurar envio automático de pesquisas CSAT/NPS.

---

## 13. Integrações

### `evolution_settings`
Configurações da instância Evolution API (WhatsApp).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `instance_name` | text | Nome da instância |
| `instance_status` | text | Status (connected/disconnected/connecting/qr_code) |
| `qr_code` | text | QR Code base64 para conexão |
| `is_connected` | boolean | Se está conectado |
| `phone_number` | text | Número conectado |
| `messages_sent_today` | integer | Mensagens enviadas hoje |
| `daily_message_limit` | integer | Limite diário |
| `delivery_rate` | numeric | Taxa de entrega (%) |
| `response_rate` | numeric | Taxa de resposta (%) |
| `last_reset_date` | date | Última redefinição de contadores |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar conexões WhatsApp via Evolution API com health monitoring.

---

### `n8n_webhooks`
Webhooks configurados para N8N.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do webhook |
| `webhook_url` | text | URL do webhook N8N |
| `workflow_type` | text | Tipo de workflow |
| `is_active` | boolean | Status ativo |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Integração com workflows N8N externos.

---

### `email_logs`
Log de emails enviados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `contact_id` | uuid | Contato destinatário |
| `deal_id` | uuid | Negócio relacionado |
| `sent_by` | uuid | Quem enviou |
| `recipient` | text | Email destinatário |
| `subject` | text | Assunto |
| `body` | text | Corpo do email |
| `status` | text | Status (sent/delivered/opened/clicked/bounced/failed) |
| `opened_at` | timestamptz | Data de abertura |
| `clicked_at` | timestamptz | Data de clique |
| `metadata` | jsonb | Metadados adicionais |
| `sent_at` | timestamptz | Data de envio |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Rastrear emails enviados diretamente do CRM.

---

### `email_templates`
Templates de emails reutilizáveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `name` | text | Nome do template |
| `subject` | text | Assunto |
| `body` | text | Corpo HTML |
| `variables` | text[] | Variáveis disponíveis |
| `category` | text | Categoria |
| `created_by` | uuid | Quem criou |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Templates de email com substituição de variáveis.

---

## 14. Segurança e Auditoria

### `access_audit_log`
Log de auditoria de acessos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | Usuário que fez a ação |
| `company_id` | uuid | Empresa |
| `action` | text | Ação realizada |
| `table_name` | text | Tabela afetada |
| `record_id` | uuid | ID do registro |
| `status` | text | Status (authorized/unauthorized) |
| `error_message` | text | Mensagem de erro |
| `ip_address` | text | IP de origem |
| `user_agent` | text | User agent |
| `metadata` | jsonb | Dados adicionais |
| `created_at` | timestamptz | Data da ação |

**Propósito:** Auditoria completa de acessos e modificações para segurança.

---

### `security_alerts`
Alertas de segurança gerados automaticamente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `alert_type` | text | Tipo (suspicious_activity/unauthorized_access/data_breach) |
| `severity` | text | Severidade (low/medium/high/critical) |
| `user_id` | uuid | Usuário relacionado |
| `description` | text | Descrição do alerta |
| `metadata` | jsonb | Dados contextuais |
| `is_resolved` | boolean | Se foi resolvido |
| `resolved_at` | timestamptz | Data de resolução |
| `created_at` | timestamptz | Data do alerta |

**Propósito:** Monitorar e alertar sobre atividades suspeitas.

---

### `custom_fields`
Definições de campos customizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa proprietária |
| `entity_type` | text | Entidade (contact/deal/company) |
| `field_name` | text | Nome do campo |
| `field_label` | text | Label de exibição |
| `field_type` | text | Tipo (text/number/date/select/multiselect/boolean/url/email/phone) |
| `options` | jsonb | Opções (para select) |
| `is_required` | boolean | Se é obrigatório |
| `is_active` | boolean | Status ativo |
| `default_value` | text | Valor padrão |
| `display_order` | integer | Ordem de exibição |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Permitir campos customizados por empresa para flexibilidade.

---

### `custom_field_values`
Valores dos campos customizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `custom_field_id` | uuid | Campo customizado |
| `entity_id` | uuid | ID da entidade (contato/deal/empresa) |
| `value` | text | Valor do campo |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Armazenar valores de campos customizados para cada registro.

---

### `role_permissions`
Permissões padrão por role.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `role` | user_role | Papel (owner/admin/manager/supervisor/seller/viewer) |
| `permission_key` | text | Chave da permissão |
| `is_granted` | boolean | Se está concedida |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Definir permissões padrão para cada tipo de usuário.

---

### `member_permissions`
Permissões customizadas por membro (overrides).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `member_id` | uuid | Membro da equipe |
| `permission_key` | text | Chave da permissão |
| `is_granted` | boolean | Se está concedida |
| `granted_by` | uuid | Quem concedeu |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Permissões específicas que sobrescrevem as padrões do role.

---

### `platform_features`
Features globais da plataforma.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `feature_key` | text | Chave da feature |
| `name` | text | Nome da feature |
| `description` | text | Descrição |
| `is_enabled_globally` | boolean | Se está habilitado globalmente |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Controlar features disponíveis na plataforma (super admin).

---

### `plan_features`
Features incluídas em cada plano.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `plan_name` | text | Nome do plano |
| `feature_key` | text | Chave da feature |
| `is_included` | boolean | Se está incluído no plano |
| `created_at` | timestamptz | Data de criação |

**Propósito:** Configurar quais features cada plano de assinatura inclui.

---

### `user_subscriptions`
Assinaturas/planos dos usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `company_id` | uuid | Empresa |
| `plan_name` | text | Plano contratado |
| `status` | text | Status (active/cancelled/expired) |
| `stripe_subscription_id` | text | ID no Stripe |
| `stripe_customer_id` | text | Customer ID no Stripe |
| `current_period_start` | timestamptz | Início do período |
| `current_period_end` | timestamptz | Fim do período |
| `cancel_at_period_end` | boolean | Se cancela no fim do período |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização |

**Propósito:** Gerenciar assinaturas e pagamentos via Stripe.

---

### `activity_logs`
Log de atividades do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `member_id` | uuid | Membro que fez a ação |
| `activity_type` | text | Tipo de atividade |
| `entity_type` | text | Tipo de entidade afetada |
| `entity_id` | uuid | ID da entidade |
| `description` | text | Descrição da atividade |
| `metadata` | jsonb | Dados adicionais |
| `created_at` | timestamptz | Data da atividade |

**Propósito:** Histórico de ações dos usuários para auditoria e análise.

---

## 🔐 Permissões e RLS

Todas as tabelas implementam **Row Level Security (RLS)** para garantir isolamento multi-tenant:

- Usuários só podem acessar dados da(s) empresa(s) às quais pertencem
- Verificação via `company_id` em todas as queries
- Funções SQL auxiliares: `get_user_company()`, `user_has_access_to_company()`, `check_permission()`

## 🔄 Triggers e Automações

O sistema possui diversos triggers PostgreSQL para automação:

1. **`create_default_pipeline_for_company`** - Cria pipeline padrão ao criar empresa
2. **`sync_company_user_to_member`** - Sincroniza company_users com company_members
3. **`update_goals_on_deal_won`** - Atualiza metas ao ganhar negócio
4. **`notify_deal_moved`** - Notifica mudanças de etapa
5. **`notify_new_message`** - Notifica novas mensagens
6. **`trigger_playbooks_on_stage_change`** - Dispara playbooks em mudanças de etapa
7. **`auto_send_satisfaction_survey`** - Envia pesquisas de satisfação automaticamente
8. **`auto_update_lead_score_from_message`** - Recalcula lead score em novas mensagens
9. **`auto_update_lead_score_from_deal`** - Recalcula lead score em mudanças de deals

## 📊 Agregações e Métricas

Tabelas de agregação diária para performance:

- `member_metrics_daily` - Métricas por vendedor
- `ai_metrics_daily` - Métricas de IA
- `leaderboard_snapshots` - Snapshots de rankings

---

**Última atualização:** 27/11/2024  
**Total de tabelas:** 80+  
**Sistema:** CRM Multi-tenant com WhatsApp e IA
