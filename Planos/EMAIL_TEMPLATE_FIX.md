# 🔧 Corrigir Template de Email do Supabase

## ❌ Problema Atual

Erro 500 ao tentar confirmar email:
```
AuthApiError: Error confirming user
```

**Causa:** O template de email do Supabase não está configurado corretamente para usar a rota `/auth/callback`.

---

## ✅ Solução: Atualizar Template de Email

### 📍 Onde Configurar

Supabase Dashboard → Settings → Authentication → Email Templates

---

## 🎯 Template "Confirm signup"

### **Opção 1: Template Simples (Recomendado)**

Use este template que redireciona automaticamente com os tokens:

```html
<h2>Confirme seu Email</h2>

<p>Olá!</p>

<p>Obrigado por se cadastrar no ChatHub. Clique no link abaixo para confirmar seu email:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>

<p>Ou copie e cole esta URL no seu navegador:</p>
<p style="word-break: break-all; font-size: 12px;">{{ .ConfirmationURL }}</p>

<p>Este link expira em 24 horas.</p>
```

**✅ Por que funciona:**
- `{{ .ConfirmationURL }}` é gerado automaticamente pelo Supabase
- Já inclui os tokens necessários (access_token e refresh_token)
- Usa a configuração de "Site URL" que você definiu

---

### **Opção 2: Template com Callback Manual**

Se quiser forçar o uso da rota `/auth/callback`:

```html
<h2>Confirme seu Email</h2>

<p>Olá!</p>

<p>Obrigado por se cadastrar no ChatHub. Clique no link abaixo para confirmar seu email:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirmar Email</a></p>

<p>Ou copie e cole esta URL no seu navegador:</p>
<p style="word-break: break-all; font-size: 12px;">{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup</p>

<p>Este link expira em 24 horas.</p>
```

**⚠️ Atenção:**
- Essa opção está dando erro 500 porque o Supabase pode ter configurações adicionais que impedem o uso de `token_hash`
- Recomendo usar a **Opção 1** com `{{ .ConfirmationURL }}`

---

