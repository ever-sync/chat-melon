# 📧 Configuração do Sistema de Emails

Este documento explica como configurar o envio de emails no sistema usando Resend.

## 🔧 Configuração

### 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Após criar a conta, vá para [API Keys](https://resend.com/api-keys)
4. Clique em "Create API Key"
5. Copie a chave gerada (começa com `re_`)

### 2. Configurar variáveis no Supabase (PRODUÇÃO)

As Edge Functions precisam de variáveis de ambiente configuradas no Supabase Dashboard:

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings** → **Edge Functions** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
RESEND_API_KEY=re_sua_chave_aqui
APP_URL=https://seu-dominio.com
```

**IMPORTANTE:** O `APP_URL` deve ser a URL onde seu aplicativo está hospedado (ex: `https://melonchat.com.br`)

### 3. Configurar variáveis localmente (DESENVOLVIMENTO)

Para testar localmente:

1. Edite o arquivo `supabase/.env.local`
2. Substitua o valor de `RESEND_API_KEY` pela sua chave do Resend
3. Ajuste `APP_URL` se necessário (padrão: `http://localhost:5173`)

```env
RESEND_API_KEY=re_sua_chave_aqui
APP_URL=http://localhost:5173
```

### 4. Verificar domínio no Resend (OBRIGATÓRIO para enviar para outros emails)

**IMPORTANTE:** Sem verificar um domínio, você só pode enviar emails para o endereço usado para criar a conta no Resend!

#### Por que preciso verificar um domínio?

O Resend, no plano gratuito, permite:
- ✅ Enviar para o seu próprio email (o da conta Resend)
- ❌ Enviar para outros emails SEM domínio verificado

Para enviar convites para sua equipe, você PRECISA verificar um domínio.

#### Como verificar o domínio:

1. No dashboard do Resend, vá em **Domains** (https://resend.com/domains)
2. Clique em "Add Domain"
3. Digite seu domínio (ex: `eversync.space` ou `melonchat.com.br`)
4. O Resend vai mostrar 3 registros DNS que você precisa adicionar:
   - **SPF** (TXT)
   - **DKIM** (TXT)
   - **DMARC** (TXT)

5. **Adicione esses registros no seu provedor de DNS:**
   - Se usar Cloudflare: Dashboard → DNS → Add record
   - Se usar Registro.br: Painel → DNS → Adicionar registro
   - Se usar Hostinger/Locaweb: Painel de controle → Zona DNS

6. Aguarde a propagação (pode levar até 24h, mas geralmente 5-15 minutos)

7. No Resend, clique em "Verify" para verificar o domínio

8. **Após verificado**, edite `supabase/functions/send-invite-email/index.ts` na linha 113:

```typescript
from: "MelonChat <convites@eversync.space>",  // Usar seu domínio verificado
```

9. Faça o redeploy da função:
```bash
npx supabase functions deploy send-invite-email
```

#### Alternativa temporária (apenas para testes):

Se você não tem um domínio ou não quer configurar DNS agora, você pode:
- Enviar convites apenas para **app@eversync.space** (seu email do Resend)
- Usar outro serviço de email como SMTP tradicional
- Aguardar para configurar o domínio depois

## ✅ Testar a configuração

### Teste local:

```bash
# 1. Inicie o Supabase local
npx supabase start

# 2. Sirva a Edge Function
npx supabase functions serve send-invite-email --env-file supabase/.env.local

# 3. Em outro terminal, teste:
curl -X POST http://localhost:54321/functions/v1/send-invite-email \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invite_id": "test-id",
    "email": "seu-email@gmail.com",
    "role": "seller",
    "company_name": "Teste",
    "invited_by_name": "Admin"
  }'
```

### Teste em produção:

1. Vá em **Configurações** → **Usuários**
2. Clique em "Convidar Usuário"
3. Digite um email válido
4. Escolha um cargo
5. Clique em "Enviar Convite"
6. Verifique a caixa de entrada do email (e spam também)

## 🚨 Problemas Comuns

### Email não está chegando

1. **Verifique as variáveis de ambiente:**
   ```bash
   # No Supabase Dashboard, confira se RESEND_API_KEY e APP_URL estão configurados
   ```

2. **Verifique os logs da Edge Function:**
   ```bash
   # No Supabase Dashboard:
   # Edge Functions → send-invite-email → Logs
   ```

3. **Verifique a caixa de spam** do destinatário

4. **Verifique se a chave do Resend é válida:**
   - Entre no [Resend Dashboard](https://resend.com/api-keys)
   - Confirme que a chave não foi revogada

### Erro "Missing Authorization header"

- O usuário precisa estar autenticado para enviar convites
- Faça login antes de tentar enviar o convite

### Erro na API do Resend

- Verifique se não ultrapassou o limite de emails do plano gratuito (100/dia)
- Verifique se o domínio está verificado (para usar domínios personalizados)

## 📚 Referências

- [Documentação do Resend](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Verificação de Domínio no Resend](https://resend.com/docs/dashboard/domains/introduction)
