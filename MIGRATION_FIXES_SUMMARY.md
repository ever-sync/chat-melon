# 🔧 Resumo das Correções nas Migrations

## Problema Encontrado

Ao tentar aplicar as migrations com `npx supabase db push --include-all`, encontramos erros de duplicação:
- Tabelas já existentes
- Índices já existentes
- Policies já existentes
- Triggers já existentes

## Correções Aplicadas

### 1. ✅ Tabelas e Índices (fix-migrations.ps1)
- Adicionado `IF NOT EXISTS` em todos os `CREATE TABLE`
- Adicionado `IF NOT EXISTS` em todos os `CREATE INDEX`
- Adicionado `IF NOT EXISTS` em todos os `CREATE UNIQUE INDEX`
- **Arquivos corrigidos:** 20
- **Correções aplicadas:** ~103

### 2. ✅ Policies (fix-policies.ps1)
- Adicionado `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`
- **Arquivos corrigidos:** 52
- **Policies corrigidas:** 306+

### 3. ✅ Triggers
- Adicionado `DROP TRIGGER IF EXISTS` antes dos `CREATE TRIGGER`
- Corrigido manualmente em migrations específicas

### 4. ✅ Duplicações Corrigidas
- Removido `IF NOT EXISTS IF NOT EXISTS` duplicado em 3 arquivos:
  - 20251213000001_quick_response_shortcuts.sql
  - 20251213000002_conversation_snooze.sql
  - 20251215000004_phase5_enterprise.sql

## Arquivos de Script Criados

1. **fix-migrations.ps1** - Corrige tabelas e índices
2. **fix-policies.ps1** - Corrige policies
3. **MIGRATION_FIXES_SUMMARY.md** - Este arquivo (documentação)

## Migrations Pendentes de Aplicação

Total: **40 migrations** aguardando deploy

### Fase 2: CRM & Automation
- 20251202000002_create_internal_chat.sql
- 20251204000001_contact_cascade_delete.sql
- 20251204000002_add_copilot_script.sql
- 20251204000003_add_ai_provider_keys.sql
- 20251204000004_add_piloto_pro.sql
- 20251204000005_add_groq_api_key.sql
- 20251205000001_add_agent_name.sql
- 20251206000001_add_profile_fields.sql
- 20251209000000_create_company_faqs.sql
- 20251209010000_create_faq_categories.sql
- 20251209020000_create_company_documents.sql
- 20251209030000_sync_profile_pics_to_conversations.sql
- 20251209040000_create_product_categories_and_custom_fields.sql
- 20251209041000_create_product_settings.sql
- 20251209050000_create_contact_structure.sql
- 20251209232000_create_missing_tables.sql
- 20251210000000_fix_contacts_rls.sql
- 20251210000001_add_missing_features.sql
- 20251210000002_super_admin_policies.sql
- 20251210000003_seed_achievements.sql
- 20251210000004_create_webhooks_table.sql

### Fase 3: Core Features
- 20251213000001_quick_response_shortcuts.sql
- 20251213000002_conversation_snooze.sql
- 20251213000003_widget_settings.sql
- 20251213000004_api_keys_webhooks.sql
- 20251214000000_audio_transcription.sql
- 20251214000001_channels_multichannel.sql
- 20251214000001_knowledge_base_rag.sql
- 20251214000002_chatbot_builder.sql

### Fase 3, 4, 5: Advanced Features
- 20251215000001_phase3_ecommerce_automation.sql
- 20251215000002_add_phase2_phase3_features.sql
- 20251215000003_phase4_analytics_integrations.sql
- 20251215000004_phase5_enterprise.sql
- 20251215000005_channels_omnichannel.sql
- 20251216000001_cadence_automation.sql
- 20251216000002_audit_log_triggers.sql
- 20251216000003_response_time_metrics.sql
- 20251216000004_auto_assignment_sla_routing.sql ⭐
- 20251216000005_phase4_advanced_features.sql ⭐
- 20251216000006_phase5_complete_enterprise.sql ⭐

## Como Aplicar

```bash
# Aplicar todas as migrations pendentes
npx supabase db push --include-all
```

## Validação Pós-Deploy

Após aplicar com sucesso, validar:

```sql
-- Verificar tabelas criadas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Esperado: ~68 tabelas

-- Verificar funções
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public';
-- Esperado: ~41 funções

-- Verificar policies
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public';
-- Esperado: ~100+ policies
```

