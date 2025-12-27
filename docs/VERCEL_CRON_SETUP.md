# Configuração do Vercel Cron para Refresh do Dashboard

## O que foi criado

- ✅ `app/api/cron/refresh-dashboard/route.ts` - API endpoint para refresh
- ✅ `vercel.json` - Configuração do cron job
- ✅ Variável `CRON_SECRET` adicionada ao `.env`

## Como Funciona

O Vercel vai chamar automaticamente o endpoint `/api/cron/refresh-dashboard` a cada 5 minutos, que por sua vez vai chamar a Edge Function do Supabase para atualizar as views materializadas do dashboard.

## Passos para Configurar no Vercel

### 1. Gerar um CRON_SECRET Seguro

Abra o terminal e execute:

```bash
# Gerar um token aleatório seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o valor gerado e atualize no `.env`:

```bash
CRON_SECRET=<token-gerado-aqui>
```

### 2. Configurar Variáveis de Ambiente no Vercel

Vá até o dashboard do Vercel:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `CRON_SECRET` | `<seu-token-gerado>` | Production, Preview, Development |
| `VITE_SUPABASE_URL` | `https://nmbiuebxhovmwxrbaxsz.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

### 3. Deploy no Vercel

O Vercel vai detectar automaticamente o arquivo `vercel.json` e configurar o cron job.

```bash
# Se ainda não fez deploy
vercel

# Ou via Git (push para main/master)
git add .
git commit -m "Add Vercel cron for dashboard refresh"
git push
```

### 4. Verificar se o Cron está Ativo

Após o deploy:

1. Vá em **Settings** > **Cron Jobs** no dashboard do Vercel
2. Você deve ver o cron job listado com schedule `*/5 * * * *`
3. Clique em **Trigger** para testar manualmente

### 5. Monitorar Execuções

Para ver se o cron está funcionando:

1. Vá em **Deployments** > **Functions**
2. Procure por execuções de `/api/cron/refresh-dashboard`
3. Verifique os logs para confirmar sucesso

## Testando Localmente

Para testar localmente antes do deploy:

```bash
# Instale o Vercel CLI se ainda não tiver
npm i -g vercel

# Execute em modo dev
vercel dev

# Em outro terminal, teste o endpoint
curl -X GET http://localhost:3000/api/cron/refresh-dashboard \
  -H "Authorization: Bearer <seu-CRON_SECRET>"
```

## Ajustando a Frequência

Para alterar a frequência do refresh, edite o `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-dashboard",
      "schedule": "*/10 * * * *"  // A cada 10 minutos
      // "schedule": "0 * * * *"  // A cada hora
      // "schedule": "0 0 * * *"  // Uma vez por dia à meia-noite
    }
  ]
}
```

### Formatos de Schedule (Cron Syntax)

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = domingo)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

Exemplos:
- `*/5 * * * *` - A cada 5 minutos
- `*/15 * * * *` - A cada 15 minutos
- `0 */2 * * *` - A cada 2 horas
- `0 0 * * *` - Uma vez por dia à meia-noite
- `0 9,17 * * *` - Às 9h e 17h todos os dias

## Segurança

O endpoint está protegido por:

1. **Bearer Token**: Apenas requisições com o `CRON_SECRET` correto são aceitas
2. **Vercel automatically adds this header**: O Vercel adiciona automaticamente o header de autorização nas chamadas de cron

## Troubleshooting

### Erro 401 Unauthorized

- Verifique se o `CRON_SECRET` está configurado corretamente no Vercel
- Confirme que o valor no `.env` local é o mesmo do Vercel

### Cron não está executando

- Verifique se o plano do Vercel suporta cron jobs (requer plano Pro ou superior para produção)
- Confirme que o `vercel.json` está na raiz do projeto
- Verifique os logs em **Deployments** > **Functions**

### Edge Function retorna erro

- Verifique se a Edge Function `refresh-dashboard-views` foi deployada no Supabase
- Confirme que as migrations foram aplicadas
- Verifique os logs da Edge Function no Supabase Dashboard

## Alternativa: GitHub Actions

Se você não usa Vercel ou prefere GitHub Actions, veja o arquivo `.github/workflows/refresh-dashboard.yml` que também foi criado.

## Custos

- **Vercel Free**: Cron jobs **não estão disponíveis**
- **Vercel Pro**: Incluído, com limites generosos
- **Vercel Enterprise**: Sem limites

Se estiver no plano Free, use **GitHub Actions** em vez disso (gratuito).

## Próximos Passos

Após configurar:

1. ✅ Monitorar execuções no Vercel Dashboard
2. ✅ Verificar se as views estão sendo atualizadas (query o Supabase)
3. ✅ Ajustar frequência conforme necessário
4. ✅ Configurar alertas se houver falhas (Vercel Integrations)

---

**Tudo pronto!** O dashboard agora vai ter dados sempre atualizados. 🚀
