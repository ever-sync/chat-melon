# 🔧 PLANO DE CORREÇÃO DE ERROS - MELONCHAT

**Data:** 16/12/2025
**Status:** 🔴 7 Erros Críticos Identificados
**Prioridade:** URGENTE

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Severidade |
|-----------|------------|------------|
| Erros Críticos SQL | 7 | 🔴 Alta |
| Avisos Importantes | 3 | 🟡 Média |
| Erros TypeScript | 0 | ✅ OK |
| Problemas Config | 1 | 🟠 Média-Alta |

**Impacto:** Os erros críticos impedem o funcionamento de funcionalidades-chave como métricas de tempo de resposta, auto-assignment de conversas e multi-channel.

---

## 🔴 ERROS CRÍTICOS (AÇÃO IMEDIATA)

### ERRO #1 - Coluna `sender_id` Não Existe em `messages`

**Severidade:** 🔴 CRÍTICO
**Impacto:** Métricas de tempo de resposta quebradas
**Arquivos Afetados:**
- `supabase/migrations/20251216000003_response_time_metrics.sql`
- `src/hooks/useResponseTimeMetrics.ts`

**Problema:**
```sql
-- ❌ ERRO: coluna sender_id não existe
SELECT m.sender_id
FROM messages m
WHERE m.is_from_me = TRUE
```

**Solução 1 - Adicionar Coluna (RECOMENDADO):**
```sql
-- Migration: 20251217000001_fix_messages_sender_id.sql
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_id UUID
  REFERENCES profiles(id) ON DELETE SET NULL;

-- Popular dados existentes
UPDATE messages
SET sender_id = user_id
WHERE is_from_me = TRUE;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id)
  WHERE sender_id IS NOT NULL;
```

**Solução 2 - Usar `user_id` (ALTERNATIVA):**
```sql
-- Em 20251216000003_response_time_metrics.sql
-- Trocar todas referências de m.sender_id por m.user_id
SELECT m.user_id
FROM messages m
WHERE m.is_from_me = TRUE
```

**Ação Requerida:**
- [ ] Decidir entre Solução 1 ou 2
- [ ] Criar migration de correção
- [ ] Testar em desenvolvimento
- [ ] Aplicar em produção

---

### ERRO #2 - Coluna `auto_assign` Não Existe em `queues`

**Severidade:** 🔴 CRÍTICO
**Impacto:** Auto-assignment de conversas não funciona
**Arquivo Afetado:**
- `supabase/migrations/20251216000004_auto_assignment_sla_routing.sql:78`

**Problema:**
```sql
-- ❌ ERRO: queues não tem coluna auto_assign
SELECT assignment_method, max_conversations_per_agent, auto_assign
INTO v_assignment_method, v_max_per_agent
FROM queues
```

**Causa Raiz:**
- Migration `20251127220000_implement_full_schema.sql` recriou a tabela `queues` sem a coluna `auto_assign`
- Migration anterior tinha essa coluna mas foi sobrescrita

**Solução:**
```sql
-- Migration: 20251217000002_fix_queues_auto_assign.sql
ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN queues.auto_assign IS
  'Se TRUE, conversas são distribuídas automaticamente aos agentes da fila';

-- Atualizar filas existentes para auto-assign ativo
UPDATE queues SET auto_assign = TRUE WHERE auto_assign IS NULL;
```

**Ação Requerida:**
- [ ] Criar migration de correção
- [ ] Testar função `assign_conversation_to_agent()`
- [ ] Validar auto-assignment em ambiente de teste

---

### ERRO #3 - Conflito de Tipo: `channel_type` ENUM vs VARCHAR

**Severidade:** 🔴 CRÍTICO
**Impacto:** Sistema multi-channel quebrado
**Arquivos Afetados:**
- `supabase/migrations/20251214000001_channels_multichannel.sql:59`
- `supabase/migrations/20251215000005_channels_omnichannel.sql:90`

**Problema:**
Duas migrations tentam criar a mesma coluna com tipos diferentes:

```sql
-- Migration 1: ENUM
CREATE TYPE channel_type AS ENUM (...);
ALTER TABLE conversations
  ADD COLUMN channel_type channel_type DEFAULT 'whatsapp';

-- Migration 2: VARCHAR (CONFLITO!)
ALTER TABLE conversations
  ADD COLUMN channel_type VARCHAR(50) DEFAULT 'whatsapp';
```