## Status

- ✅ Todas migrations corrigidas
- ✅ Scripts de correção criados
- ✅ Documentação atualizada
- ✅ **108 migrations aplicadas com sucesso no banco!**

## Erros Corrigidos Durante Deploy

### 6. ❌ View Column Name Conflict → ✅ Resolvido
**Erro:** `cannot change name of view column "company_id" to "avatar_url"`
**Fix:** Adicionado `DROP VIEW IF EXISTS` antes de `CREATE VIEW online_users`
**Arquivo:** `20251202000002_create_internal_chat.sql`

### 7. ❌ Policy Already Exists → ✅ Resolvido
**Erro:** `policy "Users can view their company faqs" already exists`
**Fix:** Script `fix-policies.ps1` processou mais arquivos manualmente
**Arquivos:** `20251209000000_create_company_faqs.sql`

### 8. ❌ Incomplete Table Names in DROP POLICY → ✅ Resolvido
**Erro:** `relation "public" does not exist`
**Fix:** Script `fix-incomplete-policy-drops.ps1` corrigiu `ON public;` para `ON public.table_name;`
**Arquivos:** 73+ statements corrigidos em `20251124212012_remix_migration_from_pg_dump.sql`

### 9. ❌ Trigger Already Exists → ✅ Resolvido
**Erro:** `trigger "update_product_categories_timestamp" already exists`
**Fix:** Script `fix-triggers.ps1` adicionou `DROP TRIGGER IF EXISTS` em 30 arquivos
**Total corrigido:** 50+ triggers

### 10. ❌ Column Ambiguity in INSERT → ✅ Resolvido
**Erro:** `column "is_active" does not exist`
**Fix:** Removidas colunas inexistentes (`category_id`, `is_active`) do INSERT
**Arquivo:** `20251214000003_knowledge_base_rag.sql` (renomeado)

### 11. ❌ Duplicate Migration Timestamps → ✅ Resolvido
**Erro:** `duplicate key value violates unique constraint "schema_migrations_pkey"`
**Fix:** Renomeado `20251214000001_knowledge_base_rag.sql` → `20251214000003_knowledge_base_rag.sql`

### 12. ❌ Column p.role Does Not Exist → ✅ Resolvido
**Erro:** `column p.role does not exist`
**Fix:** Substituído `p.role` por `cm.role` (role está em company_members)
**Arquivos:** `20251215000004_phase5_enterprise.sql`, `20251216000006_phase5_complete_enterprise.sql`

### 13. ❌ Nested Dollar Quotes in Cron → ✅ Resolvido
**Erro:** `syntax error at or near "SELECT"`
**Fix:** Alterado delimitadores de `$$` para `$OUTER$` e `$INNER$`
**Arquivo:** `20251216000001_cadence_automation.sql`

### 14. ❌ TG_OP in WHEN Clause → ✅ Resolvido
**Erro:** `column "tg_op" does not exist`
**Fix:** Removida cláusula `WHEN (TG_OP = 'DELETE' OR ...)` do CREATE TRIGGER
**Arquivo:** `20251216000002_audit_log_triggers.sql`

### 15. ❌ Invalid Enum Values → ✅ Resolvido
**Erro:** `invalid input value for enum conversation_status: "resolved"`
**Fix:** Substituído valores inválidos ('resolved' → 'closed', 'open' → 'active', 'pending' → 'waiting')
**Arquivo:** `20251216000005_phase4_advanced_features.sql`

### 16. ❌ Non-existent Columns in View → ✅ Resolvido
**Erro:** `column c.rating does not exist`
**Fix:** Removidas colunas inexistentes (`rating`, `resolved_at`) da materialized view
**Arquivo:** `20251216000005_phase4_advanced_features.sql`

## Scripts de Correção Criados

1. **fix-migrations.ps1** - Adiciona IF NOT EXISTS em tabelas e índices
2. **fix-policies.ps1** - Adiciona DROP POLICY IF EXISTS
3. **fix-incomplete-policy-drops.ps1** - Corrige DROP POLICY ON public; incompletos
4. **fix-triggers.ps1** - Adiciona DROP TRIGGER IF EXISTS

---

**Última atualização:** 16/12/2025
**Status:** ✅ **DEPLOY CONCLUÍDO COM SUCESSO!** 🎉
