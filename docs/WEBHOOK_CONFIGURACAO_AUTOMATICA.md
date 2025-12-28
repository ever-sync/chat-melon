# Configuração Automática de Webhook - Evolution API

## Como Funciona

O sistema agora configura **automaticamente** o webhook e as settings da Evolution API quando você conecta o WhatsApp pelo QR Code.

## Fluxo Automático

### 1. Criação da Instância
Quando você clica em "Conectar WhatsApp":
- ✅ Instância é criada na Evolution API usando o CNPJ da empresa
- ✅ QR Code é gerado e exibido
- ⚠️ Webhook é configurado (mas pode ser resetado após conexão)

### 2. Após Escanear o QR Code
Quando você escaneia o QR Code com seu WhatsApp, o sistema:

1. **Detecta a conexão automaticamente** (a cada 5 segundos)
2. **Reconfigura o webhook** com todos os eventos necessários
3. **Aplica as configurações** da instância (always_online, read_messages, etc.)
4. **Exibe notificações** de sucesso

### 3. Webhook Configurado Automaticamente

**URL do Webhook:**
```
${VITE_SUPABASE_URL}/functions/v1/evolution-webhook
```

**Eventos Monitorados:**
- `APPLICATION_STARTUP` - Inicialização da aplicação
- `QRCODE_UPDATED` - Atualização do QR Code
- `MESSAGES_SET` - Conjunto de mensagens
- `MESSAGES_UPSERT` - Novas mensagens ou atualizações
- `MESSAGES_UPDATE` - Atualização de mensagens
- `MESSAGES_DELETE` - Mensagens deletadas
- `SEND_MESSAGE` - Envio de mensagens
- `CONTACTS_SET` - Conjunto de contatos
- `CONTACTS_UPSERT` - Novos contatos ou atualizações
- `CONTACTS_UPDATE` - Atualização de contatos
- `PRESENCE_UPDATE` - Status de presença (online/offline)
- `CHATS_SET` - Conjunto de conversas
- `CHATS_UPSERT` - Novas conversas ou atualizações
- `CHATS_UPDATE` - Atualização de conversas
- `CHATS_DELETE` - Conversas deletadas
- `CONNECTION_UPDATE` - Atualização de conexão
- `GROUPS_UPSERT` - Grupos criados/atualizados
- `GROUP_UPDATE` - Atualização de grupos
- `GROUP_PARTICIPANTS_UPDATE` - Participantes de grupos
- `CALL` - Chamadas
- `NEW_JWT_TOKEN` - Novo token JWT

### 4. Settings Aplicadas Automaticamente

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

**O que cada setting faz:**
- `reject_call`: Não rejeita chamadas automaticamente
- `msg_call`: Mensagem enviada quando rejeitar chamada
- `groups_ignore`: Ignora mensagens de grupos
- `always_online`: Mantém status sempre online
- `read_messages`: Marca mensagens como lidas automaticamente
- `read_status`: Não marca status como visualizado
- `sync_full_history`: Não sincroniza histórico completo

## Como Verificar se Funcionou

### No Console do Navegador
Após escanear o QR Code, você verá:

```
📊 Status da Evolution: open -> novo status: connected
✅ Status do canal atualizado para: connected
🎉 WhatsApp acabou de conectar! Configurando webhook e settings...
🔧 Reconfigurando webhook: https://seu-supabase.supabase.co/functions/v1/evolution-webhook
✅ Webhook reconfigurado com sucesso!
⚙️ Configurando settings da instância...
✅ Settings configurados com sucesso!
```

### Na Interface
Você verá notificações:
- ✅ "WhatsApp conectado com sucesso!"
- ✅ "Webhook configurado automaticamente!"
- ✅ "Configurações aplicadas automaticamente!"

### Testando Manualmente

#### 1. Verificar Webhook na Evolution API
```bash
curl -X GET "https://seu-evolution-api.com/webhook/find/SEU_CNPJ_SEM_PONTOS" \
  -H "apikey: SUA_API_KEY"
```

Resposta esperada:
```json
{
  "url": "https://seu-supabase.supabase.co/functions/v1/evolution-webhook",
  "webhook_by_events": true,
  "webhook_base64": true,
  "events": [...]
}
```

#### 2. Verificar Settings na Evolution API
```bash
curl -X GET "https://seu-evolution-api.com/settings/find/SEU_CNPJ_SEM_PONTOS" \
  -H "apikey: SUA_API_KEY"
```

Resposta esperada:
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

## Resolução de Problemas

### Webhook Não Foi Configurado

Se você não viu as notificações de webhook configurado:

1. **Verificar no console do navegador** se houve algum erro
2. **Atualizar manualmente** clicando no botão de refresh (↻) ao lado do canal
3. **Configurar manualmente** usando a migration SQL ou script

### Mensagens Não Estão Chegando

1. **Verifique o webhook**: Use o comando curl acima
2. **Verifique os logs do Supabase**: Edge Functions > evolution-webhook > Logs
3. **Envie uma mensagem de teste** para o número conectado
4. **Verifique o status**: Deve estar "Conectado" (verde)

### Configurar Manualmente (se necessário)

Se a configuração automática falhar, você pode:

1. **Usar o script PowerShell/Bash**:
   ```powershell
   .\scripts\configurar-webhook.ps1
   ```

2. **Ou executar a migration**:
   ```sql
   -- Execute no SQL Editor do Supabase
   -- Arquivo: supabase/migrations/20251227160000_auto_configure_webhook.sql
   ```

## Código Implementado

A lógica está em `src/pages/Channels.tsx:179-267`:

```typescript
// 🔥 SE ACABOU DE CONECTAR: Reconfigurar webhook e settings
if (justConnected) {
  // 1. Webhook
  await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {...});

  // 2. Settings
  await fetch(`${evolutionApiUrl}/settings/set/${instanceName}`, {...});
}
```

## Monitoramento

O sistema verifica o status da conexão:
- **A cada 5 segundos** quando o QR Code está aberto
- **Ao carregar a página** de Canais
- **Ao clicar no botão de refresh** (↻)

## Próximos Passos

Depois de conectar o WhatsApp:

1. ✅ Vá para a página de **Conversas**
2. ✅ Envie uma mensagem de teste para seu número
3. ✅ Verifique se a mensagem aparece no sistema
4. ✅ Responda pelo sistema e veja se chega no WhatsApp

## Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase Edge Functions
3. Teste manualmente com os comandos curl acima
4. Consulte a documentação: `TROUBLESHOOTING_ERRO_403.md`
