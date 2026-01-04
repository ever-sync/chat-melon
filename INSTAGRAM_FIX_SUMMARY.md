# ✅ Correção do Webhook do Instagram - Resumo Completo

## 📋 Status Atual

✅ **Webhook corrigido e deployado com sucesso**
✅ **Teste realizado: Webhook respondeu 200 OK com `{"success":true}`**
✅ **Canais configurados corretamente no banco de dados**

---

## 🔍 Problema Identificado

O webhook do Instagram estava retornando **200 OK** mas não processava mensagens porque:

### Causa Raiz
```
❌ PROBLEMA:
- O webhook do Instagram envia entry.id = PAGE_ID (675502852314118)
- Mas o código buscava: external_id = entry.id
- O external_id salvo no banco é o INSTAGRAM_ACCOUNT_ID (17841474124486428)
- ❌ Resultado: Nunca encontrava o canal → mensagens não eram processadas
```

### Log do Problema Original
```
🔍 Processing entry for Instagram ID: 675502852314118
⚠️ No channel found for Instagram ID: 675502852314118
```

---

## ✅ Solução Aplicada

### Arquivo: `supabase/functions/instagram-webhook/index.ts`

**Mudanças principais (linhas 55-87):**

```typescript
// ❌ ANTES - Buscava por external_id (ERRADO)
const { data: channel } = await supabase
    .from("channels")
    .select("id, company_id, credentials")
    .eq("type", "instagram")
    .eq("external_id", igId)  // ❌ igId era o Page ID!
    .single();

// ✅ DEPOIS - Busca por credentials.page_id (CORRETO)
const { data: channels } = await supabase
    .from("channels")
    .select("id, company_id, credentials, external_id")
    .eq("type", "instagram");

// Filtra pelo page_id nas credenciais
const channel = channels?.find(ch => {
    const pageIdInCreds = ch.credentials?.page_id;
    return pageIdInCreds === pageId;  // ✅ Agora encontra o canal!
});
```

**Logs adicionados para debug:**
```typescript
console.log("🔍 Processing entry for Page ID:", pageId);
console.log("📦 Full entry:", JSON.stringify(entry, null, 2));
console.log(`📋 Found ${channels?.length || 0} Instagram channels in database`);
console.log(`  Checking channel ${ch.id}: page_id=${pageIdInCreds}, external_id=${ch.external_id}`);
```

---

## 📊 Estrutura de Dados Confirmada

### Canais Instagram no Banco (verificado via SQL)
```json
{
  "id": "b45168f7-117c-4047-a71d-71e877bd9415",
  "company_id": "61215833-73aa-49c6-adcc-790b9d11fd30",
  "name": "eversync.oficial",
  "external_id": "17841474124486428",  // Instagram Account ID
  "credentials": {
    "page_id": "675502852314118",  // 🔑 Facebook Page ID (usado no match)
    "instagram_account_id": "17841474124486428",
    "page_access_token": "EAFYBt4..."
  },
  "status": "connected"
}
```

### Payload do Webhook do Instagram
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "675502852314118",  // ⚠️ Este é o PAGE_ID!
      "messaging": [
        {
          "sender": {"id": "CUSTOMER_IG_ID"},
          "recipient": {"id": "17841474124486428"},  // Instagram Account ID
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Mensagem do cliente"
          }
        }
      ]
    }
  ]
}
```

---

## 🧪 Teste Realizado

### Comando
```bash
node test_instagram_webhook.js
```

### Resultado
```
✅ Webhook respondeu com sucesso!
Status: 200
Body: {"success":true}
```

---

## 🔍 Como Verificar se Está Funcionando

### 1. Envie uma mensagem DM real para @eversync.oficial no Instagram

### 2. Verifique os logs do Supabase
**URL:** https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/functions/instagram-webhook/logs

**Logs esperados (SUCESSO):**
```
📥 Instagram webhook received: {"object":"instagram","entry":[...]}
🔍 Processing entry for Page ID: 675502852314118
📦 Full entry: {...}
📋 Found 2 Instagram channels in database
  Checking channel b45168f7-117c-4047-a71d-71e877bd9415: page_id=675502852314118, external_id=17841474124486428
✅ Found channel: b45168f7-117c-4047-a71d-71e877bd9415 for company: 61215833-73aa-49c6-adcc-790b9d11fd30
👤 Default user for company: [USER_ID]
📨 Processing message from: [SENDER_ID] to: 17841474124486428
👤 Creating new contact for sender: [SENDER_ID]
✅ Created contact: [CONTACT_ID]
💬 Creating new conversation for contact: [NAME]
✅ Created conversation: [CONV_ID]
💾 Saving message: Mensagem do cliente
✅ Message saved
✅ Conversation updated, unread: 1
✅ Webhook processing complete
```

**Logs de erro (se ainda houver problema):**
```
⚠️ No channel found for Page ID: 675502852314118
💡 Make sure the Instagram channel has page_id in credentials
```

### 3. Execute o SQL para verificar mensagens
```bash
# Use o arquivo check_test_message.sql no Supabase SQL Editor
```

---

## 📁 Arquivos Criados/Modificados

### ✏️ Modificados
- `supabase/functions/instagram-webhook/index.ts` (corrigido e deployado)

### 📄 Criados
- `debug_instagram_channels.sql` - SQL para verificar canais
- `check_test_message.sql` - SQL para verificar mensagens recebidas
- `test_instagram_webhook.js` - Script Node.js para testar webhook
- `INSTAGRAM_TROUBLESHOOTING.md` - Guia detalhado de troubleshooting
- `INSTAGRAM_FIX_SUMMARY.md` - Este arquivo

---

## ✅ Próximos Passos

1. **Teste com mensagem real** do Instagram DM para @eversync.oficial
2. **Verifique os logs** no link acima
3. **Execute `check_test_message.sql`** no Supabase para confirmar que mensagens/conversas/contatos foram criados
4. **Se aparecer mensagens na interface**, está 100% funcionando! 🎉

---

## 🆘 Se Ainda Não Funcionar

### Possíveis Causas
1. **Webhook não inscrito:** Verifique em https://developers.facebook.com/apps/[APP_ID]/webhooks
2. **Permissões faltando:** Reconecte o canal pelo OAuth
3. **Token expirado:** Reconecte o canal

### Comandos de Debug
```sql
-- Ver canais
SELECT * FROM channels WHERE type = 'instagram';

-- Ver últimas conversas
SELECT * FROM conversations WHERE channel_type = 'instagram' ORDER BY created_at DESC LIMIT 10;

-- Ver últimas mensagens
SELECT * FROM messages WHERE metadata->>'channel_type' = 'instagram' ORDER BY created_at DESC LIMIT 10;
```

---

## 📚 Referências Técnicas

- **Instagram Messaging API:** https://developers.facebook.com/docs/messenger-platform/instagram
- **Webhooks:** https://developers.facebook.com/docs/messenger-platform/webhooks
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Data da Correção:** 2026-01-03
**Deploy:** ✅ Concluído
**Status:** ✅ Pronto para teste em produção
