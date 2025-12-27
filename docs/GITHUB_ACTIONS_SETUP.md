# Configuração do GitHub Actions para Refresh do Dashboard

## ✅ O que foi criado

- `.github/workflows/refresh-dashboard.yml` - Workflow do GitHub Actions
- Executa automaticamente a cada 5 minutos
- **100% GRATUITO** - funciona em qualquer plano do GitHub

## 🚀 Como Configurar

### Passo 1: Adicionar Secrets no GitHub

1. Vá até o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

Adicione os seguintes secrets:

#### Secret 1: `SUPABASE_URL`
- **Nome:** `SUPABASE_URL`
- **Valor:** `https://nmbiuebxhovmwxrbaxsz.supabase.co`

#### Secret 2: `SUPABASE_ANON_KEY`
- **Nome:** `SUPABASE_ANON_KEY`
- **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYml1ZWJ4aG92bXd4cmJheHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDUyOTYsImV4cCI6MjA3OTc4MTI5Nn0._plGgsBhPeuk2T3GR4XNKzkygdN-wwkD9Gk7TP0e4LM`

### Passo 2: Fazer Commit e Push do Workflow

O arquivo `.github/workflows/refresh-dashboard.yml` já está criado. Agora você precisa fazer commit:

```bash
git add .github/workflows/refresh-dashboard.yml
git commit -m "Add GitHub Actions workflow for dashboard refresh"
git push origin main
```

### Passo 3: Verificar se o Workflow está Ativo

1. Vá até o seu repositório no GitHub
2. Clique na aba **Actions**
3. Você deve ver o workflow **"Refresh Dashboard Views"** listado
4. O workflow começará a executar automaticamente a cada 5 minutos

### Passo 4: Testar Manualmente (Opcional)

Antes de esperar 5 minutos, você pode testar imediatamente:

1. Vá em **Actions** no GitHub
2. Clique em **Refresh Dashboard Views** (no menu lateral)
3. Clique no botão **Run workflow** (dropdown)
4. Clique em **Run workflow** (botão verde)
5. Aguarde alguns segundos e veja o resultado

## 📊 Como Monitorar

### Ver Execuções

1. Vá em **Actions** no GitHub
2. Clique em **Refresh Dashboard Views**
3. Você verá todas as execuções (passadas e futuras)
4. Clique em qualquer execução para ver os logs detalhados

### O que Esperar nos Logs

**Sucesso (✅):**
```
🔄 Iniciando refresh das views materializadas do dashboard...
📊 HTTP Status: 200
📄 Response: {"success":true,"message":"Views refreshed"}
✅ Dashboard views refreshed successfully!
```

**Erro (❌):**
```
🔄 Iniciando refresh das views materializadas do dashboard...
📊 HTTP Status: 500
📄 Response: {"error":"..."}
❌ Failed to refresh dashboard views
⚠️  Please check Supabase Edge Function logs
```

## ⚙️ Ajustar Frequência

Para alterar a frequência do refresh, edite `.github/workflows/refresh-dashboard.yml`:

```yaml
on:
  schedule:
    - cron: '*/10 * * * *'  # A cada 10 minutos
    # - cron: '*/15 * * * *'  # A cada 15 minutos
    # - cron: '0 * * * *'     # A cada hora
    # - cron: '0 */2 * * *'   # A cada 2 horas
    # - cron: '0 0 * * *'     # Uma vez por dia à meia-noite UTC
```

### Sintaxe do Cron

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

**Exemplos:**
- `*/5 * * * *` - A cada 5 minutos
- `*/15 * * * *` - A cada 15 minutos
- `0 */2 * * *` - A cada 2 horas (no minuto 0)
- `0 0 * * *` - Todo dia à meia-noite UTC
- `0 9,17 * * *` - Às 9h e 17h UTC todos os dias
- `0 0 * * 0` - Todo domingo à meia-noite

**⚠️ Importante:** Os horários são em **UTC**, não no fuso horário local!

## 🔧 Troubleshooting

### Erro: "Secret not found"

**Problema:** Os secrets não foram configurados corretamente.

**Solução:**
1. Vá em Settings → Secrets and variables → Actions
2. Verifique se `SUPABASE_URL` e `SUPABASE_ANON_KEY` existem
3. Certifique-se que os nomes estão corretos (case-sensitive)

### Erro: HTTP 404 ou 500

**Problema:** A Edge Function não existe ou teve erro.

**Solução:**
1. Verifique se a migration foi aplicada: `npx supabase migration list`
2. Verifique se a Edge Function foi deployada:
   ```bash
   npx supabase functions deploy refresh-dashboard-views
   ```
3. Veja os logs da Edge Function no Supabase Dashboard

### Workflow não está executando

**Problema:** O workflow não aparece na aba Actions.

**Solução:**
1. Certifique-se de fazer commit e push do arquivo `.github/workflows/refresh-dashboard.yml`
2. Verifique se o arquivo está na branch principal (main/master)
3. Aguarde alguns minutos - o GitHub pode demorar para detectar

### Workflow está pausado

**Problema:** GitHub pode pausar workflows automáticos após 60 dias de inatividade do repositório.

**Solução:**
1. Vá em Actions
2. Clique em "Enable workflow" se aparecer o aviso
3. Ou faça um commit qualquer para reativar

## 💰 Custos

**GitHub Actions é GRATUITO:**
- ✅ Repositórios públicos: **Ilimitado**
- ✅ Repositórios privados: **2.000 minutos/mês** (plano Free)
- ✅ Este workflow usa ~1 minuto por dia = **30 minutos/mês**

Você está **muito longe** de atingir o limite!

## 🆚 Comparação com Vercel Cron

| Recurso | GitHub Actions | Vercel Cron |
|---------|---------------|-------------|
| **Custo** | ✅ Gratuito | ❌ Requer plano Pro ($20/mês) |
| **Repositórios Públicos** | ✅ Ilimitado | ✅ Sim |
| **Repositórios Privados** | ✅ 2000 min/mês | ❌ Pago |
| **Configuração** | ⚠️ Precisa de secrets | ✅ Mais simples |
| **Logs** | ✅ Excelentes | ✅ Bons |
| **Confiabilidade** | ✅ Alta | ✅ Alta |

**Recomendação:** Use GitHub Actions se você tem repositório público ou não quer pagar pelo Vercel Pro.

## ✅ Checklist Final

Antes de considerar tudo pronto, verifique:

- [ ] Arquivo `.github/workflows/refresh-dashboard.yml` commitado e pushado
- [ ] Secret `SUPABASE_URL` adicionado no GitHub
- [ ] Secret `SUPABASE_ANON_KEY` adicionado no GitHub
- [ ] Workflow aparece na aba Actions
- [ ] Teste manual executado com sucesso (✅ verde)
- [ ] Edge Function está deployada no Supabase
- [ ] Migrations aplicadas no banco de dados

## 📚 Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Syntax Reference](https://crontab.guru/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Tudo pronto!** O GitHub Actions vai atualizar automaticamente suas views materializadas do dashboard a cada 5 minutos. 🎉
