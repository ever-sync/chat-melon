# Configuração do Google Calendar - Passo a Passo

## Erro: "Não consigo conectar ao Google Calendar"

Esse erro ocorre porque as credenciais do Google Cloud não estão configuradas. Siga este guia completo:

---

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Selecionar projeto"** → **"Novo projeto"**
3. Nome do projeto: `MelonChat` (ou o nome que preferir)
4. Clique em **"Criar"**

---

## Passo 2: Ativar Google Calendar API

1. No menu lateral, vá em: **APIs e Serviços** → **Biblioteca**
2. Pesquise por: `Google Calendar API`
3. Clique em **"Google Calendar API"**
4. Clique em **"Ativar"**

---

## Passo 3: Criar Credenciais OAuth 2.0

1. No menu lateral: **APIs e Serviços** → **Credenciais**
2. Clique em **"Criar credenciais"** → **"ID do cliente OAuth 2.0"**
3. Se solicitar, configure a **Tela de consentimento OAuth**:
   - Tipo de usuário: **Externo**
   - Nome do app: `MelonChat`
   - Email de suporte: seu email
   - Domínio da página inicial: `https://chat-melon.vercel.app` (ou seu domínio)
   - Escopos: não precisa adicionar nenhum
   - Salvar e continuar

4. Volte para **Credenciais** → **"Criar credenciais"** → **"ID do cliente OAuth 2.0"**
5. Tipo de aplicativo: **Aplicativo da Web**
6. Nome: `MelonChat Web`

### URLs IMPORTANTES (copie exatamente):

**Origens JavaScript autorizadas:**
```
http://localhost:8081
http://192.168.15.2:8081
https://chat-melon.vercel.app
https://nmbiuebxhovmwxrbaxsz.supabase.co
```

**URIs de redirecionamento autorizados:**
```
https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/google-calendar-oauth
```

7. Clique em **"Criar"**
8. **IMPORTANTE**: Copie e guarde:
   - **ID do cliente** (começa com `xxx.apps.googleusercontent.com`)
   - **Chave secreta do cliente**

---

## Passo 4: Configurar Secrets no Supabase

Agora vamos adicionar as credenciais no Supabase:

### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/settings/functions
2. Na aba **"Edge Functions"** → **"Secrets"**
3. Clique em **"Add a new secret"**
4. Adicione os seguintes secrets:

| Nome | Valor |
|------|-------|
| `GOOGLE_CLIENT_ID` | Cole o ID do cliente do Google |
| `GOOGLE_CLIENT_SECRET` | Cole a chave secreta do Google |

### Opção B: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Entre na pasta do projeto
cd C:\Users\Giuliano\Documents\empresa\Desenvolviemnto\MelonChat\chat-melon

# Configure os secrets
supabase secrets set GOOGLE_CLIENT_ID="SEU_CLIENT_ID_AQUI"
supabase secrets set GOOGLE_CLIENT_SECRET="SUA_CLIENT_SECRET_AQUI"
```

---

## Passo 5: Fazer Deploy das Edge Functions (se necessário)

Se você alterou as edge functions, faça o deploy:

```bash
# Deploy de todas as functions
supabase functions deploy google-calendar-oauth
supabase functions deploy google-calendar-sync
```

---

## Passo 6: Testar a Conexão

1. Acesse: http://192.168.15.2:8081/settings
2. Role até a seção **"Google Calendar"**
3. Clique em **"Conectar Google Calendar"**
4. Uma janela popup deve abrir
5. Escolha sua conta Google
6. Autorize as permissões solicitadas
7. A janela deve fechar automaticamente
8. Você deve ver: ✅ **"Conectado com sucesso"**

---

## Problemas Comuns e Soluções

### ❌ Erro: "redirect_uri_mismatch"

**Causa**: A URL de redirecionamento não está configurada no Google Cloud Console

**Solução**:
1. Vá em: https://console.cloud.google.com/apis/credentials
2. Clique nas credenciais criadas
3. Adicione em **"URIs de redirecionamento autorizados"**:
   ```
   https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/google-calendar-oauth
   ```
4. Salve e tente novamente

---

### ❌ Erro: "access_denied"

**Causa**: Você negou as permissões ou o app não está configurado corretamente

**Solução**:
1. Verifique se a Google Calendar API está ativada
2. Tente novamente e aceite todas as permissões
3. Se estiver em "Modo de Teste", adicione seu email como usuário de teste

---

### ❌ Erro: "invalid_client"

**Causa**: As credenciais (Client ID ou Secret) estão incorretas

**Solução**:
1. Verifique se copiou corretamente o Client ID e Secret
2. Reconfigure os secrets no Supabase
3. Aguarde 1-2 minutos para propagar
4. Tente novamente

---

### ❌ Popup não abre

**Causa**: Bloqueador de popups do navegador

**Solução**:
1. Permita popups para `192.168.15.2:8081`
2. Tente novamente

---

### ❌ Eventos não aparecem na agenda

**Causa**: A conexão está OK mas os eventos não são sincronizados

**Solução**:
1. Aguarde até 5 minutos (sincronização automática)
2. Recarregue a página `/agenda`
3. Verifique se tem eventos no Google Calendar no mês atual
4. Verifique o console do navegador (F12) para erros

---

## Verificação Manual das Configurações

### 1. Verificar se os secrets estão configurados

Acesse o dashboard do Supabase:
```
https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/settings/functions
```

Deve aparecer:
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET

### 2. Verificar se as edge functions estão deployadas

```bash
supabase functions list
```

Deve aparecer:
- google-calendar-oauth
- google-calendar-sync

### 3. Testar a edge function diretamente

```bash
curl -X POST \
  https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/google-calendar-oauth \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_auth_url", "userId": "test"}'
```

Deve retornar um JSON com `authUrl`.

---

## Resultado Final

Após configurar corretamente, você deve ser capaz de:

✅ Conectar o Google Calendar nas configurações
✅ Ver seus eventos do Google na página `/agenda`
✅ Criar novos eventos que sincronizam com o Google
✅ Ver tarefas e deals também no calendário

---

## Suporte

Se após seguir todos os passos ainda tiver problemas:

1. Abra o **Console do Navegador** (F12)
2. Vá na aba **"Console"**
3. Tente conectar novamente
4. Copie os erros que aparecerem
5. Me envie os erros para análise

---

## URLs de Referência

- Google Cloud Console: https://console.cloud.google.com/
- Supabase Dashboard: https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz
- Documentação OAuth: https://developers.google.com/identity/protocols/oauth2
