# 🔧 Corrigir Erro de Confirmação de Email

## ❌ Problema Identificado

Erro ao confirmar email após signup:
```
http://localhost:3000/#error=server_error&error_code=unexpected_failure&error_description=Error+confirming+user
```

**Causas:**
1. URL de redirecionamento incorreta (localhost:3000 ao invés de 192.168.15.2:8083)
2. Configuração incorreta no template de email do Supabase
3. Falta de rota /auth/callback para processar a confirmação

## ✅ Solução Implementada

### 1. Página de Callback Criada
✅ **Arquivo:** `src/pages/auth/AuthCallback.tsx`
- Processa confirmação de email
- Trata erros de forma amigável
- Redireciona automaticamente após sucesso

✅ **Rota adicionada:** `/auth/callback` em `src/App.tsx`

### 2. Configurações Necessárias no Supabase Dashboard

Agora você precisa configurar manualmente no Supabase Dashboard:

---

## 📋 PASSO A PASSO - Configuração no Supabase

### 🔹 PASSO 1: Site URL

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em: **Settings** → **Authentication** → **URL Configuration**
4. Em **Site URL**, coloque:
   ```
   http://192.168.15.2:8083
   ```
5. Clique em **Save**

---

### 🔹 PASSO 2: Redirect URLs

1. Na mesma página (**URL Configuration**)
2. Em **Redirect URLs**, adicione TODAS estas URLs (uma por linha):
   ```
   http://192.168.15.2:8083/**
   http://192.168.15.2:8083/auth/callback
   http://localhost:5173/**
   http://localhost:3000/**
   ```
3. Clique em **Save**

**IMPORTANTE:** Cada URL deve estar em uma linha separada.

---

### 🔹 PASSO 3: Email Templates (CRÍTICO!)

1. Vá em: **Settings** → **Authentication** → **Email Templates**
2. Clique em **"Confirm signup"**
3. **VERIFIQUE** se o template está usando a variável correta:

**Template CORRETO:**
```html
<h2>Confirme seu email</h2>

<p>Clique no link abaixo para confirmar seu email:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirmar Email</a></p>

<p>Ou copie e cole esta URL no seu navegador:</p>
<p>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup</p>
```

**❌ NÃO DEVE TER:**
- `redirect_to=http://localhost:3000` (hardcoded)
- URLs fixas como `http://localhost:3000`

**✅ DEVE USAR:**
- `{{ .SiteURL }}` (variável dinâmica)
- `/auth/callback?token_hash={{ .TokenHash }}&type=signup`

4. Clique em **Save**

---

### 🔹 PASSO 4: Edge Functions Environment Variables

1. Vá em: **Settings** → **Edge Functions** → **Environment Variables**
2. Adicione/Atualize:
   ```
   APP_URL=http://192.168.15.2:8083
   RESEND_API_KEY=re_sua_chave_aqui
   ```
3. Clique em **Save**

---

### 🔹 PASSO 5: Testar a Configuração

Depois de fazer TODOS os passos acima:

1. **Limpe o cache do navegador** (ou use aba anônima)
2. Acesse: `http://192.168.15.2:8083/settings`
3. Envie um convite para um email de teste
4. Verifique o email recebido
5. O link de confirmação deve ser:
   ```
   http://192.168.15.2:8083/auth/callback?token_hash=...&type=signup
   ```
6. Clique no link
7. Deve aparecer: ✅ "Email confirmado com sucesso!"
8. Será redirecionado automaticamente para a home

---

## 🔍 Verificar se está Funcionando

### ✅ Checklist de Sucesso:

- [ ] Link de confirmação usa `192.168.15.2:8083` (não localhost:3000)
- [ ] Link inclui `/auth/callback` na URL
- [ ] Ao clicar, mostra tela de "Processando..."
- [ ] Depois mostra ✅ "Email confirmado com sucesso!"
- [ ] Redireciona para a home automaticamente
- [ ] Usuário consegue fazer login

### ❌ Se ainda der erro:

1. **Verifique os logs no console do navegador** (F12)
2. **Verifique os logs no Supabase Dashboard:**
   - Settings → Logs → Auth Logs
3. **Tente novamente com aba anônima** (para garantir cache limpo)

---

## 📧 Template de Email Completo (Recomendado)

Se quiser personalizar o template de confirmação:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
      .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Confirme seu Email</h1>
      </div>

      <div class="content">
        <p>Olá!</p>

        <p>Obrigado por se cadastrar no ChatHub. Para ativar sua conta, confirme seu endereço de email clicando no botão abaixo:</p>

        <div style="text-align: center;">
          <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup" class="button">Confirmar Email</a>
        </div>

        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup</p>

        <p>Este link expira em 24 horas.</p>

        <p>Se você não solicitou este cadastro, ignore este email.</p>
      </div>

      <div class="footer">
        <p>© 2025 ChatHub. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
</html>
```

---

## 🆘 Problemas Comuns

### Problema: Email ainda vai para localhost:3000
**Solução:**
- Verifique se o Site URL está correto
- Verifique se o template de email usa `{{ .SiteURL }}` (não URL fixa)
- Limpe o cache do navegador

### Problema: Erro "Invalid token"
**Solução:**
- Link pode ter expirado (24h)
- Envie novo convite
- Verifique se o token_hash está completo na URL

### Problema: Página em branco após clicar no link
**Solução:**
- Certifique-se que adicionou a rota `/auth/callback` no App.tsx
- Verifique console do navegador para erros
- Reinicie o servidor de desenvolvimento

---

## ✨ Resultado Final

Após todas as configurações:

1. ✅ Email de convite será enviado com link correto
2. ✅ Link redirecionará para `http://192.168.15.2:8083/auth/callback`
3. ✅ Página mostrará "Processando..." → "Sucesso!"
4. ✅ Usuário será autenticado automaticamente
5. ✅ Redirecionamento para a home

**Pronto! Sistema de confirmação de email funcionando! 🎉**
