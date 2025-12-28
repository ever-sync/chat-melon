# Implementação de Contadores Reais - Filtros Rápidos

## Problema Identificado

Os contadores nos botões de filtro rápido estavam mostrando valores **incorretos** porque eram calculados apenas com base nas conversas da **página atual** carregada, não no total do banco de dados.

### Exemplo do Problema:

```
Total de conversas no banco: 100
Conversas na página 1: 20 (paginação)

Contador exibido: 5 (apenas da página atual)
Contador correto: 21 (total no banco)
```

## Solução Implementada

Criamos um **hook customizado** que busca os contadores reais diretamente do banco de dados usando queries otimizadas.

### Arquivos Criados/Modificados

1. **Hook de Contadores Reais**: `src/hooks/chat/useConversationCounts.ts`
2. **Integração**: `src/components/chat/sidebar/ConversationList.tsx`

## Como Funciona

### 1. Hook `useConversationCounts`

Faz **5 queries separadas** ao banco de dados para contar:

```typescript
// Query 1: Total (exceto fechadas)
SELECT COUNT(*) FROM conversations
WHERE company_id = ? AND status != 'closed'

// Query 2: Atendimento
SELECT COUNT(*) FROM conversations
WHERE company_id = ?
  AND assigned_to IS NOT NULL
  AND status != 'chatbot'
  AND (ai_enabled IS NULL OR ai_enabled = false)

// Query 3: Aguardando
SELECT COUNT(*) FROM conversations
WHERE company_id = ?
  AND status IN ('waiting', 're_entry')
  AND assigned_to IS NULL

// Query 4: Bot
SELECT COUNT(*) FROM conversations
WHERE company_id = ?
  AND status = 'chatbot'
  AND (ai_enabled IS NULL OR ai_enabled = false)

// Query 5: IA
SELECT COUNT(*) FROM conversations
WHERE company_id = ?
  AND ai_enabled = true
```

### 2. Otimizações Implementadas

#### Cache e Refetch
```typescript
{
  staleTime: 30 * 1000,      // Cache por 30 segundos
  refetchInterval: 60 * 1000, // Atualiza a cada 1 minuto
}
```

#### Head-Only Queries
Usamos `{ count: 'exact', head: true }` para não carregar dados, apenas contar:

```typescript
const { count, error } = await supabase
  .from('conversations')
  .select('*', { count: 'exact', head: true }) // Não retorna dados, só count
  .eq('company_id', companyId)
```

Isso é **muito mais rápido** que carregar todas as conversas.

### 3. Fallback Inteligente

Se a query falhar, usamos os dados da página atual como backup:

```typescript
const quickModeCounts = realCounts || {
  all: conversations.length,
  atendimento: conversations.filter(c => ...).length,
  // ... outros filtros locais
};
```

## Performance

### Antes (Cálculo Local)
- ❌ Contadores incorretos (apenas página atual)
- ✅ Sem chamadas ao banco
- ✅ Instantâneo

### Depois (Queries ao Banco)
- ✅ Contadores corretos (total real)
- ⚠️ 5 queries ao banco
- ⚠️ ~100-300ms inicial
- ✅ Cache de 30s reduz chamadas
- ✅ Atualização automática a cada 1min

## Impacto no Banco de Dados

### Queries Executadas

Por usuário a cada **1 minuto**:
- 5 COUNT queries (muito leves, apenas HEAD)
- Indexadas por `company_id`
- Sem JOIN ou carga de dados

### Estimativa de Carga

Com **100 usuários simultâneos**:
- 500 queries/minuto (5 x 100)
- ~8 queries/segundo
- Cada query: ~10-20ms
- **Impacto: BAIXO**

### Otimizações de Banco

Certifique-se de ter índices:

```sql
-- Índice principal (já existe)
CREATE INDEX idx_conversations_company_status
ON conversations(company_id, status);

-- Índice para assigned_to
CREATE INDEX idx_conversations_assigned_to
ON conversations(company_id, assigned_to)
WHERE assigned_to IS NOT NULL;

-- Índice para ai_enabled
CREATE INDEX idx_conversations_ai_enabled
ON conversations(company_id, ai_enabled)
WHERE ai_enabled = true;
```

## Uso do Hook

### Básico

```typescript
import { useConversationCounts } from '@/hooks/chat/useConversationCounts';

function MyComponent() {
  const { data: counts, isLoading } = useConversationCounts();

  return (
    <div>
      Aguardando: {counts?.aguardando || 0}
      IA: {counts?.ia || 0}
    </div>
  );
}
```

### Com User ID (Futuro)

```typescript
const userId = 'user-123';
const { data: counts } = useConversationCounts(userId);
// Podemos adicionar filtro por usuário no futuro
```

