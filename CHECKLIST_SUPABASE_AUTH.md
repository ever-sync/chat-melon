# ✅ Checklist de Configuração - Supabase Auth

## Status Atual das Variáveis de Ambiente

✅ Variáveis configuradas no Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `META_VERIFY_TOKEN`
- `OPENAI_API_KEY`
- `RESEND_API_KEY` ✅
- `APP_URL` ✅
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🔧 Configurações Pendentes no Supabase Dashboard

### 1️⃣ Site URL (Authentication Settings)

📍 **Onde:** Supabase Dashboard → Settings → Authentication → URL Configuration

**Campo:** Site URL

**Valor atual:** Provavelmente `http://localhost:3000` ❌

**Valor correto:**
```
http://192.168.15.2:8083
```

**Como configurar:**
1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/auth
2. Procure por "Site URL"
3. Substitua por: `http://192.168.15.2:8083`
4. Clique em "Save"

---

### 2️⃣ Redirect URLs (Authentication Settings)

📍 **Onde:** Supabase Dashboard → Settings → Authentication → URL Configuration

**Campo:** Redirect URLs

**Adicionar estas URLs** (uma por linha):
```
http://192.168.15.2:8083/**
http://192.168.15.2:8083/auth/callback
http://localhost:5173/**
http://localhost:3000/**
```

**Como configurar:**
1. Na mesma página de URL Configuration
2. Procure por "Redirect URLs"
3. Adicione cada URL em uma linha separada
4. Clique em "Save"

---

### 3️⃣ Email Template - Confirm Signup

📍 **Onde:** Supabase Dashboard → Settings → Authentication → Email Templates

**Template:** Confirm signup

**Verificar:** O link de confirmação deve usar `{{ .SiteURL }}` (variável dinâmica)

**Link CORRETO:**
```html
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
```

**Link ERRADO** (não usar):
```html
http://localhost:3000/...
https://meu-app.com/...  (URL fixa)
```

**Template HTML Completo Recomendado:**

```html
<h2>Confirme seu Email</h2>

<p>Olá!</p>

<p>Obrigado por se cadastrar. Para ativar sua conta, confirme seu email clicando no link abaixo:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirmar Email</a></p>

<p>Ou copie e cole esta URL no seu navegador:</p>
<p>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup</p>

<p>Este link expira em 24 horas.</p>

<p>Se você não solicitou este cadastro, ignore este email.</p>
```

**Como configurar:**
1. Acesse: Settings → Authentication → Email Templates
2. Selecione "Confirm signup"
3. Cole o template acima
4. Clique em "Save"

---

### 4️⃣ Email Template - Invite User (para convites)

📍 **Onde:** Supabase Dashboard → Settings → Authentication → Email Templates

**Template:** Invite user

**Link CORRETO:**
```html
{{ .SiteURL }}/signup?invite={{ .Token }}
```

---

## 🧪 Como Testar Após Configurar

### Teste 1: Verificar Site URL
1. No Supabase Dashboard, vá em Settings → Authentication → URL Configuration
2. Confirme que Site URL = `http://192.168.15.2:8083`

### Teste 2: Enviar Novo Convite
1. Acesse: http://192.168.15.2:8083/settings
2. Clique em "Convidar Usuário"
3. Digite um email de teste
4. Envie o convite
5. Verifique o email recebido

### Teste 3: Verificar Link no Email
O link de confirmação deve ser algo como:
```
http://192.168.15.2:8083/auth/callback?token_hash=abc123...&type=signup
```

**NÃO deve ser:**
```
http://localhost:3000/...  ❌
```

### Teste 4: Clicar no Link de Confirmação
1. Abra o email recebido
2. Clique no link de confirmação
3. Deve abrir: http://192.168.15.2:8083/auth/callback
4. Deve mostrar: "Processando..." → "Email confirmado com sucesso!"
5. Deve redirecionar automaticamente para a home

---

## ✅ Checklist Final

Marque conforme for completando:

- [ ] Site URL configurado como `http://192.168.15.2:8083`
- [ ] Redirect URLs adicionadas (4 URLs)
- [ ] Template "Confirm signup" atualizado com `{{ .SiteURL }}/auth/callback`
- [ ] Limpei o cache do navegador / usei aba anônima
- [ ] Enviei um novo convite de teste
- [ ] Verifiquei que o link no email está correto (não é localhost:3000)
- [ ] Cliquei no link e vi a mensagem de sucesso
- [ ] Fui redirecionado automaticamente
- [ ] Consegui fazer login

---

## 🆘 Se Ainda Não Funcionar

### Verificar Logs do Supabase
1. Acesse: Settings → Logs → Auth Logs
2. Procure por erros recentes
3. Copie a mensagem de erro completa

### Verificar Console do Navegador
1. Pressione F12 para abrir DevTools
2. Vá na aba Console
3. Procure por erros em vermelho
4. Copie a mensagem de erro

### Verificar URL Atual
Quando clicar no link de confirmação, observe a URL na barra de endereços:
- ✅ Deve ser: `http://192.168.15.2:8083/auth/callback?token_hash=...`
- ❌ Se for: `http://localhost:3000/...` → Site URL ainda não foi atualizado

---

## 📞 Informações Úteis

**Seu APP_URL configurado:**
```
http://192.168.15.2:8083
```

**Rota de callback criada:**
```
/auth/callback
```

**Arquivo da página de callback:**
```
src/pages/auth/AuthCallback.tsx
```

---

## 🎯 Resumo Rápido

1. **Site URL:** `http://192.168.15.2:8083`
2. **Redirect URLs:** Adicionar as 4 URLs mencionadas
3. **Email Template:** Usar `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`
4. **Testar:** Enviar novo convite e verificar link no email

**Após fazer isso, o erro será corrigido! 🎉**
