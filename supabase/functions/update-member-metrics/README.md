# Update Member Metrics Edge Function

Esta Edge Function atualiza automaticamente as métricas diárias dos vendedores (company_members).

## O que ela faz

Coleta e agrega métricas para cada vendedor ativo:

### Métricas de Chat
- Conversas atribuídas
- Conversas resolvidas
- Mensagens enviadas
- Tempo médio de primeira resposta
- Tempo médio de resposta

### Métricas de CRM
- Deals criados
- Deals ganhos
- Deals perdidos
- Valor de deals ganhos
- Valor de deals perdidos

### Métricas de Satisfação (futuro)
- Respostas CSAT
- Soma CSAT
- NPS (promotores, passivos, detratores)

## Como funcionar

### 1. A função é executada automaticamente via CRON

Execute o SQL em `supabase/setup-metrics-cron.sql` no SQL Editor do Supabase para configurar o cron job que roda a cada hora.

### 2. Executar manualmente

Você pode chamar a função manualmente via HTTP:

```bash
curl -X POST \
  'https://heipukzowidsktcepxwr.supabase.co/functions/v1/update-member-metrics' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaXB1a3pvd2lkc2t0Y2VweHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTU2MTIsImV4cCI6MjA3OTU5MTYxMn0.S_duMoQlhugqZNn3U9JC6xAvFlqQlWdMS5igv8uhht0' \
  -H 'Content-Type: application/json'
```

### 3. Verificar execução

Verifique os logs da função no Supabase Dashboard:
- Lovable Cloud → Functions → update-member-metrics → Logs

## Tabelas envolvidas

### Leitura
- `companies` - empresas ativas
- `company_members` - membros ativos
- `conversations` - conversas do dia
- `messages` - mensagens enviadas
- `deals` - negócios criados/ganhos/perdidos
- `sales_goals` - metas dos vendedores

### Escrita
- `member_metrics_daily` - métricas agregadas (upsert)
- `sales_goals` - atualização de progresso das metas

## Configuração

A função está configurada em `supabase/config.toml`:

```toml
[functions.update-member-metrics]
verify_jwt = false
```

**Importante**: `verify_jwt = false` é necessário para permitir chamadas via CRON job.

## Monitoramento

Para ver o histórico de execuções do CRON:

```sql
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'update-member-metrics-hourly'
) 
ORDER BY start_time DESC 
LIMIT 10;
```
