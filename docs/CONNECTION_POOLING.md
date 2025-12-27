# Connection Pooling - MelonChat

## Visão Geral

O MelonChat suporta connection pooling através do Supabase Pooler para melhorar o desempenho e escalabilidade em ambientes com muitas requisições simultâneas.

## O que é Connection Pooling?

Connection pooling é uma técnica que mantém um conjunto de conexões de banco de dados reutilizáveis, reduzindo a sobrecarga de criar e destruir conexões para cada requisição. Isso é especialmente importante quando você tem muitos usuários simultâneos.

## Benefícios

- **Redução de conexões simultâneas**: O pooler gerencia conexões de forma eficiente
- **Melhor performance**: Menos overhead de criação/destruição de conexões
- **Escalabilidade**: Suporta mais requisições simultâneas
- **Economia de recursos**: Menos conexões = menos uso de recursos do banco

## Configuração

### 1. Obter URL do Pooler

No dashboard do Supabase:

1. Acesse **Settings** > **Database**
2. Role até a seção **Connection Pooling**
3. Copie a URL do pooler (formato: `https://[project-ref].pooler.supabase.com`)

### 2. Configurar Variável de Ambiente

Adicione a URL do pooler no arquivo `.env`:

```bash
# URL do pooler (opcional, usado apenas em produção)
VITE_SUPABASE_POOLER_URL=https://[project-ref].pooler.supabase.com
```

**Nota**: A URL do pooler é diferente da URL normal do Supabase. Ela termina com `.pooler.supabase.com` em vez de `.supabase.co`.

### 3. Comportamento

- **Produção**: Se `VITE_SUPABASE_POOLER_URL` estiver configurada, usa o pooler
- **Desenvolvimento**: Sempre usa conexão direta (facilita debugging)
- **Fallback**: Se pooler não estiver configurado, usa URL normal

## Como Funciona

O código detecta automaticamente:

1. Se está em produção (`isProduction`)
2. Se `VITE_SUPABASE_POOLER_URL` está configurada
3. Se ambos são verdadeiros, usa pooler; caso contrário, usa conexão direta

```typescript
// src/integrations/supabase/client.ts
const url = env.VITE_SUPABASE_POOLER_URL && isProduction
  ? env.VITE_SUPABASE_POOLER_URL
  : env.VITE_SUPABASE_URL;
```

## Verificação

O console do navegador mostrará:

- `✅ Connection pooling habilitado` - Pooler ativo
- `ℹ️ Pooler URL configurada, mas não está em produção` - Pooler configurado mas em dev
- `ℹ️ Usando conexão direta (pooler não configurado)` - Pooler não configurado

## Limitações

- O pooler só é usado em **produção**
- Algumas funcionalidades podem não estar disponíveis via pooler (verifique documentação do Supabase)
- O pooler pode ter limites de conexões simultâneas (depende do plano)

## Monitoramento

No dashboard do Supabase, você pode monitorar:

- Número de conexões ativas
- Uso do pooler
- Métricas de performance

## Troubleshooting

### Pooler não está sendo usado

1. Verifique se `VITE_SUPABASE_POOLER_URL` está configurada
2. Verifique se está em produção (`MODE=production`)
3. Verifique o console do navegador para mensagens de log

### Erros de conexão

1. Verifique se a URL do pooler está correta
2. Verifique se o projeto tem acesso ao pooler (planos Pro+)
3. Tente usar conexão direta temporariamente para isolar o problema

## Referências

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Pooler Best Practices](https://supabase.com/docs/guides/database/connection-pooling)

