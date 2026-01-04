# Troubleshooting - Instagram Webhook

## Problema Identificado

O webhook do Instagram não estava recebendo mensagens porque:

1. **O `entry.id` do webhook é o Page ID** (ID da Página do Facebook)
2. **Mas o `external_id` salvo no banco é o Instagram Account ID**
3. O código estava tentando buscar o canal usando `external_id = entry.id`, que nunca dava match

## Correção Aplicada

Alterado o arquivo `supabase/functions/instagram-webhook/index.ts` para:
- Buscar TODOS os canais Instagram
- Filtrar pelo `credentials.page_id` ao invés de `external_id`
- Adicionar logs detalhados para debug

## Como Verificar se está Funcionando

### 1. Execute o script SQL de debug

```sql
-- Ver canais Instagram
SELECT
    id,
    name,
    external_id,
    credentials->>'page_id' as page_id,
    credentials->>'instagram_account_id' as instagram_account_id
FROM channels
WHERE type = 'instagram';
```

**Esperado:** Você deve ver:
- `external_id` = Instagram Account ID
- `page_id` = Facebook Page ID
- `instagram_account_id` = Instagram Account ID

### 2. Teste enviando uma mensagem pelo Instagram

1. Envie uma mensagem DM para a conta Instagram conectada
2. Vá para os logs do Supabase: https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/functions/instagram-webhook/logs
3. Procure por estas mensagens de log:

```
✅ Logs esperados (sucesso):
🔍 Processing entry for Page ID: [PAGE_ID]
📋 Found 1 Instagram channels in database
  Checking channel [CHANNEL_ID]: page_id=[PAGE_ID], external_id=[INSTA_ID]
✅ Found channel: [CHANNEL_ID] for company: [COMPANY_ID]
💾 Saving message: [MENSAGEM]
✅ Message saved
✅ Conversation updated, unread: 1
✅ Webhook processing complete
```

```
❌ Logs de erro (problema):
⚠️ No channel found for Page ID: [PAGE_ID]
💡 Make sure the Instagram channel has page_id in credentials
```

### 3. Se ainda não funcionar

**Verifique as credenciais do canal:**

```sql
SELECT
    id,
    name,
    credentials
FROM channels
WHERE type = 'instagram';
```

As credenciais devem ter esta estrutura:
```json
{
  "page_id": "123456789",
  "page_access_token": "EAAxxxxx...",
  "instagram_account_id": "987654321"
}
```

**Se `page_id` estiver faltando:**
1. Desconecte o canal Instagram
2. Conecte novamente pelo OAuth

### 4. Verificar webhook do Facebook

Acesse: https://developers.facebook.com/apps/[SEU_APP_ID]/webhooks

**Campos inscritos esperados:**
- `messages`
- `messaging_postbacks`
- `message_reads`

**URL do webhook:**
```
https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/instagram-webhook
```

## Estrutura de Dados

### Payload do Webhook Instagram
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "PAGE_ID_AQUI",  // ⚠️ Este é o Page ID, NÃO o Instagram ID!
      "time": 1234567890,
      "messaging": [
        {
          "sender": {"id": "SENDER_INSTAGRAM_ID"},
          "recipient": {"id": "YOUR_INSTAGRAM_ACCOUNT_ID"},
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Olá!"
          }
        }
      ]
    }
  ]
}
```

### Canal no Banco
```json
{
  "type": "instagram",
  "external_id": "INSTAGRAM_ACCOUNT_ID",  // ID da conta Instagram
  "credentials": {
    "page_id": "PAGE_ID",  // 🔑 IMPORTANTE: Usado para match com webhook
    "instagram_account_id": "INSTAGRAM_ACCOUNT_ID",
    "page_access_token": "TOKEN"
  }
}
```

## Referências

- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Webhooks do Instagram](https://developers.facebook.com/docs/messenger-platform/webhooks)
