#!/bin/bash

# Script para configurar webhook da Evolution API
# Uso: bash scripts/configurar-webhook.sh

# Configurações
EVOLUTION_API_URL="https://api.eversync.com.br"
EVOLUTION_API_KEY="d2a0995484bd8fd1039d9a119c7c39e4"
INSTANCE_NAME="WhatsApp - Adao Importados"
WEBHOOK_URL="https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook"

echo "🔧 Configurando webhook da Evolution API..."
echo ""
echo "Instância: $INSTANCE_NAME"
echo "Webhook: $WEBHOOK_URL"
echo ""

# Configurar webhook
echo "📤 Enviando configuração do webhook..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"webhook_by_events\": true,
    \"webhook_base64\": true,
    \"events\": [
      \"APPLICATION_STARTUP\",
      \"QRCODE_UPDATED\",
      \"MESSAGES_SET\",
      \"MESSAGES_UPSERT\",
      \"MESSAGES_UPDATE\",
      \"MESSAGES_DELETE\",
      \"SEND_MESSAGE\",
      \"CONTACTS_SET\",
      \"CONTACTS_UPSERT\",
      \"CONTACTS_UPDATE\",
      \"PRESENCE_UPDATE\",
      \"CHATS_SET\",
      \"CHATS_UPSERT\",
      \"CHATS_UPDATE\",
      \"CHATS_DELETE\",
      \"CONNECTION_UPDATE\",
      \"GROUPS_UPSERT\",
      \"GROUP_UPDATE\",
      \"GROUP_PARTICIPANTS_UPDATE\",
      \"CALL\",
      \"NEW_JWT_TOKEN\"
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Webhook configurado com sucesso!"
  echo ""
  echo "Resposta:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Erro ao configurar webhook (HTTP $HTTP_CODE)"
  echo ""
  echo "Resposta:"
  echo "$BODY"
  exit 1
fi

echo ""
echo "🔍 Verificando configuração..."
VERIFY=$(curl -s -X GET "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" \
  -H "apikey: $EVOLUTION_API_KEY")

echo ""
echo "Configuração atual:"
echo "$VERIFY" | jq '.' 2>/dev/null || echo "$VERIFY"

echo ""
echo "✅ Tudo pronto!"
echo ""
echo "Próximos passos:"
echo "1. Vá em Canais > WhatsApp"
echo "2. Clique em 'Configurar'"
echo "3. Escaneie o QR Code"
echo "4. Aguarde conectar"
echo ""
