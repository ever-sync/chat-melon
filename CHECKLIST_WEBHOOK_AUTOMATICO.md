# ✅ Checklist - Ativar Webhook Automático

## 🎯 O que foi feito:

- ✅ Código modificado para configurar webhook automaticamente
- ✅ Migration criada para configuração no banco de dados
- ✅ Documentação completa criada

## 📋 O que VOCÊ precisa fazer (UMA VEZ):

### [ ] Passo 1: Aplicar Migration no Banco (2 minutos)

1. Abra: https://app.supabase.com/project/nmbiuebxhovmwxrbaxsz/sql/new

2. Cole este código:

```sql
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
      'QRCODE_UPDATED',
      'CONNECTION_UPDATE',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'SEND_MESSAGE',
      'CONTACTS_UPDATE',
      'PRESENCE_UPDATE'
    ];
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_configure_webhook ON evolution_settings;

CREATE TRIGGER trigger_auto_configure_webhook
  BEFORE INSERT ON evolution_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_configure_evolution_webhook();

UPDATE evolution_settings
SET
  webhook_url = 'https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook',
  webhook_enabled = true,
  webhook_events = ARRAY['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE']
WHERE webhook_url IS NULL OR webhook_url = '';
```

3. Clique em **Run** ✅

---

### [ ] Passo 2: Apagar Instância Atual (30 segundos)

1. Vá em **Canais de Comunicação** na sua aplicação

2. Encontre "WhatsApp - Adao Importados"

3. Clique no ícone de **lixeira** 🗑️

4. Confirme a exclusão ✅

---

### [ ] Passo 3: Criar Nova Instância (1 minuto)

1. Vá em **Canais de Comunicação**

2. Clique em **Adicionar Canal** / **Criar Instância**

3. Preencha:
   - **Nome:** `WhatsApp - Adao Importados`
   - **URL:** `https://api.eversync.com.br`
   - **API Key:** `d2a0995484bd8fd1039d9a119c7c39e4`

4. Clique em **Criar** / **Salvar**

**⚡ O WEBHOOK SERÁ CONFIGURADO AUTOMATICAMENTE!**

---

### [ ] Passo 4: Conectar WhatsApp (30 segundos)

1. Você verá um **QR Code**

2. Abra WhatsApp no celular

3. Vá em **Configurações** → **Aparelhos conectados** → **Conectar**

4. Escaneie o QR Code 📱

5. Aguarde conexão...

6. Status muda para **"Conectado"** ✅

---

### [ ] Passo 5: Testar Funcionamento (30 segundos)

1. Envie uma mensagem de teste para o WhatsApp conectado

2. A mensagem deve aparecer **IMEDIATAMENTE** na aplicação

3. Contadores devem atualizar:
   - **Conversas: 1**
   - **Recebidas: 1**

**✅ FUNCIONOU!**

---

## 🎉 Pronto!

Agora **TODA vez** que você (ou seus clientes) criarem uma nova instância:

1. ✅ Webhook é configurado **automaticamente**
2. ✅ Todos os eventos são habilitados **automaticamente**
3. ✅ Basta criar e conectar - **SEM configuração manual**

**Tempo total:** ~4 minutos (uma vez só)

**Benefício:** Economize horas de suporte e configuração!

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- `docs/WEBHOOK_AUTOMATICO_SETUP.md` - Guia completo
- `docs/CONFIGURAR_WEBHOOK_EVOLUTION.md` - Guia manual (caso precise)

---

**Boa sorte!** 🚀