## Estrutura de Dados Retornada

```typescript
interface ConversationCounts {
  all: number;          // Total de conversas
  atendimento: number;  // Em atendimento humano
  aguardando: number;   // Esperando atendente
  bot: number;          // No chatbot
  ia: number;           // Com IA ativa
}
```

## Monitoramento

### Como Verificar se Está Funcionando

1. **No navegador (DevTools → Network)**:
   ```
   Procure por: POST /rest/v1/conversations
   Método: HEAD
   Response: Vazio (apenas header X-Total-Count)
   ```

2. **No console do navegador**:
   ```typescript
   // Adicione temporariamente no hook:
   console.log('Contadores carregados:', data);
   ```

3. **React Query DevTools** (se instalado):
   ```
   Query Key: ['conversation-counts', companyId, userId]
   Status: success
   Data: { all: 100, atendimento: 15, ... }
   ```

### Métricas Importantes

- **Cache Hit Rate**: Quantas vezes usa cache vs. busca no banco
- **Query Time**: Tempo médio de resposta
- **Error Rate**: Taxa de erros nas queries

## Troubleshooting

### Contadores Ainda Incorretos

1. Verifique se o hook está sendo chamado:
   ```typescript
   const { data: realCounts, error } = useConversationCounts();
   console.log('realCounts:', realCounts, 'error:', error);
   ```

2. Verifique os filtros no banco:
   ```sql
   -- Execute no SQL Editor do Supabase
   SELECT
     COUNT(*) FILTER (WHERE status != 'closed') as all,
     COUNT(*) FILTER (WHERE assigned_to IS NOT NULL AND status != 'chatbot') as atendimento,
     COUNT(*) FILTER (WHERE status IN ('waiting', 're_entry') AND assigned_to IS NULL) as aguardando,
     COUNT(*) FILTER (WHERE status = 'chatbot') as bot,
     COUNT(*) FILTER (WHERE ai_enabled = true) as ia
   FROM conversations
   WHERE company_id = 'sua-empresa-id';
   ```

### Performance Lenta

1. **Adicione índices** (veja seção acima)
2. **Aumente o staleTime**:
   ```typescript
   staleTime: 60 * 1000, // 1 minuto em vez de 30 segundos
   ```
3. **Reduza refetchInterval**:
   ```typescript
   refetchInterval: 120 * 1000, // 2 minutos em vez de 1
   ```

### Erro de Permissão

Se receber erro `permission denied`:

1. Verifique RLS (Row Level Security) no Supabase:
   ```sql
   -- Deve permitir SELECT com COUNT
   CREATE POLICY "Users can count conversations"
   ON conversations FOR SELECT
   USING (company_id IN (
     SELECT company_id FROM company_users
     WHERE user_id = auth.uid()
   ));
   ```

## Alternativas Consideradas

### 1. Materializar Contadores
Criar tabela separada com contadores pré-calculados:
- ✅ Mais rápido (1 query)
- ❌ Complexidade (triggers, updates)
- ❌ Possível inconsistência

### 2. Aggregate no Cliente
Carregar todas conversas e contar no cliente:
- ✅ Simples
- ❌ Muito lento com muitas conversas
- ❌ Uso excessivo de memória

### 3. Realtime Subscriptions
Usar Postgres Changes para atualizar em tempo real:
- ✅ Dados sempre atualizados
- ❌ Complexo de implementar
- ❌ Muitas conexões websocket

**Escolhemos a abordagem atual** por ser um bom equilíbrio entre performance, simplicidade e precisão.

## Próximos Passos

### Melhorias Futuras

1. **Combinar queries em uma só**:
   ```sql
   SELECT
     COUNT(*) FILTER (...) as all,
     COUNT(*) FILTER (...) as atendimento,
     ...
   FROM conversations
   ```

2. **Server-side Function**:
   ```sql
   CREATE FUNCTION get_conversation_counts(company_uuid UUID)
   RETURNS JSON AS $$
     -- Retorna todos contadores em uma chamada
   $$ LANGUAGE plpgsql;
   ```

3. **Cache no Redis** (se disponível):
   ```typescript
   // Cache compartilhado entre usuários
   const cachedCounts = await redis.get(`counts:${companyId}`);
   ```

## Conclusão

A implementação de contadores reais resolve o problema de exibição incorreta mantendo boa performance através de:

- ✅ Queries otimizadas (HEAD only)
- ✅ Cache inteligente (30s)
- ✅ Atualização automática (1min)
- ✅ Fallback para dados locais
- ✅ Impacto baixo no banco

Os números agora refletem a **realidade total** das conversas, não apenas a página atual!
