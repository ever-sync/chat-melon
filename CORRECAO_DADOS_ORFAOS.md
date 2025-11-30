# 🔧 Correção: Dados Órfãos Impedindo CASCADE DELETE

## ❌ Problema Encontrado

Ao tentar aplicar a migration de CASCADE DELETE, o seguinte erro ocorreu:

```
ERROR: 23503: insert or update on table "labels" violates foreign key constraint "labels_company_id_fkey"
DETAIL: Key (company_id)=(01ec9caa-340c-4d9d-a6a0-c0dc97a38801) is not present in table "companies".
```

### O que isso significa?

Existem **dados órfãos** no banco de dados - registros em tabelas filhas (como `labels`, `contacts`, etc.) que referenciam empresas (`company_id`) que não existem mais na tabela `companies`.

Isso acontece quando:
1. Empresas foram deletadas manualmente do banco
2. Migrações anteriores removeram empresas
3. Dados de testes foram deletados incorretamente
4. Sem CASCADE DELETE, os dados filhos ficaram "órfãos"

## ✅ Solução Implementada

A migration `20251129000002_company_cascade_and_unique_cnpj.sql` foi atualizada para **PRIMEIRO limpar os dados órfãos** antes de criar as constraints CASCADE.

### Processo em 8 Passos:

#### PASSO 1: Limpeza de Dados Órfãos
Remove todos os registros que referenciam empresas inexistentes:

```sql
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Labels órfãos
  DELETE FROM labels WHERE company_id NOT IN (SELECT id FROM companies);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Removidos % registros órfãos de labels', deleted_count;
  END IF;

  -- ... (repete para todas as 19 tabelas principais)
END $$;
```

**Tabelas Limpas (19):**
1. labels
2. contacts
3. conversations (apenas se company_id não for NULL)
4. messages (apenas se company_id não for NULL)
5. sectors
6. blocked_contacts
7. agent_status
8. group_invites
9. group_participants
10. groups
11. access_audit_log
12. notification_history
13. notification_settings
14. privacy_settings
15. security_alerts
16. status_stories
17. user_roles
18. evolution_settings (apenas se company_id não for NULL)
19. company_users

#### PASSO 2: CNPJ Único
```sql
ALTER TABLE companies
ADD CONSTRAINT unique_company_cnpj UNIQUE (cnpj);
```

#### PASSO 3: Índice de Performance
```sql
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
```

#### PASSO 4: CASCADE DELETE (19 tabelas principais)
Adiciona `ON DELETE CASCADE` para todas as foreign keys.

#### PASSO 5-6: Validação de CNPJ
- Função `validate_unique_cnpj()`
- Trigger `trigger_validate_unique_cnpj`

#### PASSO 7: Comentários
Documenta as constraints e funções.

#### PASSO 8: Mensagens de Sucesso
Informa o que foi feito.

### Tabelas Opcionais

Para tabelas que podem não existir ainda (criadas em migrations posteriores), a limpeza também é feita dentro de blocos condicionais:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_notes') THEN
    -- Limpar órfãos
    DELETE FROM contact_notes WHERE company_id NOT IN (SELECT id FROM companies);

    -- Adicionar CASCADE
    ALTER TABLE contact_notes
    DROP CONSTRAINT IF EXISTS contact_notes_company_id_fkey,
    ADD CONSTRAINT contact_notes_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES companies(id)
      ON DELETE CASCADE;
  END IF;
END $$;
```

**15 Tabelas Opcionais:**
1. contact_notes
2. custom_fields
3. custom_field_values
4. segments
5. pipelines
6. pipeline_stages
7. deals
8. tasks
9. campaigns
10. campaign_contacts
11. queues
12. queue_members
13. company_members
14. teams
15. company_invites

## 📊 O que a Migration Vai Fazer?

Quando você executar a migration, ela vai:

1. ✅ **Contar e remover** todos os dados órfãos
2. ✅ **Mostrar no log** quantos registros foram removidos de cada tabela
3. ✅ **Adicionar CNPJ único** sem conflitos
4. ✅ **Adicionar CASCADE DELETE** em 34 tabelas
5. ✅ **Criar validação de CNPJ** duplicado

### Exemplo de Output Esperado:

```
NOTICE: Removidos 5 registros órfãos de labels
NOTICE: Removidos 12 registros órfãos de contacts
NOTICE: Removidos 3 registros órfãos de conversations
NOTICE: ✅ Limpeza de dados órfãos concluída!
NOTICE: ✅ Cascade delete configurado com sucesso!
NOTICE: ✅ CNPJ único garantido!
NOTICE: 📋 Ao deletar uma empresa, TODOS os dados relacionados serão removidos automaticamente
NOTICE: 🔒 CNPJs duplicados serão bloqueados na inserção/atualização
```

## 🚀 Como Aplicar

### Via Supabase Dashboard (Recomendado para ver os logs):

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute as migrations na ordem:

**Migration 1:**
```sql
-- Cole o conteúdo de: supabase/migrations/20251129000001_add_evolution_api_config.sql
```

**Migration 2 (esta correção):**
```sql
-- Cole o conteúdo de: supabase/migrations/20251129000002_company_cascade_and_unique_cnpj.sql
```

**Migration 3:**
```sql
-- Cole o conteúdo de: supabase/migrations/20251129000003_add_company_delete_policy.sql
```

5. **IMPORTANTE**: Leia os NOTICE no output para ver quantos registros órfãos foram removidos

### Via Supabase CLI:

```bash
cd C:\Users\Giuliano\Documents\evo-talk-gateway-main
supabase db push
```

## ⚠️ ATENÇÃO: Dados Serão Deletados

A migration vai **DELETAR PERMANENTEMENTE** todos os dados órfãos encontrados.

### Isto é seguro?

✅ **SIM**, porque esses dados já estão "quebrados":
- Referenciam empresas que não existem
- Não podem ser acessados pela aplicação
- Causam erros de integridade referencial
- Impedem a criação de constraints CASCADE

### Preciso fazer backup?

Se você quiser **investigar** quais dados serão removidos antes, execute este SQL:

```sql
-- Verificar dados órfãos ANTES da migration
SELECT
  'labels' as tabela,
  COUNT(*) as orfaos
FROM labels
WHERE company_id NOT IN (SELECT id FROM companies)
UNION ALL
SELECT
  'contacts',
  COUNT(*)
FROM contacts
WHERE company_id NOT IN (SELECT id FROM companies)
UNION ALL
SELECT
  'conversations',
  COUNT(*)
FROM conversations
WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies)
-- ... adicione outras tabelas se quiser
;
```

## 🎯 Resultado Final

Após aplicar as 3 migrations:

✅ Botão de deletar empresa funciona
✅ Deletar empresa remove TODOS os dados relacionados automaticamente
✅ CNPJ duplicado é bloqueado
✅ Dados órfãos não existem mais
✅ Banco de dados limpo e íntegro

---

**Data da correção**: 29/11/2025
**Arquivo**: `supabase/migrations/20251129000002_company_cascade_and_unique_cnpj.sql`
**Problema corrigido**: Dados órfãos impedindo criação de foreign key constraints
