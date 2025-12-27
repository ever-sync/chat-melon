# Configuração de Cron Job para Refresh das Materialized Views

## Visão Geral

As materialized views do dashboard precisam ser atualizadas periodicamente para manter os dados atualizados. Este documento descreve como configurar o refresh automático.

## Opções de Implementação

### Opção 1: Supabase Edge Function (Recomendado)

A Edge Function `refresh-dashboard-views` foi criada para ser chamada via cron job externo.

#### Configuração com Vercel Cron

1. Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/refresh-dashboard",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. Crie `api/refresh-dashboard.ts`:

```typescript
import { serve } from '@supabase/functions-js/edge';

export default async function handler(req: Request) {
  const url = `${process.env.SUPABASE_URL}/functions/v1/refresh-dashboard-views`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return new Response(JSON.stringify(await response.json()), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

#### Configuração com GitHub Actions

Crie `.github/workflows/refresh-dashboard.yml`:

```yaml
name: Refresh Dashboard Views

on:
  schedule:
    - cron: '*/5 * * * *'  # A cada 5 minutos
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SUPABASE_URL }}/functions/v1/refresh-dashboard-views"
```

### Opção 2: pg_cron (Se Disponível)

Se seu plano Supabase tiver acesso ao `pg_cron`, descomente as linhas no arquivo de migração:

```sql
SELECT cron.schedule(
  'refresh-dashboard-views',
  '*/5 * * * *',
  $$SELECT refresh_dashboard_views_safe();$$
);
```

### Opção 3: Triggers Automáticos

Os triggers criados na migração notificam quando dados mudam, mas não atualizam as views automaticamente. Para atualização automática, você pode:

1. Criar uma Edge Function que escuta os eventos
2. Usar um webhook que chama a função de refresh

## Verificação

Para verificar se o refresh está funcionando:

```sql
-- Ver última atualização das views
SELECT 
  schemaname,
  matviewname,
  hasindexes,
  ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname LIKE 'dashboard_%';

-- Forçar refresh manual
SELECT refresh_dashboard_views();
```

## Monitoramento

Monitore o refresh através de:

1. Logs da Edge Function no Supabase Dashboard
2. Métricas de performance do dashboard
3. Verificação periódica das views materializadas

## Troubleshooting

### Views não estão sendo atualizadas

1. Verifique se os triggers estão criados:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'refresh_%';
```

2. Verifique se a função existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'refresh_dashboard_views';
```

3. Teste manualmente:
```sql
SELECT refresh_dashboard_views();
```

### Performance degradada

- Considere aumentar o intervalo de refresh (10 minutos em vez de 5)
- Verifique se há muitas atualizações simultâneas
- Monitore o uso de recursos do banco

## Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)

