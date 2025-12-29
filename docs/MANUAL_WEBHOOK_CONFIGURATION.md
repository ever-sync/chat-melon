# Configuração Manual do Webhook - Evolution API

## 📋 Visão Geral

Este guia explica como usar o novo botão de configuração manual do webhook no MelonChat. Útil para quando a configuração automática falhar ou quando você precisar reconfigurar o webhook.

---

## 🎯 Quando Usar

Use a configuração manual do webhook quando:

- ✅ WhatsApp conectou mas não recebe mensagens
- ✅ Webhook foi removido ou modificado acidentalmente
- ✅ Precisa verificar se webhook está configurado corretamente
- ✅ Configuração automática falhou
- ✅ Mudou o URL do Supabase
- ✅ Quer reconfigurar as settings da instância

---

## 🚀 Como Usar

### 1. Acessar a Configuração

1. Vá para **Canais** no menu lateral
2. Localize o card do **WhatsApp**
3. Clique no botão **"Configurar"**

```
┌───────────────────────────────────┐
│ 🟢 WhatsApp - Sua Empresa         │
│ Status: Conectado                 │
│                                   │
│ [Configurar] [Atualizar] [🗑️]    │ ← Clique aqui
└───────────────────────────────────┘
```

### 2. Modal de Configuração

O modal exibe 3 seções principais:

#### A. Status do Webhook Atual

Mostra se o webhook já está configurado:

**Webhook Configurado:**
```
✅ Webhook configurado
URL: https://seu-projeto.supabase.co/functions/v1/evolution-webhook
□ 19 eventos ativos  □ Por eventos  □ Base64
```

**Webhook NÃO Configurado:**
```
⚠️ Webhook não configurado ou não verificado
```

Botão: **"Verificar Webhook Atual"** → Busca status na Evolution API

#### B. O que será Configurado?

Exibe informações sobre a configuração que será aplicada:

**1. Webhook URL:**
```
https://seu-projeto.supabase.co/functions/v1/evolution-webhook
```

**2. Eventos Monitorados (19):**
- MESSAGES_UPSERT
- CONNECTION_UPDATE
- CONTACTS_UPDATE
- GROUPS_UPSERT
- + 15 outros eventos

**3. Configurações da Instância:**
- ✅ Sempre online: Ativado
- ✅ Marcar mensagens como lidas: Ativado
- ✅ Ignorar grupos: Ativado
- ❌ Sincronizar histórico: Desativado

#### C. Aviso Importante

```
ℹ️ Importante
Esta configuração irá sobrescrever qualquer webhook existente na instância.
Certifique-se de que o WhatsApp está conectado antes de configurar.
```

### 3. Aplicar Configuração

1. Clique no botão **"Configurar Webhook"**
2. Aguarde o processo (pode levar alguns segundos)
3. Veja o feedback:
   - ✅ "Webhook e configurações aplicados com sucesso!"
   - ❌ "Erro ao configurar webhook" (veja logs do console)

---

## 🔍 Verificar Webhook

### Antes de Configurar

Sempre verifique o webhook atual primeiro:

1. Clique em **"Verificar Webhook Atual"**
2. Aguarde a verificação
3. Veja o resultado no card "Status do Webhook"

**Se webhook estiver OK:**
- Não precisa reconfigurar
- Problema pode ser outro (veja Troubleshooting)

**Se webhook NÃO estiver configurado:**
- Prossiga com a configuração manual

---

## ⚙️ Configurações Aplicadas

### Webhook

```json
{
  "url": "https://seu-projeto.supabase.co/functions/v1/evolution-webhook",
  "webhook_by_events": true,
  "webhook_base64": true,
  "events": [
    "APPLICATION_STARTUP",
    "QRCODE_UPDATED",
    "MESSAGES_SET",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "MESSAGES_DELETE",
    "SEND_MESSAGE",
    "CONTACTS_SET",
    "CONTACTS_UPSERT",
    "CONTACTS_UPDATE",
    "PRESENCE_UPDATE",
    "CHATS_SET",
    "CHATS_UPSERT",
    "CHATS_UPDATE",
    "CHATS_DELETE",
    "CONNECTION_UPDATE",
    "GROUPS_UPSERT",
    "GROUP_UPDATE",
    "GROUP_PARTICIPANTS_UPDATE",
    "CALL",
    "NEW_JWT_TOKEN"
  ]
}
```

