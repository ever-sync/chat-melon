# 🔍 Debug: Mensagens do Instagram não aparecem no Chat

## ✅ O que JÁ está funcionando

1. ✅ Webhook recebendo mensagens (200 OK)
2. ✅ Mensagens sendo salvas no banco de dados
3. ✅ Conversas sendo criadas corretamente
4. ✅ `last_message_time` sendo atualizado

## ❌ O Problema

**Mensagens aparecem no banco de dados mas NÃO aparecem na interface do chat**

## 🔎 Possíveis Causas

### 1. Problema com `company_id`
- As conversas podem estar sendo criadas com um `company_id` diferente do esperado
- Verifique se o `company_id` nas conversas Instagram é o mesmo das outras conversas

### 2. Problema com Realtime
- O Realtime pode não estar ativado no Supabase
- O subscription pode não estar funcionando corretamente

### 3. Problema com Filtros no Frontend
- Pode haver filtros salvos no `localStorage` bloqueando as conversas
- Pode haver um filtro de canal ativo

### 4. Problema com `last_message_time` NULL
- Se `last_message_time` for NULL, a ordenação pode colocar a conversa no final

### 5. Problema com Cache do React Query
- O React Query pode estar usando dados em cache antigos

## 📋 Diagnóstico Passo a Passo

### Passo 1: Execute o SQL de Diagnóstico

Execute este SQL no **Supabase SQL Editor**:

\`\`\`sql
-- Ver conversas Instagram vs WhatsApp
SELECT
    channel_type,
    COUNT(*) as total,
    COUNT(CASE WHEN last_message_time IS NULL THEN 1 END) as sem_last_message_time,
    MIN(company_id) as company_id_exemplo
FROM conversations
WHERE status != 'closed'
GROUP BY channel_type;

-- Ver as últimas 5 conversas Instagram
SELECT
    id,
    company_id,
    contact_name,
    status,
    last_message,
    last_message_time,
    created_at,
    unread_count
FROM conversations
WHERE channel_type = 'instagram'
ORDER BY created_at DESC
LIMIT 5;

-- Ver se há diferença de company_id
SELECT DISTINCT company_id
FROM conversations
ORDER BY company_id;
\`\`\`

**O que verificar:**
- [ ] Todas as conversas Instagram têm `last_message_time` preenchido?
- [ ] O `company_id` é o mesmo em todas as conversas?
- [ ] O `status` é "waiting" ou "active"?
- [ ] O `unread_count` é maior que 0?

### Passo 2: Limpar Filtros do Frontend

Abra o **Console do Browser** (F12) na página do Chat e execute:

\`\`\`javascript
// Limpar filtros salvos
localStorage.removeItem('chat-filters');

// Recarregar a página
location.reload();
\`\`\`

### Passo 3: Verificar Realtime

No Console do Browser, procure por logs como:
\`\`\`
Realtime conversations status: SUBSCRIBED
\`\`\`

Se não aparecer, o Realtime não está funcionando.

### Passo 4: Forçar Recarregamento

No Console do Browser:
\`\`\`javascript
// Ver query atual do React Query
window.reactQueryClient?.getQueryData(['conversations'])

// Invalidar cache
window.reactQueryClient?.invalidateQueries(['conversations'])
\`\`\`

## 🔧 Soluções Rápidas

### Solução 1: Atualizar `last_message_time` manualmente

Se o problema for `last_message_time` NULL:

\`\`\`sql
UPDATE conversations
SET last_message_time = COALESCE(last_message_time, created_at)
WHERE channel_type = 'instagram'
  AND last_message_time IS NULL;
\`\`\`

### Solução 2: Verificar e corrigir `company_id`

Se o `company_id` estiver errado:

\`\`\`sql
-- Ver qual company_id está correto
SELECT company_id, COUNT(*) as total
FROM conversations
WHERE channel_type != 'instagram'
GROUP BY company_id
ORDER BY total DESC
LIMIT 1;

-- Atualizar se necessário (substitua os IDs)
UPDATE conversations
SET company_id = 'SEU_COMPANY_ID_CORRETO'
WHERE channel_type = 'instagram'
  AND company_id != 'SEU_COMPANY_ID_CORRETO';
\`\`\`

### Solução 3: Ativar Realtime no Supabase

1. Vá para: https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/database/replication
2. Verifique se a tabela `conversations` está com Realtime HABILITADO
3. Verifique se a tabela `messages` está com Realtime HABILITADO

### Solução 4: Hard Refresh

- Ctrl + Shift + R (Windows/Linux)
- Cmd + Shift + R (Mac)

## 🎯 Teste Final

1. Envie uma nova mensagem pelo Instagram para @eversync.oficial
2. Abra o Console do Browser (F12)
3. Vá para a aba "Network"
4. Vá para a aba "Console"
5. Veja se aparecem logs de Realtime:
   \`\`\`
   Realtime: Conversation updated - invalidating query
   \`\`\`

6. Se NÃO aparecer o log, o Realtime não está funcionando
7. Se APARECER o log mas a conversa não aparecer, o problema é com a query ou filtros

## 📊 Informações Necessárias

Para continuar o debug, preciso que você me mostre:

1. **Resultado do SQL de diagnóstico** (Passo 1)
2. **Logs do Console** após enviar uma mensagem
3. **Screenshot** da interface do chat
4. **Company ID** do usuário logado

---

**Status:** 🔍 Aguardando diagnóstico
**Próximo Passo:** Executar SQL e verificar Realtime