**Solução:**
```sql
-- Migration: 20251217000003_fix_channel_type_conflict.sql

-- 1. Remover a segunda definição conflitante
-- Em 20251215000005_channels_omnichannel.sql, DELETAR linhas 88-91

-- 2. Garantir que o ENUM está criado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM (
      'whatsapp',
      'instagram',
      'messenger',
      'telegram',
      'widget',
      'email',
      'sms',        -- Adicionar novos canais
      'voice_call'
    );
  END IF;
END $$;

-- 3. Adicionar coluna apenas se não existir
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel_type channel_type DEFAULT 'whatsapp';

-- 4. Converter VARCHAR para ENUM se necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
      AND column_name = 'channel_type'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE conversations
      ALTER COLUMN channel_type TYPE channel_type
      USING channel_type::channel_type;
  END IF;
END $$;
```

**Ação Requerida:**
- [ ] Editar migration `20251215000005` para remover conflito
- [ ] Criar migration de verificação/correção
- [ ] Testar com múltiplos canais (WhatsApp, Instagram, etc)

---

### ERRO #4 - Conflito: `user_id` vs `member_id` em `queue_members`

**Severidade:** 🔴 CRÍTICO
**Impacto:** Sistema de filas não distribui conversas corretamente
**Arquivo Afetado:**
- `supabase/migrations/20251216000004_auto_assignment_sla_routing.sql:91-138`

**Problema:**
Duas migrations criaram `queue_members` com colunas diferentes:

```sql
-- Migration A: user_id
CREATE TABLE queue_members (
  queue_id UUID,
  user_id UUID REFERENCES profiles(id),  -- ✅
  ...
);

-- Migration B: member_id
CREATE TABLE queue_members (
  queue_id UUID,
  member_id UUID,  -- ❌ Conflito
  ...
);
```

**Solução:**
```sql
-- Migration: 20251217000004_fix_queue_members_column.sql

-- Padronizar para user_id (mais semântico)
DO $$
BEGIN
  -- Se member_id existir, renomear para user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE queue_members RENAME COLUMN member_id TO user_id;

    -- Adicionar FK se não existir
    ALTER TABLE queue_members
      DROP CONSTRAINT IF EXISTS queue_members_user_id_fkey;
    ALTER TABLE queue_members
      ADD CONSTRAINT queue_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Se user_id não existir, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE queue_members
      ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_queue_members_user
  ON queue_members(user_id) WHERE is_active = TRUE;
```

**Ação Requerida:**
- [ ] Executar migration de correção
- [ ] Verificar dados existentes em queue_members
- [ ] Testar distribuição de conversas

---

### ERRO #5 - Ambiguidade: `company_members` vs `company_users`

**Severidade:** 🟠 ALTO
**Impacto:** RLS policies podem falhar
**Arquivos Afetados:**
- Múltiplos arquivos referenciam ambas as tabelas

**Problema:**
Existem DUAS tabelas com propósitos similares:
- `company_members` (nova)
- `company_users` (antiga)

**Solução de Longo Prazo:**
```sql
-- Migration: 20251217000005_consolidate_company_members.sql

-- OPÇÃO A: Migrar company_users para company_members
INSERT INTO company_members (user_id, company_id, role, is_active, created_at)
SELECT user_id, company_id, role, is_active, created_at
FROM company_users
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Criar view de compatibilidade
CREATE OR REPLACE VIEW company_users AS
SELECT * FROM company_members;

-- OPÇÃO B: Manter company_users e criar alias
DROP VIEW IF EXISTS company_members;
CREATE OR REPLACE VIEW company_members AS
SELECT * FROM company_users;
```

**Solução de Curto Prazo:**
```sql
-- Garantir que ambas existam
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
```

**Ação Requerida:**
- [ ] Decidir estratégia (migração ou alias)
- [ ] Executar migration
- [ ] Atualizar todas as referências

---

### ERRO #6 - INSERT sem Verificação: `platform_features`

**Severidade:** 🟡 MÉDIO
**Impacto:** Migration pode falhar se tabela não existir
**Arquivo Afetado:**
- `supabase/migrations/20251216000004_auto_assignment_sla_routing.sql:789`