**Endpoints Evolution API:**
- `POST /webhook/set/{instanceName}` → Configurar
- `GET /webhook/find/{instanceName}` → Verificar

### Instance Settings

```json
{
  "reject_call": false,
  "msg_call": "Desculpe, não posso atender chamadas no momento.",
  "groups_ignore": true,
  "always_online": true,
  "read_messages": true,
  "read_status": false,
  "sync_full_history": false
}
```

**Endpoint Evolution API:**
- `POST /settings/set/{instanceName}` → Configurar

---

## 🐛 Troubleshooting

### Erro: "Webhook não configurado"

**Possíveis causas:**
1. Instância não existe na Evolution API
2. WhatsApp desconectado
3. API Key inválida

**Soluções:**
1. Verifique se WhatsApp está conectado (status "Conectado")
2. Tente clicar em "Atualizar" primeiro
3. Verifique console (F12) para erros da API
4. Reconecte o WhatsApp se necessário

### Erro: "Erro ao configurar webhook"

**Possíveis causas:**
1. Evolution API offline ou inacessível
2. API Key incorreta
3. Instância não existe
4. Permissões insuficientes

**Soluções:**

1. **Verifique Evolution API:**
   ```bash
   curl -X GET https://evolution-api.com/instance/fetchInstances \
     -H 'apikey: SUA_API_KEY'
   ```

2. **Verifique variáveis de ambiente:**
   ```env
   VITE_EVOLUTION_API_URL=https://evolution-api.com
   VITE_EVOLUTION_API_KEY=sua-api-key
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   ```

3. **Verifique console logs:**
   - Abra DevTools (F12)
   - Vá para Console
   - Procure por mensagens com 🔧 ou ❌

### Webhook configurado mas mensagens não chegam

**Checklist:**

1. ✅ Webhook URL está correto?
   - Deve ser: `https://seu-projeto.supabase.co/functions/v1/evolution-webhook`

2. ✅ Edge Function está deployada?
   ```bash
   supabase functions list
   ```

3. ✅ Edge Function está ativa?
   - Verifique no Dashboard do Supabase

4. ✅ Eventos estão habilitados?
   - Verifique se `MESSAGES_UPSERT` está na lista

5. ✅ Grupos estão sendo ignorados?
   - Se mensagem veio de grupo, não chegará (por design)
   - Desative `groups_ignore` se quiser receber de grupos

### Verificação Manual via API

#### Verificar Webhook

```bash
curl -X GET \
  https://evolution-api.com/webhook/find/SEU_CNPJ \
  -H 'apikey: SUA_API_KEY'
```

**Resposta esperada:**
```json
{
  "url": "https://seu-projeto.supabase.co/functions/v1/evolution-webhook",
  "webhook_by_events": true,
  "webhook_base64": true,
  "events": [...]
}
```

#### Verificar Settings

```bash
curl -X GET \
  https://evolution-api.com/settings/find/SEU_CNPJ \
  -H 'apikey: SUA_API_KEY'
```

**Resposta esperada:**
```json
{
  "reject_call": false,
  "groups_ignore": true,
  "always_online": true,
  "read_messages": true,
  ...
}
```

---

## 📊 Logs de Debug

### Console Logs

Ao configurar o webhook, você verá:

```
🔧 Configurando webhook...
📍 URL: https://seu-projeto.supabase.co/functions/v1/evolution-webhook
📱 Instância: 58747123000170
✅ Webhook configurado com sucesso!
⚙️ Configurando settings da instância...
✅ Settings configurados com sucesso!
🔍 Verificando webhook atual...
📦 Webhook atual: {...}
```

### Erros Comuns

```
❌ Erro ao verificar webhook: Webhook não configurado
→ Solução: Configure o webhook

❌ Erro na resposta do webhook: 401 Unauthorized
→ Solução: Verifique API Key

❌ Erro ao configurar webhook: Network Error
→ Solução: Verifique se Evolution API está acessível
```

---

## 🎨 Interface do Modal

### Tela Inicial

