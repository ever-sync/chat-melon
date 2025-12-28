# 🔗 Configurar Webhook da Evolution API

## 📋 O Problema

Você criou a instância do WhatsApp na Evolution API, mas ela está "Desconectada" porque:
1. ❌ O webhook não está configurado
2. ❌ Os eventos não estão habilitados
3. ❌ A Evolution API não está enviando dados para o Supabase

## ✅ Solução: Configurar Webhook

### Passo 1: Obter a URL do Webhook

A URL do webhook é a Edge Function do Supabase que processa as mensagens.

**URL do Webhook:**
```
https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook
```

### Passo 2: Configurar Webhook na Evolution API

Você tem **3 opções** para configurar o webhook:

---

## Opção 1: Configurar via Interface da Evolution (Mais Fácil)

1. Acesse a Evolution API: https://api.eversync.com.br

2. Vá em **Settings** → **Webhook**

3. Configure os campos:

   **URL:**
   ```
   https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook
   ```

   **Enabled:** ✅ Ative o toggle

   **Webhook by Events:** ✅ Ative

   **Webhook Base64:** ✅ Ative (para receber mídias em base64)

4. **Events** - Ative TODOS os seguintes eventos:

   - ✅ `APPLICATION_STARTUP`
   - ✅ `QRCODE_UPDATED`
   - ✅ `CONNECTION_UPDATE`
   - ✅ `MESSAGES_SET`
   - ✅ `MESSAGES_UPSERT`
   - ✅ `MESSAGES_UPDATE`
   - ✅ `MESSAGES_DELETE`
   - ✅ `SEND_MESSAGE`
   - ✅ `CONTACTS_SET`
   - ✅ `CONTACTS_UPSERT`
   - ✅ `CONTACTS_UPDATE`
   - ✅ `PRESENCE_UPDATE`
   - ✅ `CHATS_SET`
   - ✅ `CHATS_UPSERT`
   - ✅ `CHATS_UPDATE`
   - ✅ `CHATS_DELETE`
   - ✅ `GROUPS_UPSERT`
   - ✅ `GROUP_UPDATE`
   - ✅ `GROUP_PARTICIPANTS_UPDATE`
   - ✅ `CONNECTION_UPDATE`
   - ✅ `CALL`
   - ✅ `NEW_JWT_TOKEN`

5. Clique em **Save** (botão verde no canto inferior direito)

---

## Opção 2: Configurar via API (Recomendado se a Interface não Funcionar)

Use este comando `curl` para configurar o webhook:

```bash
curl -X POST "https://api.eversync.com.br/webhook/set/WhatsApp - Adao Importados" \
  -H "Content-Type: application/json" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4" \
  -d '{
    "url": "https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook",
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
  }'
```

**⚠️ Importante:** Substitua `"WhatsApp - Adao Importados"` pelo nome exato da sua instância se for diferente.

---

## Opção 3: Configurar Diretamente no Banco (Fallback)

Se as opções acima não funcionarem, você pode atualizar diretamente no banco:

1. Vá em: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/editor

2. Abra a tabela `evolution_settings`

3. Encontre o registro da sua instância

4. Atualize os campos:

   ```sql
   UPDATE evolution_settings
   SET
     webhook_url = 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook',
     webhook_enabled = true,
     webhook_events = ARRAY[
       'APPLICATION_STARTUP',
       'QRCODE_UPDATED',
       'MESSAGES_UPSERT',
       'MESSAGES_UPDATE',
       'MESSAGES_DELETE',
       'SEND_MESSAGE',
       'CONNECTION_UPDATE',
       'CONTACTS_UPDATE',
       'PRESENCE_UPDATE',
       'CHATS_UPDATE'
     ]
   WHERE instance_name = 'WhatsApp - Adao Importados';
   ```

---

## Passo 3: Verificar se o Webhook Está Funcionando

### Teste 1: Verificar Configuração

```bash
curl -X GET "https://api.eversync.com.br/webhook/find/WhatsApp - Adao Importados" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
```

**Resposta esperada:**
```json
{
  "url": "https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook",
  "enabled": true,
  "webhook_by_events": true,
  "webhook_base64": true,
  "events": [...]
}
```

### Teste 2: Reconectar a Instância

1. Vá na interface da sua aplicação em **Canais**