**Problema:**
```sql
-- ❌ Se platform_features não existir, INSERT falha
INSERT INTO platform_features (feature_key, name, ...)
VALUES ('auto_assignment', 'Auto-Assignment', ...)
ON CONFLICT (feature_key) DO NOTHING;
```

**Solução:**
```sql
-- Migration: 20251217000006_fix_platform_features_insert.sql

-- Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS platform_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_global_enabled BOOLEAN DEFAULT TRUE,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agora fazer o INSERT com segurança
INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES
  ('auto_assignment', 'Auto-Assignment', 'Distribuição automática de conversas', 'productivity', TRUE, 'Users', 30),
  ('sla_tracking', 'SLA Tracking', 'Rastreamento de SLA', 'analytics', TRUE, 'Clock', 31),
  ('routing_rules', 'Routing Rules', 'Regras de roteamento', 'automation', TRUE, 'GitBranch', 32),
  ('bulk_actions', 'Bulk Actions', 'Ações em massa', 'productivity', TRUE, 'Layers', 33),
  ('push_notifications', 'Push Notifications', 'Notificações push', 'engagement', TRUE, 'Bell', 34)
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index;
```

**Ação Requerida:**
- [ ] Adicionar CREATE TABLE IF NOT EXISTS
- [ ] Testar migration em ordem aleatória

---

### ERRO #7 - Trigger Duplicado

**Severidade:** 🟢 BAIXO
**Impacto:** Código redundante (sem impacto funcional)
**Arquivo Afetado:**
- `supabase/migrations/20251216000004_auto_assignment_sla_routing.sql:1-2`

**Problema:**
```sql
-- Linhas 1-2: DUPLICADO
DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
DROP TRIGGER IF EXISTS check_resolution_sla_trigger ON conversations;
```

**Solução:**
```bash
# Remover linha duplicada manualmente
sed -i '2d' supabase/migrations/20251216000004_auto_assignment_sla_routing.sql
```

**Ação Requerida:**
- [ ] Remover linha 2 duplicada
- [ ] Commit da correção

---

## ⚠️ AVISOS IMPORTANTES

### AVISO #1 - Chaves de API Expostas

**Severidade:** 🟠 MÉDIO-ALTO
**Arquivo:** `.env`

**Problema:**
Chaves de API do Supabase podem estar commitadas no repositório Git.

**Solução:**
```bash
# 1. Verificar se .env está no .gitignore
echo ".env" >> .gitignore

# 2. Remover .env do histórico do Git
git rm --cached .env
git commit -m "chore: remove .env from repository"

# 3. Rotar chaves no Supabase (se repositório já foi público)
# Ir em: Supabase Dashboard → Settings → API → Regenerate Keys

# 4. Atualizar .env.example com placeholders
cp .env .env.example
sed -i 's/sbp_[a-zA-Z0-9]*/YOUR_SUPABASE_ANON_KEY_HERE/g' .env.example
sed -i 's/https:\/\/[a-z]*\.supabase\.co/https:\/\/YOUR_PROJECT_ID.supabase.co/g' .env.example
```

**Ação Requerida:**
- [ ] Verificar histórico do Git
- [ ] Remover .env do repositório
- [ ] Rotar chaves se necessário

---

### AVISO #2 - Coluna `external_id` Pode Não Existir

**Severidade:** 🟡 MÉDIO
**Arquivo:** `supabase/migrations/20251215000005_channels_omnichannel.sql:132`

**Problema:**
```sql
-- ❌ external_id pode não existir em contacts
CREATE INDEX idx_contacts_external
  ON contacts(company_id, external_id, channel_type);
```

**Solução:**
```sql
-- Adicionar coluna antes de criar índice
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS external_id TEXT;

COMMENT ON COLUMN contacts.external_id IS
  'ID externo do contato no canal de origem (ex: Instagram User ID, WhatsApp Number)';

-- Agora criar o índice
CREATE INDEX IF NOT EXISTS idx_contacts_external
  ON contacts(company_id, external_id, channel_type)
  WHERE external_id IS NOT NULL;
```

**Ação Requerida:**
- [ ] Adicionar coluna external_id
- [ ] Criar índice parcial (WHERE IS NOT NULL)

---

## 📋 SCRIPT DE CORREÇÃO AUTOMÁTICA

Criei um script SQL que corrige TODOS os erros críticos de uma vez:

