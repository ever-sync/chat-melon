# Debug dos Contadores - Passo a Passo

## 1. Verificar se existem conversas no banco

Abra o **SQL Editor do Supabase** e execute:

```sql
-- Verificar total de conversas
SELECT
  company_id,
  status,
  assigned_to,
  ai_enabled,
  COUNT(*) as total
FROM conversations
WHERE status != 'closed'
GROUP BY company_id, status, assigned_to, ai_enabled
ORDER BY company_id, status;
```

**Resultado esperado**: Se não houver conversas, não aparecerá nada.

## 2. Criar conversas de teste (se necessário)

Se você deletou todas as conversas e quer testar, crie algumas:

```sql
-- Inserir conversas de teste
-- IMPORTANTE: Substitua 'SUA_EMPRESA_ID' pelo ID real da sua empresa
-- Você pode pegar o ID da empresa executando: SELECT id, name FROM companies;

INSERT INTO conversations (
  company_id,
  contact_id,
  contact_name,
  contact_number,
  channel_type,
  status,
  assigned_to,
  ai_enabled,
  last_message,
  last_message_time
) VALUES
  -- Conversa em atendimento
  ('SUA_EMPRESA_ID', gen_random_uuid(), 'Cliente Teste 1', '5511999999991', 'whatsapp', 'active', 'SEU_USER_ID', false, 'Olá!', NOW()),

  -- Conversa aguardando
  ('SUA_EMPRESA_ID', gen_random_uuid(), 'Cliente Teste 2', '5511999999992', 'whatsapp', 'waiting', NULL, false, 'Preciso de ajuda', NOW()),

  -- Conversa aguardando (re_entry)
  ('SUA_EMPRESA_ID', gen_random_uuid(), 'Cliente Teste 3', '5511999999993', 'whatsapp', 're_entry', NULL, false, 'Voltei', NOW()),

  -- Conversa no bot
  ('SUA_EMPRESA_ID', gen_random_uuid(), 'Cliente Teste 4', '5511999999994', 'whatsapp', 'chatbot', NULL, false, 'Oi bot', NOW()),

  -- Conversa com IA
  ('SUA_EMPRESA_ID', gen_random_uuid(), 'Cliente Teste 5', '5511999999995', 'whatsapp', 'active', NULL, true, 'Pergunta para IA', NOW());
```

## 3. Verificar no Console do Navegador

1. Abra o site (página de Conversas/Chat)
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Procure por logs com emojis:

```
🔢 Buscando contadores reais para empresa: xxx-xxx-xxx
📊 Total de conversas carregadas: 5
✅ Contadores calculados: {all: 5, atendimento: 1, aguardando: 2, bot: 1, ia: 1}
🎯 ConversationList - realCounts: {all: 5, atendimento: 1, aguardando: 2, bot: 1, ia: 1}
```

## 4. Verificar Logs Esperados

### Se tudo estiver funcionando:
```
🔢 Buscando contadores reais para empresa: abc-123
📊 Total de conversas carregadas: 5
✅ Contadores calculados: {all: 5, atendimento: 1, aguardando: 2, bot: 1, ia: 1}
🎯 ConversationList - realCounts: {all: 5, atendimento: 1, ...}
🎯 ConversationList - isLoadingCounts: false
🎯 ConversationList - countsError: null
```

### Se não houver conversas:
```
🔢 Buscando contadores reais para empresa: abc-123
📊 Total de conversas carregadas: 0
✅ Contadores calculados: {all: 0, atendimento: 0, aguardando: 0, bot: 0, ia: 0}
```

### Se houver erro:
```
❌ Erro ao buscar conversas: { message: "..." }
🎯 ConversationList - countsError: Error(...)
```

## 5. Verificar se a empresa está selecionada

No console, execute:

```javascript
// Verificar empresa atual
console.log('Empresa atual:', localStorage.getItem('selectedCompanyId'));
```

Se retornar `null`, você precisa selecionar uma empresa no menu superior.

## 6. Forçar refresh dos contadores

No console, execute:

```javascript
// Invalidar cache e forçar reload
import { queryClient } from '@tanstack/react-query';
queryClient.invalidateQueries({ queryKey: ['conversation-counts'] });
```

Ou simplesmente **recarregue a página** (F5).

## 7. Verificar Permissões RLS (Row Level Security)

Execute no SQL Editor:

```sql
-- Ver se você tem permissão para visualizar conversas
SELECT COUNT(*)
FROM conversations
WHERE company_id IN (
  SELECT company_id
  FROM company_users
  WHERE user_id = auth.uid()
);
```

Se retornar **0**, você não tem permissão ou não está associado à empresa.

## 8. Solução Temporária: Desabilitar RLS (APENAS PARA DEBUG)

**⚠️ CUIDADO: Só faça isso em ambiente de desenvolvimento!**

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Depois de testar, REABILITAR:
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
```

## 9. Verificar React Query DevTools

Se você tiver o React Query DevTools instalado:

1. Procure pela query com key: `['conversation-counts', companyId, userId]`
2. Veja o status: `success`, `loading`, `error`
3. Veja os dados retornados

## 10. Checklist Final

- [ ] Existe pelo menos 1 conversa no banco (status != 'closed')
- [ ] Conversa pertence à empresa que você está vendo (`company_id` correto)
- [ ] Você está logado (`auth.uid()` retorna um ID)
- [ ] Você está associado à empresa (`company_users` tem seu user_id)
- [ ] RLS permite você ver as conversas
- [ ] Console mostra logs de "🔢 Buscando contadores..."
- [ ] Console mostra "✅ Contadores calculados"
- [ ] Não há erro "❌" no console

## Resultado Esperado na Interface

Se tudo funcionar, você verá nos botões:

```
┌─────────────┬─────────────┬─────────────┐
│   Inbox     │ Atendimento │  Aguardando │
│    (5)      │     (1)     │     (2)     │
└─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┐
│   No Bot    │     IA      │
│    (1)      │     (1)     │
└─────────────┴─────────────┘
```

## Problemas Comuns

### Contadores mostram todos zero
- Não há conversas no banco
- Empresa não está selecionada
- RLS bloqueando acesso

### Contadores não aparecem
- Hook não está sendo chamado
- Erro de permissão
- Componente não está usando `realCounts`

### Números estão errados
- Filtros incorretos (verificar lógica no hook)
- Cache antigo (forçar refresh)
- Dados inconsistentes no banco

## Próximo Passo

**Após verificar os logs no console**, me informe:
1. O que aparece no console (copie os logs com 🔢 e ✅)
2. Quantas conversas existem no banco
3. Se há algum erro (❌)

Assim consigo te ajudar melhor! 🔍