2. Clique em **Configurar** na instância do WhatsApp

3. Você deve ver um **QR Code** aparecendo

4. Escaneie o QR Code com seu WhatsApp

5. Aguarde a conexão (deve mudar para "Conectado" em alguns segundos)

### Teste 3: Enviar Mensagem de Teste

1. Envie uma mensagem para o número do WhatsApp conectado

2. Verifique se a mensagem aparece na sua aplicação

3. Veja os logs no Supabase:

   - Vá em: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/logs/edge-functions
   - Procure por logs da função `evolution-webhook`
   - Deve aparecer: "✅ Mensagem processada"

---

## 🐛 Troubleshooting

### Problema 1: "Desconectado" mesmo após configurar webhook

**Solução:** Reconecte a instância:

```bash
curl -X DELETE "https://api.eversync.com.br/instance/logout/WhatsApp - Adao Importados" \
  -H "apikey: d2a0995484bd8fd1039d9a119c7c39e4"
```

Depois reconecte escaneando o QR Code novamente.

### Problema 2: Webhook não recebe eventos

**Verifique:**

1. URL do webhook está correta?
2. Eventos estão habilitados?
3. `webhook_by_events` está `true`?

**Teste manual:**

```bash
curl -X POST "https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "connection.update",
    "instance": "WhatsApp - Adao Importados",
    "data": {
      "state": "open"
    }
  }'
```

Deve retornar: `{"success":true,"message":"Status atualizado"}`

### Problema 3: Erro 404 no webhook

**Causa:** A Edge Function não foi deployada.

**Solução:**

```bash
cd C:\Users\Giuliano\Documents\empresa\Desenvolviemnto\MelonChat\chat-melon
npx supabase functions deploy evolution-webhook
```

### Problema 4: Mensagens não aparecem na aplicação

**Verificar:**

1. Tem `company_id` configurado em `evolution_settings`?
2. Tem `user_id` configurado em `evolution_settings`?

**Consultar:**

```sql
SELECT id, instance_name, company_id, user_id, is_connected
FROM evolution_settings
WHERE instance_name = 'WhatsApp - Adao Importados';
```

Se `company_id` ou `user_id` estiver NULL, atualize:

```sql
UPDATE evolution_settings
SET
  company_id = '<seu-company-id>',
  user_id = '<seu-user-id>'
WHERE instance_name = 'WhatsApp - Adao Importados';
```

---

## 📊 Logs para Monitorar

### Logs da Edge Function (Supabase)

https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/logs/edge-functions

Procure por:
- `evolution-webhook`
- ✅ "Mensagem processada"
- ❌ Erros ou warnings

### Logs da Evolution API

Se você tem acesso aos logs da Evolution API, procure por:
- `Webhook sent to: https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook`
- Status 200 (sucesso)

### Tabela webhook_logs (Supabase)

```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

Deve mostrar todos os webhooks recebidos.

---

## ✅ Checklist Final

Antes de considerar tudo pronto:

- [ ] Webhook URL configurada na Evolution API
- [ ] Todos os eventos habilitados
- [ ] `webhook_by_events` = `true`
- [ ] `webhook_base64` = `true`
- [ ] Instância reconectada (QR Code escaneado)
- [ ] Status mudou para "Conectado"
- [ ] Mensagem de teste enviada e recebida
- [ ] Mensagem aparece na aplicação
- [ ] Logs no Supabase mostram sucesso

---

## 🎯 Eventos Mais Importantes

Para funcionamento básico, você PRECISA de pelo menos estes eventos:

1. **`QRCODE_UPDATED`** - Atualiza QR Code para conexão
2. **`CONNECTION_UPDATE`** - Atualiza status (conectado/desconectado)
3. **`MESSAGES_UPSERT`** - Recebe novas mensagens (ESSENCIAL)
4. **`MESSAGES_UPDATE`** - Atualiza status das mensagens (lido, entregue)
5. **`SEND_MESSAGE`** - Confirma envio de mensagens

Os outros eventos são opcionais mas recomendados para funcionalidades avançadas.

---

**Tudo pronto!** Após seguir estes passos, sua instância deve conectar e começar a receber mensagens! 🚀

Se ainda tiver problemas, verifique os logs detalhados nos links acima.
