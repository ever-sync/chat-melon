# Configuração Automática do WhatsApp - MelonChat

Este documento explica como funciona o processo de configuração automática do WhatsApp quando você conecta sua conta através da Evolution API.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo de Conexão](#fluxo-de-conexão)
3. [Configurações Aplicadas](#configurações-aplicadas)
4. [Botão Atualizar](#botão-atualizar)
5. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O MelonChat configura automaticamente o webhook e as configurações da Evolution API quando você conecta sua conta WhatsApp. Isso garante que:

- ✅ Mensagens sejam recebidas em tempo real
- ✅ Status de conexão seja atualizado automaticamente
- ✅ Contatos sejam sincronizados
- ✅ Grupos sejam ignorados (opcional)
- ✅ Mensagens sejam marcadas como lidas automaticamente

## Fluxo de Conexão

### 1. Criar Instância

Quando você clica em "Conectar WhatsApp":

1. **Sistema cria instância na Evolution API**
   - Nome da instância: CNPJ da empresa (apenas números)
   - Tipo: `WHATSAPP-BAILEYS`
   - QR Code: Habilitado

2. **QR Code é exibido**
   - Escaneie com seu WhatsApp
   - Conexão é estabelecida

### 2. Detecção de Conexão

O sistema verifica o status a cada **5 segundos** enquanto o QR Code está aberto:

```javascript
// Verificação automática
setInterval(() => {
  checkAndUpdateChannelStatus(true);
}, 5000);
```

### 3. Configuração Automática

**Assim que o WhatsApp conecta**, o sistema aplica automaticamente:

#### A. Webhook Configuration

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

**Endpoint utilizado:**
```
POST /webhook/set/{instanceName}
```

#### B. Instance Settings

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

**Endpoint utilizado:**
```
POST /settings/set/{instanceName}
```

### 4. Atualização do Banco de Dados

O sistema atualiza automaticamente:

#### Tabela `channels`
```sql
UPDATE channels
SET status = 'connected'
WHERE company_id = ? AND type = 'whatsapp';
```

#### Tabela `evolution_settings`
```sql
UPDATE evolution_settings
SET
  is_connected = true,
  instance_status = 'connected'
WHERE company_id = ?;
```

---

## Configurações Aplicadas

### Webhook Settings

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| `url` | Supabase Edge Function | URL do webhook para receber eventos |
| `webhook_by_events` | `true` | Webhook organizado por eventos |
| `webhook_base64` | `true` | Incluir mídias em base64 |
| `events` | 19 eventos | Lista completa de eventos monitorados |

### Instance Settings

| Configuração | Valor | Descrição |
|-------------|-------|-----------|
| `reject_call` | `false` | Não rejeitar chamadas automaticamente |
| `msg_call` | Mensagem personalizada | Mensagem enviada quando recebe chamada |
| `groups_ignore` | `true` | **Ignora mensagens de grupos** |
| `always_online` | `true` | Aparece sempre online |
| `read_messages` | `true` | **Marca mensagens como lidas** |
| `read_status` | `false` | Não marca status como visualizado |
| `sync_full_history` | `false` | Não sincroniza histórico completo |

---

## Botão Atualizar

### Localização

O botão "Atualizar" aparece em cada card de canal WhatsApp na página de **Canais**.

```
┌─────────────────────────────────────┐
│ 🟢 WhatsApp - Empresa               │
│ Status: Conectado                   │
│                                     │
│ [Configurar] [Atualizar] [🗑️]      │
└─────────────────────────────────────┘
```

### Funcionalidade

Ao clicar em "Atualizar", o sistema:

1. **Verifica status** na Evolution API
   - Endpoint: `GET /instance/connectionState/{instanceName}`
   - Retorna: `{ state: "open" | "close" | "connecting" }`

2. **Atualiza status** no banco de dados
   - Tabela `channels`: `status`
   - Tabela `evolution_settings`: `is_connected`, `instance_status`

3. **Reconfigura webhook e settings** (se necessário)
   - Se o WhatsApp acabou de conectar
   - Aplica todas as configurações automaticamente

4. **Exibe feedback** ao usuário
   - Toast de sucesso: "WhatsApp conectado com sucesso!"
   - Toast de aviso: "Erro ao configurar webhook" (se falhar)

### Estados do Botão

| Estado | Aparência | Ação |
|--------|-----------|------|
| **Normal** | `🔄 Atualizar` | Clicável |
| **Atualizando** | `🔄 Atualizando...` | Desabilitado + ícone girando |
| **Após sucesso** | `🔄 Atualizar` | Clicável novamente |

---

## Troubleshooting

### Webhook não está sendo chamado

**Possíveis causas:**

1. **Webhook não configurado**
   - Clique em "Atualizar" no card do WhatsApp
   - Verifique logs do console (F12)

2. **URL incorreta**
   - Verifique `VITE_SUPABASE_URL` no `.env`
   - Deve ser: `https://seu-projeto.supabase.co`

3. **Edge Function não deployada**
   ```bash
   supabase functions deploy evolution-webhook
   ```

4. **Eventos não configurados**
   - Verifique na Evolution API:
   ```bash
   GET /webhook/find/{instanceName}
   ```

### WhatsApp desconecta automaticamente

**Soluções:**

1. **Verifique o celular**
   - Mantenha o WhatsApp aberto no celular
   - Certifique-se de que tem conexão estável

2. **Reconecte**
   - Clique em "Atualizar"
   - Se status = "disconnected", escaneie o QR Code novamente

3. **Verifique configurações**
   - `always_online: true` → mantém sempre online
   - `read_messages: true` → evita acúmulo de mensagens

### Mensagens não aparecem no chat

**Checklist:**

1. ✅ **Webhook configurado** (clique em "Atualizar")
2. ✅ **Status = "connected"** no card
3. ✅ **Edge Function ativa** no Supabase
4. ✅ **Evento `MESSAGES_UPSERT`** habilitado
5. ✅ **Grupos ignorados** (se mensagem veio de grupo)

### Grupos não são ignorados

**Para desabilitar ignorar grupos:**

Edite o arquivo `src/pages/Channels.tsx` linha ~249:

```javascript
// Antes:
groups_ignore: true,  // Ignora mensagens de grupos

// Depois:
groups_ignore: false, // Recebe mensagens de grupos
```

### Mensagens não são marcadas como lidas

**Para desabilitar leitura automática:**

Edite o arquivo `src/pages/Channels.tsx` linha ~251:

```javascript
// Antes:
read_messages: true,  // Marca como lidas

// Depois:
read_messages: false, // Não marca como lidas
```

---

## Verificação Manual

### 1. Verificar se webhook está configurado

```bash
curl -X GET \
  https://evolution-api-url.com/webhook/find/SEU_CNPJ \
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

### 2. Verificar settings da instância

```bash
curl -X GET \
  https://evolution-api-url.com/settings/find/SEU_CNPJ \
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

### 3. Verificar status da conexão

```bash
curl -X GET \
  https://evolution-api-url.com/instance/connectionState/SEU_CNPJ \
  -H 'apikey: SUA_API_KEY'
```

**Resposta esperada:**
```json
{
  "state": "open",
  "statusReason": "connected"
}
```

---

## Logs de Debug

Ao clicar em "Atualizar", o console exibe:

```
📊 Status da Evolution: open -> novo status: connected
🎉 WhatsApp acabou de conectar! Configurando webhook e settings...
🔧 Reconfigurando webhook: https://...
✅ Webhook reconfigurado com sucesso!
⚙️ Configurando settings da instância...
✅ Settings configurados com sucesso!
✅ Status do canal atualizado para: connected
```

Se algo falhar:

```
⚠️ Erro ao reconfigurar webhook: [detalhes]
⚠️ Erro ao configurar settings: [detalhes]
```

---

## Código Relevante

### Arquivo Principal
```
src/pages/Channels.tsx
```

### Funções Importantes

1. **`checkAndUpdateChannelStatus()`** (linha ~110)
   - Verifica status na Evolution API
   - Atualiza banco de dados
   - Configura webhook e settings automaticamente

2. **`handleConnectWhatsApp()`** (linha ~350)
   - Cria instância
   - Configura webhook inicial
   - Exibe QR Code

3. **Auto-check interval** (linha ~277)
   - Verifica a cada 5 segundos
   - Detecta quando conecta

---

## Suporte

Para problemas ou dúvidas:

- 📧 Abra uma issue no GitHub
- 📚 Consulte [WEBHOOK_AUTOMATICO_SETUP.md](./WEBHOOK_AUTOMATICO_SETUP.md)
- 🔧 Consulte [CONFIGURAR_WEBHOOK_EVOLUTION.md](./CONFIGURAR_WEBHOOK_EVOLUTION.md)