```sql
-- =====================================================
-- SCRIPT DE CORREÇÃO COMPLETA - MELONCHAT
-- Execução: psql -h HOST -U USER -d DATABASE -f fix_all_errors.sql
-- =====================================================

BEGIN;

-- =========================================
-- ERRO #1: Adicionar sender_id em messages
-- =========================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_id UUID
  REFERENCES profiles(id) ON DELETE SET NULL;

UPDATE messages
SET sender_id = user_id
WHERE is_from_me = TRUE AND sender_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id)
  WHERE sender_id IS NOT NULL;

-- =========================================
-- ERRO #2: Adicionar auto_assign em queues
-- =========================================
ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT TRUE;

UPDATE queues
SET auto_assign = TRUE
WHERE auto_assign IS NULL;

-- =========================================
-- ERRO #3: Resolver conflito channel_type
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM (
      'whatsapp', 'instagram', 'messenger', 'telegram', 'widget', 'email', 'sms', 'voice_call'
    );
  END IF;
END $$;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel_type channel_type DEFAULT 'whatsapp';

-- =========================================
-- ERRO #4: Padronizar user_id em queue_members
-- =========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE queue_members RENAME COLUMN member_id TO user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE queue_members
      ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_queue_members_user
  ON queue_members(user_id) WHERE is_active = TRUE;

-- =========================================
-- ERRO #5: Garantir company_members existe
-- =========================================
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- =========================================
-- ERRO #6: Garantir platform_features existe
-- =========================================
CREATE TABLE IF NOT EXISTS platform_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_global_enabled BOOLEAN DEFAULT TRUE,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_features (feature_key, name, description, category, is_global_enabled, icon, order_index)
VALUES
  ('auto_assignment', 'Auto-Assignment', 'Distribuição automática de conversas', 'productivity', TRUE, 'Users', 30),
  ('sla_tracking', 'SLA Tracking', 'Rastreamento de SLA', 'analytics', TRUE, 'Clock', 31),
  ('routing_rules', 'Routing Rules', 'Regras de roteamento', 'automation', TRUE, 'GitBranch', 32),
  ('bulk_actions', 'Bulk Actions', 'Ações em massa', 'productivity', TRUE, 'Layers', 33),
  ('push_notifications', 'Push Notifications', 'Notificações push', 'engagement', TRUE, 'Bell', 34)
ON CONFLICT (feature_key) DO NOTHING;

-- =========================================
-- AVISO #2: Adicionar external_id em contacts
-- =========================================
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_external
  ON contacts(company_id, external_id, channel_type)
  WHERE external_id IS NOT NULL;

COMMIT;

-- =========================================
-- VALIDAÇÃO PÓS-CORREÇÃO
-- =========================================
SELECT
  'messages.sender_id' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT
  'queues.auto_assign',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queues' AND column_name = 'auto_assign'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT
  'channel_type ENUM',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'channel_type'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT
  'queue_members.user_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_members' AND column_name = 'user_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT
  'contacts.external_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'external_id'
  ) THEN '✅ OK' ELSE '❌ FALTA' END;
```

---

## 🚀 PLANO DE AÇÃO (ORDEM DE EXECUÇÃO)

### Fase 1: Correções Críticas (HOJE)
- [ ] Executar script de correção completo
- [ ] Validar resultados com query de verificação
- [ ] Testar funcionalidades afetadas:
  - [ ] Métricas de tempo de resposta
  - [ ] Auto-assignment de conversas
  - [ ] Multi-channel (WhatsApp, Instagram)

### Fase 2: Segurança (ESTA SEMANA)
- [ ] Remover .env do repositório Git
- [ ] Rotar chaves do Supabase
- [ ] Atualizar .env.example

### Fase 3: Limpeza (PRÓXIMA SEMANA)
- [ ] Remover trigger duplicado
- [ ] Consolidar company_members vs company_users
- [ ] Documentar schema final

### Fase 4: Testes (CONTÍNUO)
- [ ] Criar suite de testes de integração
- [ ] Validar todas as funcionalidades end-to-end
- [ ] Monitorar logs de erro

---

## 📞 CONTATO PARA DÚVIDAS

Se encontrar problemas durante a execução das correções, documente:
1. Mensagem de erro completa
2. Migration que falhou
3. Linha do erro
4. Estado do banco antes da correção

---

**Última Atualização:** 16/12/2025
**Status:** ⏳ Aguardando execução das correções
**Próxima Revisão:** Após aplicação do script
