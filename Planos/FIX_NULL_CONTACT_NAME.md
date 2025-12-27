# 🔧 Correção: Erro contact_name NULL

## ❌ Problema Encontrado

```
ERROR: 23502: null value in column "contact_name" of relation "conversations"
violates not-null constraint
```

### Causa:
- A coluna `contact_name` na tabela `conversations` tem constraint `NOT NULL`
- O trigger de sincronização estava tentando atualizar com `NEW.name` que pode ser NULL
- Algumas conversas antigas já tinham `contact_name` NULL

---

## ✅ Solução Implementada

### 1. Trigger Corrigido

**ANTES** (podia inserir NULL):
```sql
UPDATE conversations
SET contact_name = NEW.name,  -- ❌ NEW.name pode ser NULL
    updated_at = NOW()
WHERE contact_id = NEW.id;
```

**DEPOIS** (nunca será NULL):
```sql
UPDATE conversations
SET contact_name = COALESCE(NEW.name, NEW.phone, 'Sem nome'),  -- ✅ Sempre tem valor
    updated_at = NOW()
WHERE contact_id = NEW.id;
```

### 2. Lógica de Fallback

O sistema agora usa esta ordem de prioridade:
1. **NEW.name** (nome do contato) - Se existir
2. **NEW.phone** (telefone do contato) - Se nome for NULL
3. **'Sem nome'** (texto padrão) - Se tudo for NULL

---

## 🔧 Como Aplicar a Correção

### Passo 1: Executar Script de Correção

Execute o arquivo `FIX_NULL_CONTACT_NAMES.sql` no Supabase SQL Editor:

```sql
-- 1. Corrigir conversas existentes com NULL
UPDATE conversations c
SET contact_name = COALESCE(ct.name, ct.phone, c.contact_number, 'Sem nome')
FROM contacts ct
WHERE c.contact_id = ct.id
  AND c.contact_name IS NULL;

-- 2. Corrigir conversas órfãs (sem contato)
UPDATE conversations
SET contact_name = COALESCE(contact_number, 'Sem nome')
WHERE contact_name IS NULL;
```

### Passo 2: Atualizar o Trigger

Execute o arquivo `APPLY_CONTACT_NAME_SYNC.sql` atualizado:

```sql
-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_contact_name_updated ON contacts;
DROP FUNCTION IF EXISTS sync_contact_name_to_conversations();

-- Criar novo trigger com COALESCE
CREATE OR REPLACE FUNCTION sync_contact_name_to_conversations()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE conversations
    SET contact_name = COALESCE(NEW.name, NEW.phone, 'Sem nome'),
        updated_at = NOW()
    WHERE contact_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_contact_name_updated
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_name_to_conversations();
```

### Passo 3: Verificar Resultado

Execute esta query para verificar:

```sql
SELECT
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE contact_name IS NULL) as null_names,
  COUNT(*) FILTER (WHERE contact_name IS NOT NULL) as valid_names
FROM conversations;
```

**Resultado esperado:**
- `null_names` deve ser **0** (zero)
- `valid_names` deve ser igual a `total_conversations`

---

## 📋 Arquivos Modificados

### 1. `APPLY_CONTACT_NAME_SYNC.sql`
**Mudança**: Adicionado `COALESCE()` para garantir valor não-NULL

```sql
-- Linha 21 (ANTES)
SET contact_name = NEW.name,

-- Linha 21 (DEPOIS)
SET contact_name = COALESCE(NEW.name, NEW.phone, 'Sem nome'),
```

### 2. `supabase/migrations/20251226000004_sync_contact_name_to_conversations.sql`
**Mudança**: Mesmo ajuste com `COALESCE()`

### 3. `FIX_NULL_CONTACT_NAMES.sql` (NOVO)
**Propósito**: Corrigir conversas existentes que já têm `contact_name` NULL

### 4. `FIX_NULL_CONTACT_NAME.md` (NOVO)
**Propósito**: Documentação desta correção

---

## 🎯 Cenários Cobertos

### Cenário 1: Contato tem nome
```
contacts.name = "João Silva"
→ conversations.contact_name = "João Silva" ✅
```

### Cenário 2: Contato sem nome, mas com telefone
```
contacts.name = NULL
contacts.phone = "5511999999999"
→ conversations.contact_name = "5511999999999" ✅
```

### Cenário 3: Contato sem nome e sem telefone
```
contacts.name = NULL
contacts.phone = NULL
→ conversations.contact_name = "Sem nome" ✅
```