## 🎨 Template Completo Estilizado (Opção 1 - Recomendado)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f4f4f5;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 40px 30px;
      }
      .content p {
        margin: 0 0 16px 0;
        color: #52525b;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: #667eea;
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        margin: 24px 0;
        font-weight: 600;
        font-size: 16px;
        transition: background 0.2s;
      }
      .button:hover {
        background: #5568d3;
      }
      .link-fallback {
        margin-top: 24px;
        padding: 16px;
        background: #f4f4f5;
        border-radius: 8px;
        font-size: 12px;
        color: #71717a;
        word-break: break-all;
      }
      .footer {
        text-align: center;
        color: #a1a1aa;
        padding: 30px;
        font-size: 13px;
        border-top: 1px solid #e4e4e7;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✨ Bem-vindo ao ChatHub!</h1>
      </div>

      <div class="content">
        <p><strong>Olá!</strong></p>

        <p>Obrigado por se cadastrar no ChatHub. Estamos muito felizes em tê-lo(a) conosco!</p>

        <p>Para começar a usar sua conta, precisamos confirmar seu endereço de email. É rápido e fácil:</p>

        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Confirmar Meu Email
          </a>
        </div>

        <p style="margin-top: 32px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <div class="link-fallback">
          {{ .ConfirmationURL }}
        </div>

        <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
          ⏱️ Este link expira em 24 horas por segurança.
        </p>

        <p style="margin-top: 16px; font-size: 14px; color: #71717a;">
          Se você não solicitou este cadastro, pode ignorar este email com segurança.
        </p>
      </div>

      <div class="footer">
        <p>© 2025 ChatHub. Todos os direitos reservados.</p>
        <p style="margin-top: 8px;">
          Sistema de Gestão e Atendimento Inteligente
        </p>
      </div>
    </div>
  </body>
</html>
```

---

## 📋 Passo a Passo para Configurar

### 1. Acesse o Supabase Dashboard
```
https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/auth
```

### 2. Vá em Email Templates
- Clique em **"Email Templates"** no menu lateral
- Ou vá diretamente em: Settings → Authentication → Email Templates

### 3. Selecione "Confirm signup"
- Encontre o template "Confirm signup"
- Clique para editar

### 4. Cole o Template
- Apague o conteúdo atual
- Cole o template da **Opção 1** (com `{{ .ConfirmationURL }}`)
- Clique em **"Save"**

### 5. Verifique a URL Configuration
Certifique-se que o **Site URL** está configurado:
```
Settings → Authentication → URL Configuration
Site URL: http://192.168.15.2:8083
```

---

## 🧪 Testar a Configuração

### Teste 1: Enviar Novo Convite
1. Apague o usuário de teste anterior (se existir)
2. Envie um novo convite de http://192.168.15.2:8083/settings
3. Verifique o email recebido

### Teste 2: Verificar Link no Email
O link deve ser algo como:
```
http://192.168.15.2:8083/?access_token=...&refresh_token=...&type=signup
```

Ou se você escolheu a Opção 2:
```
http://192.168.15.2:8083/auth/callback?token_hash=...&type=signup
```

### Teste 3: Clicar no Link
1. Clique no link de confirmação
2. **Se usar Opção 1:** Será redirecionado para a home e autenticado automaticamente
3. **Se usar Opção 2:** Verá a tela "Email confirmado com sucesso!"

---

## 🔍 Variáveis Disponíveis no Template

O Supabase fornece estas variáveis que você pode usar nos templates:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{ .ConfirmationURL }}` | URL completa de confirmação com tokens | `http://192.168.15.2:8083/?access_token=...` |
| `{{ .SiteURL }}` | URL base do site configurada | `http://192.168.15.2:8083` |
| `{{ .TokenHash }}` | Hash do token de confirmação | `abc123def456...` |
| `{{ .Token }}` | Token completo | `eyJhbGci...` |
| `{{ .Email }}` | Email do destinatário | `usuario@example.com` |

---

## ⚠️ Importante

### Por que a Opção 1 é melhor?

✅ **Opção 1** (`{{ .ConfirmationURL }}`):
- Usa o sistema de confirmação padrão do Supabase
- Já inclui os tokens necessários automaticamente
- Funciona sem necessidade de rota `/auth/callback`
- Menos suscetível a erros 500

❌ **Opção 2** (rota `/auth/callback` com `token_hash`):
- Requer configuração adicional no Supabase
- Pode dar erro 500 dependendo das configurações de Auth
- Mais complexo de manter

### Quando usar a Opção 2?

Apenas se você:
- Precisa de controle total sobre o processo de confirmação
- Quer mostrar uma página personalizada antes de redirecionar
- Tem configurações específicas de Auth que suportam `token_hash`

---

## 🆘 Se Ainda Não Funcionar

### 1. Verifique os Logs do Supabase
```
Settings → Logs → Auth Logs
```
Procure por erros relacionados a confirmação de email

### 2. Verifique se o Email Provider está configurado
```
Settings → Authentication → Providers → Email
```
- Enable Email Provider: ✅ ON
- Confirm email: ✅ ON

### 3. Verifique Email Auth Settings
```
Settings → Authentication → Email Auth
```
- Secure email change: ✅ ON (recomendado)
- Double confirm email: ❌ OFF (para teste)

### 4. Teste com Email Real
- Use um email real (Gmail, Outlook, etc.)
- Verifique a pasta de spam
- Tente com outro navegador/modo anônimo

---

## ✅ Resultado Esperado

Após configurar o template corretamente:

1. ✅ Usuário recebe email bonito e profissional
2. ✅ Link de confirmação funciona corretamente
3. ✅ Usuário é autenticado automaticamente
4. ✅ Redirecionado para o dashboard
5. ✅ Pode usar o sistema normalmente

**Pronto! Sistema de confirmação de email funcionando! 🎉**
