# 🚀 GUIA DE DEPLOY - MelonChat Platform

## Aplicação das Migrations no Banco de Dados

---

## ⚠️ PRÉ-REQUISITOS

Antes de começar o deploy, certifique-se de:

- [ ] Ter acesso ao projeto Supabase (remote)
- [ ] Ter o Supabase CLI instalado (`v2.63.1` ou superior)
- [ ] Estar logado: `npx supabase login`
- [ ] Ter linkado o projeto: `npx supabase link --project-ref [seu-project-ref]`
- [ ] Ter backup do banco atual (segurança)

---

## 📋 CHECKLIST PRÉ-DEPLOY

### 1. Verificar Status das Migrations

```bash
# Ver quais migrations estão pendentes
npx supabase migration list
```

**Esperado:** Você verá ~52 migrations locais que não estão no remote.

### 2. Criar Backup (IMPORTANTE!)

```bash
# Via Supabase Dashboard
# Settings > Database > Backup & Restore > Create Backup

# OU via CLI (se possível)
npx supabase db dump > backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Validar Migrations Localmente (Opcional)

Se você tiver Docker rodando, pode testar localmente:

```bash
# Resetar banco local
npx supabase db reset

# Verificar se todas migrations rodam sem erro
npx supabase start
```

---

## 🚀 DEPLOY DAS MIGRATIONS

### Opção 1: Deploy Completo (Recomendado)

Aplica todas as migrations pendentes de uma vez:

```bash
# Aplicar TODAS as migrations pendentes
npx supabase db push --include-all
```

**Quando usar:** Primeira vez aplicando ou quando confia em todas as migrations.

### Opção 2: Deploy Incremental (Mais Seguro)

Aplica apenas as próximas migrations na fila:

```bash
# Aplicar apenas as próximas migrations (sem --include-all)
npx supabase db push
```

**Quando usar:** Quer aplicar gradualmente ou está com dúvidas.

### Opção 3: Deploy Manual (Controle Total)

Se preferir controle total, aplique manualmente:

```bash
# Conectar ao psql
npx supabase db execute

# Copiar e colar o conteúdo de cada migration
# OU
# psql -h [host] -U postgres -d postgres < migration_file.sql
```

---

## 📊 ORDEM DE APLICAÇÃO

As migrations serão aplicadas nesta ordem (automaticamente):

### Fase 1: Base System (~30 migrations)
```
20251124212012_initial_schema.sql
20251125*.sql (15 arquivos)
20251126*.sql (10 arquivos)
20251127*.sql (5 arquivos)
```

### Fase 2: CRM & Automation (~15 migrations)
```
20251128000001_add_subscription_trial_system.sql
20251128000002_seed_subscription_plans.sql
20251128000003_rls_policies_subscription.sql
20251128000050_seed_subscription_plans.sql (renomeado)
20251130*.sql (5 arquivos)
20251201*.sql
20251202*.sql (2 arquivos)
20251204*.sql (5 arquivos)
20251205000001_add_agent_name.sql
20251206000001_add_profile_fields.sql
20251209*.sql (6 arquivos)
20251210*.sql (5 arquivos)
```

### Fase 3: Core Features (4 migrations principais)
```
20251213*.sql (4 arquivos)
20251214*.sql (4 arquivos)
20251215*.sql (5 arquivos)
20251216000001_cadence_automation.sql
20251216000002_audit_log_triggers.sql
20251216000003_response_time_metrics.sql
20251216000004_auto_assignment_sla_routing.sql ⭐
```

### Fase 4: Analytics & Integrations (2 migrations principais)
```
20251215000003_phase4_analytics_integrations.sql
20251216000005_phase4_advanced_features.sql ⭐
```

### Fase 5: Enterprise (2 migrations principais)
```
20251215000004_phase5_enterprise.sql
20251216000006_phase5_complete_enterprise.sql ⭐
```

---

## 🔍 VALIDAÇÃO PÓS-DEPLOY

Após aplicar as migrations, valide:

### 1. Verificar Tabelas Criadas

```sql
-- Contar tabelas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Esperado: ~68 tabelas
```

### 2. Verificar Funções

```sql
-- Contar funções
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Esperado: ~41 funções
```

### 3. Verificar RLS Policies

```sql
-- Verificar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Esperado: ~100+ policies
```

### 4. Verificar Índices

```sql
-- Contar índices
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public';

