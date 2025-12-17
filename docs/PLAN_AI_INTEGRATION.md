# 🤖 Plano de Integração de IA & Base de Conhecimento

Este documento detalha o plano de implementação e verificação do sistema de IA (RAG) e Base de Conhecimento do MelonChat.

## 🎯 Objetivo
Habilitar o **Assistente de IA** para responder perguntas dos usuários com base nos documentos da empresa (PDFs, Manuais, Políticas), utilizando técnica de **RAG (Retrieval Augmented Generation)**.

## 🏗 Arquitetura

### 1. Banco de Dados (Supabase)
*   **`vector` extension**: Necessária para busca semântica.
*   **`kb_documents`**: Armazena os documentos originais (título, conteúdo, fonte).
*   **`kb_chunks`**: Armazena fragmentos do documento e seus vetores (`embedding vector(1536)`).
*   **`faq_categories`**: Organização de documentos.

### 2. Edge Functions
*   **`kb-ingest-document`**:
    1.  Recebe texto/arquivo.
    2.  Quebra em chunks (~1000 tokens/caracteres).
    3.  Gera embeddings usando OpenAI (`text-embedding-3-small` ou similar).
    4.  Salva em `kb_chunks`.
*   **`kb-semantic-search`** (ou `kb-generate-answer`):
    1.  Recebe a pergunta do usuário.
    2.  Gera embedding da pergunta.
    3.  Faz busca por similaridade de cosseno no banco (`kb_chunks`).
    4.  Usa os chunks encontrados como contexto para o GPT-4o gerar a resposta.

### 3. Frontend (`/knowledge-base`)
*   Interface para upload e gestão de documentos.
*   "Playground" para testar a busca semântica.

## 📋 Checklist de Validação

### ✅ Fase 1: Fundação de Dados (Migration)
- [x] Migration `20251217000013_verify_knowledge_base.sql` criada.
- [ ] Aplicar migration no Supabase: `npx supabase db push`.
- [ ] Verificar se extensão `vector` foi habilitada.

### 🚀 Fase 2: Edge Functions
- [ ] Verificar se variáveis de ambiente estão configuradas no Supabase Dashboard:
    - `OPENAI_API_KEY`: Chave da OpenAI.
- [ ] Deploy das funções:
    ```bash
    npx supabase functions deploy kb-ingest-document
    npx supabase functions deploy kb-generate-answer
    npx supabase functions deploy kb-semantic-search
    ```

### 🖥 Fase 3: Frontend
- [ ] Habilitar feature `knowledge_base` no plano da empresa (já habilitado no Full Access).
- [ ] Acessar `/knowledge-base`.
- [ ] Testar criação de categoria.
- [ ] Testar upload de documento texto simples.
- [ ] Monitorar logs da Edge Function `kb-ingest-document`.

### 🧠 Fase 4: Teste de IA
- [ ] Usar a aba "Busca Semântica" no frontend.
- [ ] Fazer uma pergunta sobre o documento enviado.
- [ ] Verificar se "Chunks relevantes" são exibidos.

## 🛠 Comandos Úteis

### Aplicar Migrations
```bash
npx supabase db push
```

### Deploy de Funções (Exemplo)
```bash
npx supabase functions deploy kb-ingest-document --no-verify-jwt
```
*Note: `--no-verify-jwt` pode ser necessário se for chamado via cron ou webhook sem contexto de usuário, mas geralmente requests do frontend enviam JWT.*

### Verificar Logs
Acesse o Dashboard do Supabase > Edge Functions > Logs.