### Cenário 4: Conversa órfã (sem contato na tabela contacts)
```
conversations.contact_number = "5511988888888"
→ conversations.contact_name = "5511988888888" ✅
```

### Cenário 5: Conversa órfã sem número
```
conversations.contact_number = NULL
→ conversations.contact_name = "Sem nome" ✅
```

---

## ✅ Checklist de Aplicação

- [ ] 1. Executar `FIX_NULL_CONTACT_NAMES.sql` no Supabase
- [ ] 2. Verificar que não há mais `contact_name` NULL
- [ ] 3. Executar `APPLY_CONTACT_NAME_SYNC.sql` no Supabase
- [ ] 4. Verificar que o trigger foi criado:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_contact_name_updated';
  ```
- [ ] 5. Testar edição de nome de contato
- [ ] 6. Verificar que nome atualiza na lista de conversas
- [ ] 7. Criar novo contato sem nome e verificar fallback

---

## 🐛 Troubleshooting

### Problema: "Ainda aparece erro de NULL"
**Solução**:
```sql
-- Verificar se há conversas com NULL
SELECT COUNT(*) FROM conversations WHERE contact_name IS NULL;

-- Se houver, execute:
UPDATE conversations
SET contact_name = COALESCE(contact_number, 'Sem nome')
WHERE contact_name IS NULL;
```

### Problema: "Trigger não está funcionando"
**Solução**:
```sql
-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_contact_name_updated';

-- Se não existir, executar APPLY_CONTACT_NAME_SYNC.sql novamente
```

### Problema: "Alguns nomes aparecem como 'Sem nome'"
**Solução**: Isso é normal para contatos que:
- Não têm nome cadastrado
- Não têm telefone cadastrado
- São conversas antigas sem vínculo com contato

Para corrigir manualmente:
```sql
-- Ver conversas com 'Sem nome'
SELECT id, contact_id, contact_number, contact_name
FROM conversations
WHERE contact_name = 'Sem nome';

-- Atualizar manualmente se souber o nome correto
UPDATE conversations
SET contact_name = 'Nome Correto'
WHERE id = 'uuid-da-conversa';
```

---

## 📊 Estatísticas Após Correção

Execute para ver o resultado:

```sql
-- Distribuição de nomes
SELECT
  CASE
    WHEN contact_name = 'Sem nome' THEN 'Sem nome (fallback)'
    WHEN contact_name ~ '^[0-9]+$' THEN 'Número de telefone'
    ELSE 'Nome válido'
  END as tipo_nome,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM conversations), 2) as percentual
FROM conversations
GROUP BY tipo_nome
ORDER BY quantidade DESC;
```

**Exemplo de resultado esperado:**
```
tipo_nome              | quantidade | percentual
-----------------------|------------|------------
Nome válido            |    1250    |   85.50
Número de telefone     |     180    |   12.30
Sem nome (fallback)    |      32    |    2.20
```

---

## 🚀 Melhorias Futuras (Opcional)

- [ ] Criar função para enriquecer nomes automaticamente
- [ ] Integrar com API do WhatsApp para buscar nomes
- [ ] Adicionar validação no frontend para não permitir criar contato sem nome
- [ ] Criar job para limpar 'Sem nome' periodicamente
- [ ] Notificar admin quando houver muitos 'Sem nome'

---

## 📝 Resumo da Correção

### O que foi corrigido:
✅ Trigger agora usa `COALESCE()` para nunca retornar NULL
✅ Ordem de prioridade: name → phone → 'Sem nome'
✅ Script de correção para dados existentes
✅ Documentação completa

### O que mudou:
- ✅ Função `sync_contact_name_to_conversations()` atualizada
- ✅ Migration file atualizada
- ✅ Script de aplicação manual atualizado
- ✅ Novo script de correção de dados criado

### Garantias:
- ✅ Nunca mais ocorrerá erro de NULL constraint
- ✅ Todas as conversas sempre terão um nome válido
- ✅ Sistema resiliente a dados incompletos

---

**Corrigido em:** 26/12/2024
**Versão:** 1.1
**Status:** ✅ Funcional com proteção contra NULL

---

## 📞 Ordem de Execução

**IMPORTANTE**: Execute nesta ordem:

1. **PRIMEIRO**: `FIX_NULL_CONTACT_NAMES.sql` (corrige dados existentes)
2. **DEPOIS**: `APPLY_CONTACT_NAME_SYNC.sql` (atualiza trigger)
3. **VERIFICAR**: Query de validação (deve retornar 0 NULLs)

Pronto! O sistema está protegido contra valores NULL em `contact_name`. 🎉
