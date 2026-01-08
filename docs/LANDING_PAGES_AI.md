# Sistema de Landing Pages com IA

## 📋 Visão Geral

Sistema completo para criação de landing pages usando Inteligência Artificial. Cada empresa pode configurar suas próprias chaves de API para os provedores de IA (Claude, OpenAI, Gemini) e criar landing pages profissionais com apenas um prompt.

## 🚀 Funcionalidades

### ✨ Principais Recursos

- **Geração com IA**: Crie landing pages completas descrevendo o que você precisa
- **Múltiplos Provedores**: Suporte para Claude (Anthropic), GPT (OpenAI) e Gemini (Google)
- **Templates Base**: Comece com templates prontos e personalize
- **Editor Visual**: (Em desenvolvimento) Edite blocos e seções visualmente
- **Formulários**: Capture leads e integre com o CRM
- **Analytics**: Acompanhe visualizações, conversões e taxa de conversão
- **SEO Otimizado**: Meta tags, título e descrição configuráveis
- **Responsivo**: Landing pages otimizadas para mobile

### 🎯 Casos de Uso

- Páginas de captura de leads
- Páginas de venda de produtos/serviços
- Páginas de eventos e webinars
- Thank you pages
- Páginas de contato

## 📦 Instalação

As dependências já foram instaladas:

```bash
npm install @anthropic-ai/sdk openai @google/generative-ai
```

## ⚙️ Configuração

### 1. Configurar Chaves de IA

1. Acesse: **Marketing > Converter > Landing Pages**
2. Clique em **"Configurar IA"**
3. Adicione suas chaves de API para cada provedor desejado:

#### **Claude (Anthropic)**
- Acesse: https://console.anthropic.com/
- Gere uma API Key
- Escolha o modelo: `claude-3-5-sonnet-20241022` (recomendado)

#### **OpenAI (GPT)**
- Acesse: https://platform.openai.com/api-keys
- Gere uma API Key
- Escolha o modelo: `gpt-4-turbo-preview` ou `gpt-3.5-turbo`

#### **Google Gemini**
- Acesse: https://makersuite.google.com/app/apikey
- Gere uma API Key
- Escolha o modelo: `gemini-pro`

### 2. Banco de Dados

As tabelas foram criadas automaticamente com a migração:

```sql
-- Principais tabelas criadas:
- ai_provider_keys          -- Chaves de API por empresa
- landing_pages             -- Landing pages criadas
- landing_page_templates    -- Templates base
- landing_page_submissions  -- Submissões de formulários
- landing_page_analytics    -- Analytics de visualizações
- landing_page_ai_generations -- Histórico de gerações com IA
```

## 🎨 Como Usar

### Criar Landing Page com IA

1. Acesse: **Marketing > Converter > Landing Pages**
2. Clique em **"Nova Landing Page"**
3. Escolha a aba **"Gerar com IA"**
4. Escreva um prompt detalhado:

```
Crie uma landing page para um curso online de marketing digital.

Estrutura:
- Hero section com título impactante e CTA
- Seção de benefícios (3-4 itens)
- Depoimentos de alunos
- Tabela de preços (3 planos)
- Formulário de inscrição

Estilo:
- Cores: azul (#2563eb) e laranja (#f97316)
- Design moderno e minimalista
- Fontes: Inter para títulos, Open Sans para texto

Conteúdo:
- Público-alvo: profissionais que querem mudar de carreira
- Diferencial: metodologia prática com projetos reais
```

5. Preencha nome e slug
6. Clique em **"Gerar Landing Page"**
7. Aguarde a IA gerar (15-30 segundos)
8. Visualize e edite conforme necessário
9. Publique!

### Criar a partir de Template

1. Escolha a aba **"Usar Template"**
2. Selecione um template base
3. Preencha as informações
4. Clique em **"Criar a partir do Template"**

## 📊 Analytics e Métricas

Cada landing page rastreia automaticamente:

- **Visualizações**: Quantas pessoas acessaram
- **Conversões**: Quantos formulários foram enviados
- **Taxa de Conversão**: Porcentagem de visitantes que converteram
- **UTM Tracking**: Rastreamento de origem do tráfego

## 🔒 Segurança

- **RLS (Row Level Security)**: Cada empresa só vê suas próprias landing pages
- **Chaves Criptografadas**: As chaves de API são armazenadas de forma segura
- **Isolamento**: Dados isolados por empresa

## 💰 Custos

Os custos são por conta de cada empresa, usando suas próprias chaves de API:

- **Claude**: ~$0.003 por 1K tokens (±$0.01-0.05 por landing page)
- **GPT-4**: ~$0.03 por 1K tokens (±$0.10-0.30 por landing page)
- **GPT-3.5**: ~$0.002 por 1K tokens (±$0.01-0.05 por landing page)
- **Gemini**: ~$0.0005 por 1K tokens (±$0.005-0.02 por landing page)

## 📁 Estrutura de Arquivos

```
src/
├── pages/
│   ├── marketing/
│   │   ├── LandingPages.tsx          # Lista de landing pages
│   │   ├── CreateLandingPage.tsx     # Criar nova landing page
│   │   └── AIProviderSettings.tsx    # Configurar chaves de IA
│   └── api/
│       └── marketing/
│           └── landing-pages/
│               └── generate.ts        # API de geração com IA

supabase/
└── migrations/
    └── 20260104000001_create_landing_pages_system.sql
```

## 🛠️ Próximos Passos

Funcionalidades planejadas:

- [ ] Editor visual de blocos
- [ ] Mais templates prontos
- [ ] Integração com Canva
- [ ] A/B Testing
- [ ] Domínios personalizados
- [ ] Análise de heatmap
- [ ] Exportar HTML/CSS
- [ ] Biblioteca de componentes

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique se as chaves de API estão configuradas corretamente
2. Confirme que o provedor de IA está ativo
3. Verifique os logs em `landing_page_ai_generations` para erros de geração

## 🎉 Pronto!

Seu sistema de Landing Pages com IA está pronto para uso!

Acesse: **http://192.168.0.101:8080/marketing** → **Converter** → **Landing Pages**
