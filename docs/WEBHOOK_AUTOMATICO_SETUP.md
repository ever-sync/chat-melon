# 🚀 Webhook Automático - Setup Completo

## ✅ O que foi implementado

Agora, **TODA vez** que você criar uma nova instância do WhatsApp, o webhook será configurado **AUTOMATICAMENTE**!

Você **NÃO precisa mais** configurar manualmente!

---

## 📋 Como funciona

### 1. **Criação automática no código** ✅

Quando você cria uma instância via interface, o código agora:
1. Cria a instância na Evolution API
2. **Configura automaticamente o webhook**
3. **Habilita todos os eventos necessários**
4. **Ativa webhook_by_events e webhook_base64**

**Arquivo modificado:** `src/services/evolutionApi.ts`

### 2. **Trigger no banco de dados** ⏳

Quando você criar um registro na tabela `evolution_settings`, um trigger configura:
- `webhook_url` → URL do Supabase automaticamente
- `webhook_enabled` → `true`
- `webhook_events` → Todos os eventos necessários

**Migration criada:** `supabase/migrations/20251227160000_auto_configure_webhook.sql`

---

## 🔧 Passos para Ativar

### Passo 1: Aplicar Migration no Banco

Você precisa aplicar a migration uma vez no banco de dados:

1. Vá em: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/sql/new

2. Cole este SQL e execute:

```sql
-- Função para configurar webhook automaticamente
CREATE OR REPLACE FUNCTION auto_configure_evolution_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.webhook_url IS NULL OR NEW.webhook_url = '' THEN
    NEW.webhook_url := 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook';
  END IF;

  IF NEW.webhook_enabled IS NULL THEN
    NEW.webhook_enabled := true;
  END IF;

  IF NEW.webhook_events IS NULL OR array_length(NEW.webhook_events, 1) IS NULL THEN
    NEW.webhook_events := ARRAY[
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
    ];
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_configure_webhook ON evolution_settings;

CREATE TRIGGER trigger_auto_configure_webhook
  BEFORE INSERT ON evolution_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_configure_evolution_webhook();

-- Atualizar instâncias existentes
UPDATE evolution_settings
SET
  webhook_url = 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook',
  webhook_enabled = true,
  webhook_events = ARRAY[
    'QRCODE_UPDATED',
    'CONNECTION_UPDATE',
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'SEND_MESSAGE'
  ]
WHERE webhook_url IS NULL OR webhook_url = '';
```

3. Clique em **Run** (ou pressione Ctrl+Enter)

4. Deve aparecer: "Success. No rows returned"

---

### Passo 2: Apagar a Instância Atual (Recomendado)

Como a instância atual foi criada antes dessa automação, é melhor apagar e criar uma nova:

1. Va em **Canais de Comunicação**

2. Clique no ícone de **lixeira** (Delete) na instância do WhatsApp

3. Confirme a exclusão

---

### Passo 3: Criar Nova Instância

Agora crie uma nova instância:

1. Vá em **Canais de Comunicação**

2. Clique em **"+ Adicionar Canal"** ou similar

3. Preencha:
   - **Nome da instância:** Ex: "WhatsApp - Adao Importados"
   - **URL da API:** `https://api.eversync.com.br`
   - **API Key:** `d2a0995484bd8fd1039d9a119c7c39e4`

4. Clique em **Criar** ou **Salvar**

5. **O WEBHOOK SERÁ CONFIGURADO AUTOMATICAMENTE!** 🎉

---

### Passo 4: Conectar o WhatsApp

1. Após criar, você verá um **QR Code**

2. Abra o WhatsApp no celular

3. Vá em **Configurações** → **Aparelhos conectados** → **Conectar um aparelho**

4. Escaneie o QR Code

5. Aguarde alguns segundos

6. Status deve mudar para **"Conectado"** ✅

---

## 🧪 Como Testar se Funcionou

### Teste 1: Verificar Webhook no Banco

```sql
SELECT
  instance_name,
  webhook_url,
  webhook_enabled,
  webhook_events
FROM evolution_settings
WHERE instance_name = 'WhatsApp - Adao Importados';
```

**Resultado esperado:**
- `webhook_url`: `https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook`
- `webhook_enabled`: `true`
- `webhook_events`: array com vários eventos

### Teste 2: Enviar Mensagem

1. Envie uma mensagem para o número do WhatsApp conectado

2. A mensagem deve aparecer **IMEDIATAMENTE** na sua aplicação

3. Contadores devem atualizar:
   - **Conversas:** +1
   - **Recebidas:** +1

### Teste 3: Verificar Logs

1. Vá em: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/logs/edge-functions

2. Procure por `evolution-webhook`

3. Deve mostrar: "✅ Mensagem processada"

---

## 🎯 Para Seus Clientes

Agora, quando um **CLIENTE** criar uma nova instância, ele só precisa:

1. ✅ Criar a instância (preencher nome, URL, API Key)
2. ✅ Escanear o QR Code
3. ✅ **PRONTO!** Tudo funciona automaticamente

**NÃO precisa mais:**
- ❌ Configurar webhook manualmente
- ❌ Habilitar eventos
- ❌ Executar comandos curl
- ❌ Entrar na Evolution API

---

## 📊 Status de Implementação

```
✅ Código automático criado (src/services/evolutionApi.ts)
✅ Migration criada (supabase/migrations/20251227160000_auto_configure_webhook.sql)
⏳ Migration precisa ser aplicada no banco (VOCÊ FAZ UMA VEZ)
⏳ Apagar instância atual e criar nova
```

---

## 🆘 Troubleshooting

### Webhook não foi configurado

**Solução:** Verifique os logs do navegador (F12 → Console) quando criar a instância. Deve mostrar:
```
🔧 Configurando webhook automaticamente para: WhatsApp - Adao Importados
✅ Webhook configurado automaticamente!
```

Se aparecer erro, o webhook ainda será configurado pelo trigger do banco.

### Mensagens não chegam

1. Verifique se está conectado (status = "Conectado")
2. Verifique webhook no banco (query acima)
3. Verifique logs do Supabase Edge Function
4. Tente reconectar (Logout + Login)

---

## ✨ Benefícios

- ✅ **Zero configuração manual** para novos clientes
- ✅ **Sem dor de cabeça** - tudo automático
- ✅ **Menos suporte** - clientes não precisam de ajuda
- ✅ **Menos erros** - configuração sempre correta
- ✅ **Mais rápido** - cliente conecta em 30 segundos

---

**Pronto!** Agora suas instâncias funcionam **automaticamente** sem configuração manual! 🚀

Qualquer dúvida, consulte este guia ou os logs do Supabase.