```
┌─────────────────────────────────────────────┐
│ ⚙️ Configurar Webhook e Evolution API       │
│ Configure o webhook para receber mensagens  │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─ Status do Webhook ─────────────────┐    │
│ │ ⚠️ Webhook não configurado           │    │
│ │                                      │    │
│ │ [🔄 Verificar Webhook Atual]         │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ ┌─ O que será configurado? ───────────┐    │
│ │ 1. Webhook URL: https://...          │    │
│ │ 2. Eventos Monitorados (19)          │    │
│ │ 3. Configurações da Instância        │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ ℹ️ Importante                               │
│ Esta configuração irá sobrescrever...      │
│                                             │
├─────────────────────────────────────────────┤
│               [Cancelar] [⚙️ Configurar]     │
└─────────────────────────────────────────────┘
```

### Durante Configuração

```
┌─────────────────────────────────────────────┐
│ ⚙️ Configurar Webhook e Evolution API       │
│ Configure o webhook para receber mensagens  │
├─────────────────────────────────────────────┤
│                  ...                        │
├─────────────────────────────────────────────┤
│         [Cancelar] [⏳ Configurando...]      │
│                     (desabilitado)          │
└─────────────────────────────────────────────┘
```

### Após Configuração

Toast de sucesso:
```
✅ Webhook e configurações aplicados com sucesso!
Mensagens serão recebidas em tempo real
```

---

## 📝 FAQ

### 1. Preciso reconfigurar toda vez que WhatsApp desconectar?

**Não!** O webhook permanece configurado mesmo quando WhatsApp desconecta. Só reconfigure se:
- Mudou URL do Supabase
- Webhook foi removido manualmente
- Mensagens não estão chegando

### 2. Posso personalizar os eventos?

**Sim!** Edite o código em `src/pages/Channels.tsx` na função `handleConfigureWebhook()`, array `events`.

### 3. Como desabilitar ignorar grupos?

Edite a linha ~484 em `src/pages/Channels.tsx`:
```javascript
// Antes:
groups_ignore: true,

// Depois:
groups_ignore: false,
```

### 4. Como desabilitar marcar como lido?

Edite a linha ~486:
```javascript
// Antes:
read_messages: true,

// Depois:
read_messages: false,
```

### 5. Webhook configurado mas console não mostra nada

**Possíveis causas:**
1. Edge Function não está logando
2. Webhook não está sendo chamado
3. Mensagem veio de grupo (ignorada)

**Teste:**
1. Envie mensagem individual para o WhatsApp
2. Verifique logs da Edge Function no Supabase
3. Teste webhook manualmente:
   ```bash
   curl -X POST \
     https://seu-projeto.supabase.co/functions/v1/evolution-webhook \
     -H 'Content-Type: application/json' \
     -d '{"event":"MESSAGES_UPSERT","data":{"message":{"key":{"remoteJid":"5511999999999@s.whatsapp.net"},"message":{"conversation":"teste"}}}}'
   ```

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca exponha API Keys**
   - Use variáveis de ambiente
   - Não commite `.env`

2. **Webhook HTTPS**
   - Sempre use HTTPS em produção
   - Supabase já fornece HTTPS

3. **Valide Webhooks**
   - Edge Function deve validar origem
   - Implemente autenticação se necessário

4. **Monitore Uso**
   - Verifique quotas da Evolution API
   - Implemente rate limiting

---

## 📚 Documentos Relacionados

- [WHATSAPP_AUTO_CONFIGURATION.md](./WHATSAPP_AUTO_CONFIGURATION.md) - Configuração automática
- [WEBHOOK_AUTOMATICO_SETUP.md](./WEBHOOK_AUTOMATICO_SETUP.md) - Setup do webhook
- [CHANGELOG_WHATSAPP.md](../CHANGELOG_WHATSAPP.md) - Histórico de mudanças

---

## 🆘 Suporte

Para problemas ou dúvidas:

- 📧 Abra uma issue no GitHub
- 💬 Consulte logs no console (F12)
- 📖 Leia a documentação da Evolution API
- 🔍 Verifique Edge Functions no Supabase Dashboard

---

**Última atualização:** 2024-12-28
**Versão:** 1.0.0