-- Esperado: ~150+ índices
```

### 5. Testar Funções Principais

```sql
-- Testar dashboard metrics
SELECT get_dashboard_metrics(
  '[seu-company-id]'::UUID,
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Testar auto-assignment
SELECT assign_conversation_to_agent(
  '[conversation-id]'::UUID,
  '[queue-id]'::UUID
);

-- Testar permissões
SELECT user_has_permission(
  '[user-id]'::UUID,
  '[company-id]'::UUID,
  'contacts.read'
);
```

---

## 🛠️ TROUBLESHOOTING

### Erro: "duplicate key value violates unique constraint"

**Problema:** Migration já foi aplicada anteriormente.

**Solução:**
```bash
# Pular migrations já aplicadas
npx supabase migration list
# Verificar quais estão marcadas como aplicadas no remote
# Remover do local ou renomear se necessário
```

### Erro: "relation already exists"

**Problema:** Tabela já existe.

**Solução:**
```sql
-- Modificar migration para usar IF NOT EXISTS
CREATE TABLE IF NOT EXISTS nome_tabela (...);
ALTER TABLE nome_tabela ADD COLUMN IF NOT EXISTS nome_coluna ...;
```

### Erro: "foreign key constraint"

**Problema:** Tentando deletar/alterar registro referenciado.

**Solução:**
```sql
-- Verificar referências
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_name = 'nome_tabela';

-- Usar CASCADE se apropriado
ON DELETE CASCADE
```

### Erro: "connection timeout"

**Problema:** Banco ocupado ou migration muito longa.

**Solução:**
```bash
# Aguardar alguns minutos e tentar novamente
# OU
# Dividir migration em partes menores
```

### Erro: "lock timeout"

**Problema:** Outra transação está bloqueando.

**Solução:**
```sql
-- Verificar locks ativos
SELECT * FROM pg_locks WHERE NOT granted;

-- Aguardar ou cancelar transações conflitantes
```

---

## 📈 PÓS-DEPLOY TASKS

### 1. Refresh Materialized Views

```sql
-- Atualizar views materializadas
REFRESH MATERIALIZED VIEW agent_performance_metrics;
REFRESH MATERIALIZED VIEW sla_metrics_view;
-- Outras views se houver
```

### 2. Seed Data Inicial (Opcional)

```sql
-- Já está nas migrations, mas caso precise reexecutar:

-- Platform features
INSERT INTO platform_features (feature_key, name, ...) VALUES (...);

-- Permissions
INSERT INTO permissions (key, name, ...) VALUES (...);

-- Widget templates
INSERT INTO dashboard_widget_templates (...) VALUES (...);
```

### 3. Configurar Cron Jobs (se aplicável)

Para tarefas agendadas (backup, limpeza, etc):

```sql
-- Exemplo: Backup diário às 2h
SELECT cron.schedule(
  'daily-backup',
  '0 2 * * *',
  $$SELECT perform_backup()$$
);

-- Exemplo: Refresh metrics a cada hora
SELECT cron.schedule(
  'refresh-metrics',
  '0 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY agent_performance_metrics$$
);
```

### 4. Configurar Monitoramento

- [ ] Configurar alertas de erro (Sentry, LogRocket)
- [ ] Monitorar uso de recursos (CPU, RAM, Disco)
- [ ] Configurar alertas de SLA
- [ ] Dashboard de health check

### 5. Testar Integrations

- [ ] WhatsApp via Evolution API
- [ ] Webhooks externos
- [ ] API pública
- [ ] SSO (se configurado)

---

## 🔐 CHECKLIST DE SEGURANÇA

Após deploy, verificar:

### RLS (Row Level Security)
```sql
-- Verificar que TODAS tabelas têm RLS habilitado
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  );

-- Esperado: Nenhum resultado (todas têm policies)
```

### Permissões
```sql
-- Verificar grants
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Criptografia
- [ ] SSL/TLS habilitado no Supabase
- [ ] Credenciais OAuth criptografadas
- [ ] API keys armazenadas de forma segura
- [ ] Backup criptografado

---

## 📊 MONITORAMENTO CONTÍNUO

### Queries para Monitoramento

```sql
-- 1. Performance de queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. Tamanho das tabelas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Uso de índices
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 -- Índices não utilizados
ORDER BY schemaname, tablename;

-- 4. Locks ativos
SELECT
  locktype,
  relation::regclass,
  mode,
  granted,
  pid
FROM pg_locks
WHERE NOT granted;
```

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo:

- [ ] Todas migrations aplicadas com sucesso
- [ ] Nenhum erro nos logs
- [ ] RLS policies validadas
- [ ] Funções testadas
- [ ] Materialized views refreshadas
- [ ] Seed data inserido
- [ ] Cron jobs configurados (se aplicável)
- [ ] Monitoramento ativo
- [ ] Backup verificado
- [ ] Documentação atualizada
- [ ] Time notificado

---

## 🎯 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. **Implementar Frontend**
   - Dashboard administrativo
   - Interface de atendimento
   - Configurações

2. **Testes End-to-End**
   - Fluxos completos de usuário
   - Testes de carga
   - Testes de segurança

3. **Documentação API**
   - Swagger/OpenAPI
   - Exemplos de código
   - Webhooks guide

4. **Onboarding**
   - Setup wizard
   - Tutoriais interativos
   - Documentação de usuário

---

## 📞 SUPORTE

Em caso de problemas durante o deploy:

1. **Verificar logs:**
   ```bash
   npx supabase db logs
   ```

2. **Consultar documentação:**
   - `VALIDATION_REPORT.md` - Validação completa
   - `TECHNICAL_CHECKLIST.md` - Checklist técnico
   - `EXECUTIVE_SUMMARY.md` - Resumo executivo

3. **Rollback (se necessário):**
   ```bash
   # Restaurar backup
   psql -h [host] -U postgres -d postgres < backup_pre_deploy.sql
   ```

---

## 🎉 CONCLUSÃO

**Você está prestes a aplicar 108 migrations que transformarão o MelonChat em uma plataforma enterprise-grade completa!**

**Boa sorte com o deploy! 🚀**

---

**Última atualização:** 16/12/2025
**Versão das Migrations:** 1.0
**Status:** ✅ Pronto para Produção
