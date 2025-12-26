# Catálogo Mestre de Funcionalidades do Sistema

Este documento lista todas as funcionalidades (Feature Flags) disponíveis no sistema MelonChat.

As funcionalidades são controladas via tabela `platform_features` e associadas a planos via `plan_features`.

## 📦 Funcionalidades por Categoria

### 💬 Chat & Atendimento
| Chave (Key) | Nome | Descrição |
|---|---|---|
| `chat` | Chat Multi-canal | Acesso à interface principal de chat e conversas. |
| `quick_replies` | Respostas Rápidas | Criação e uso de modelos de mensagens pré-definidas. |
| `queues` | Filas de Atendimento | Gestão de filas, departamentos e distribuição de chats. |
| `contacts` | Gestão de Contatos | Agenda de contatos, histórico e detalhes do cliente. |
| `groups` | Grupos | Funcionalidades para gestão de grupos (WhatsApp). |

### 🚀 CRM & Vendas
| Chave (Key) | Nome | Descrição |
|---|---|---|
| `deals_pipeline` | Pipeline de Vendas | Kanban de oportunidades e gestão de funil de vendas. |
| `proposals` | Gerador de Propostas | Criação, envio e rastreio de propostas comerciais. |
| `products` | Catálogo de Produtos | Gestão de produtos e serviços para uso em propostas. |
| `reports_sales` | Dashboard de Vendas | Relatórios e KPIs específicos de vendas e CRM. |
| `campaigns` | Campanhas | Disparos em massa e gestão de campanhas de marketing. |
| `segments` | Segmentação | Criação de segmentos de clientes baseados em critérios. |
| `cadences` | Cadências | Sequências de prospecção e follow-up automatizadas. |
| `orders` | Pedidos | Gestão de pedidos de venda. |

### 🤖 Automação & IA
| Chave (Key) | Nome | Descrição |
|---|---|---|
| `ai_assistant` | Assistente IA | IA integrada para sugestão de respostas e resumo. |
| `chatbot` | Fluxos de Chatbot | Construtor de fluxos de automação de conversa. |
| `chatbots` | Gestão de Bots | Interface avançada de gestão de múltiplos bots. |
| `automation` | Automações (Workflow) | Gatilhos e ações automatizadas do sistema. |
| `workflows` | Workflows Avançados | Editor visual de processos de negócio. |

### 📊 Relatórios & Analytics
| Chave (Key) | Nome | Descrição |
|---|---|---|
| `reports_basic` | Relatórios Básicos | Métricas fundamentais de atendimento. |
| `reports_advanced` | Analytics Avançado | BI completo e relatórios personalizados. |
| `team_performance` | Performance de Equipe | Métricas individuais por atendente. |

### ⚙️ Sistema & Configurações
| Chave (Key) | Nome | Descrição |
|---|---|---|
| `custom_fields` | Campos Personalizados | Criação de campos extras para contatos e negócios. |
| `webhooks` | Webhooks | Integração via webhooks para eventos do sistema. |
| `api_public` | API Pública | Acesso à API para integrações externas. |
| `integrations` | Hub de Integrações | Conectores nativos (RD Station, HubSpot, etc). |
| `security` | Segurança Avançada | Logs de auditoria, restrição de IP, MFA. |
| `multi_company` | Multi-empresa | Gestão de múltiplas filiais ou workspaces. |
| `white_label` | White Label | Personalização total da marca (cores, logo, domínio). |
| `documents` | Gestão de Documentos | Armazenamento e compartilhamento de arquivos. |
| `knowledge_base` | Base de Conhecimento | Central de ajuda interna ou pública. |
| `channels` | Canais Adicionais | Integração com Instagram, Facebook, Email, etc. |
| `gamification` | Gamificação | Sistema de conquistas e ranking para equipe. |
| `duplicates` | Gestão de Duplicatas | Identificação e fusão de contatos duplicados. |
| `faq` | FAQ do Sistema | Perguntas frequentes para suporte ao usuário. |

## 🛠 Como usar

Para verificar se uma funcionalidade está habilitada no frontend:

```typescript
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

const { isFeatureEnabled } = useFeatureFlags();

if (isFeatureEnabled("chat")) {
  // Renderizar componente de chat
}
```

Para habilitar uma funcionalidade para um plano, insira um registro na tabela `plan_features`.
