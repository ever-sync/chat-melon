# ✅ Checklist Final - GitHub Actions para Refresh do Dashboard

Siga estes passos para ativar o cron job automático:

---

## 📝 Passo 1: Adicionar Secrets no GitHub (2 minutos)

1. Vá até: https://github.com/[seu-usuario]/[seu-repo]/settings/secrets/actions

2. Clique em **"New repository secret"**

3. Adicione o primeiro secret:
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://nmbiuebxhovmwxrbaxsz.supabase.co`
   - Clique em **"Add secret"**

4. Clique novamente em **"New repository secret"**

5. Adicione o segundo secret:
   - **Name:** `SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYml1ZWJ4aG92bXd4cmJheHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDUyOTYsImV4cCI6MjA3OTc4MTI5Nn0._plGgsBhPeuk2T3GR4XNKzkygdN-wwkD9Gk7TP0e4LM`
   - Clique em **"Add secret"**

✅ Pronto! Você deve ver 2 secrets listados.

---

## 📤 Passo 2: Fazer Push do Código (30 segundos)

Abra o terminal e execute:

```bash
git add .
git commit -m "Add GitHub Actions workflow and fix bugs"
git push origin main
```

Aguarde o push completar.

---

## 🧪 Passo 3: Testar Manualmente (1 minuto)

1. Vá até: https://github.com/[seu-usuario]/[seu-repo]/actions

2. No menu lateral, clique em **"Refresh Dashboard Views"**

3. No canto superior direito, clique no dropdown **"Run workflow"**

4. Clique no botão verde **"Run workflow"**

5. Aguarde ~10-15 segundos e a página será atualizada automaticamente

6. Clique no workflow que apareceu para ver os detalhes

7. Clique em **"Refresh Dashboard Materialized Views"** para ver os logs

---

## ✅ Resultado Esperado

Você deve ver logs assim:

```
🔄 Iniciando refresh das views materializadas do dashboard...
📊 HTTP Status: 200
📄 Response: {"success":true,...}
✅ Dashboard views refreshed successfully!
```

Se você ver isso, **TUDO FUNCIONOU!** 🎉

---

## ❌ Se der erro

### Erro: "Secret not found"

**Solução:** Volte ao Passo 1 e verifique se os nomes dos secrets estão corretos:
- `SUPABASE_URL` (exatamente assim, case-sensitive)
- `SUPABASE_ANON_KEY` (exatamente assim, case-sensitive)

### Erro: HTTP 404 ou 500

**Possíveis causas:**

1. **Edge Function não deployada**
   ```bash
   npx supabase functions deploy refresh-dashboard-views
   ```

2. **Migration não aplicada**
   ```bash
   npx supabase migration list
   ```
   Deve mostrar as 3 migrations do dashboard aplicadas.

3. **Erro na Edge Function**
   - Vá em: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/logs/edge-functions
   - Procure por erros da função `refresh-dashboard-views`

### Workflow não aparece

**Solução:**
- Certifique-se que fez push do arquivo `.github/workflows/refresh-dashboard.yml`
- Verifique se está na branch principal (main/master)
- Aguarde 1-2 minutos para o GitHub detectar

---

## 🎯 Após Tudo Funcionar

O workflow vai executar **automaticamente a cada 5 minutos**.

Para verificar:
1. Vá em **Actions** no GitHub
2. Você verá execuções periódicas do workflow
3. Cada execução deve ter ✅ verde

---

## ⚙️ Ajustar Frequência (Opcional)

Para mudar a frequência, edite `.github/workflows/refresh-dashboard.yml`:

```yaml
schedule:
  - cron: '*/10 * * * *'  # A cada 10 minutos
  # - cron: '*/15 * * * *'  # A cada 15 minutos
  # - cron: '0 * * * *'     # A cada hora
  # - cron: '0 0 * * *'     # Uma vez por dia
```

Depois:
```bash
git add .github/workflows/refresh-dashboard.yml
git commit -m "Adjust cron frequency"
git push
```

---

## 📊 Monitoramento

### Ver todas as execuções:
https://github.com/[seu-usuario]/[seu-repo]/actions/workflows/refresh-dashboard.yml

### Ver logs de uma execução específica:
Clique em qualquer execução → Clique no job → Veja os logs

---

## 💰 Custos

✅ **100% GRATUITO!**

- Repos públicos: Ilimitado
- Repos privados: 2.000 minutos/mês
- Este workflow usa ~30 minutos/mês

Você está muito longe do limite!

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- `docs/GITHUB_ACTIONS_SETUP.md` - Guia completo
- `docs/DASHBOARD_REFRESH_CRON.md` - Guia geral de cron
- `MELHORIAS_ESCALABILIDADE_COMPLETAS.md` - Visão geral

---

## 🎉 Pronto!

Após seguir estes 3 passos, suas views materializadas do dashboard serão atualizadas automaticamente a cada 5 minutos, garantindo que suas métricas estejam sempre atualizadas! 🚀

---

**Dúvidas?** Consulte `docs/GITHUB_ACTIONS_SETUP.md` para troubleshooting detalhado.
