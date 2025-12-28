# Script para configurar webhook da Evolution API (Windows/PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File scripts\configurar-webhook.ps1

# Configurações
$EVOLUTION_API_URL = "https://api.eversync.com.br"
$EVOLUTION_API_KEY = "d2a0995484bd8fd1039d9a119c7c39e4"
$INSTANCE_NAME = "WhatsApp - Adao Importados"
$WEBHOOK_URL = "https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/evolution-webhook"

Write-Host "🔧 Configurando webhook da Evolution API..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Instância: $INSTANCE_NAME"
Write-Host "Webhook: $WEBHOOK_URL"
Write-Host ""

# Corpo da requisição
$body = @{
    url = $WEBHOOK_URL
    webhook_by_events = $true
    webhook_base64 = $true
    events = @(
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
    )
} | ConvertTo-Json

# Configurar webhook
Write-Host "📤 Enviando configuração do webhook..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $EVOLUTION_API_KEY
        } `
        -Body $body

    Write-Host ""
    Write-Host "✅ Webhook configurado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao configurar webhook" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $($_.Exception.Message)"
    exit 1
}

# Verificar configuração
Write-Host ""
Write-Host "🔍 Verificando configuração..." -ForegroundColor Yellow

try {
    $verify = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" `
        -Method Get `
        -Headers @{
            "apikey" = $EVOLUTION_API_KEY
        }

    Write-Host ""
    Write-Host "Configuração atual:"
    $verify | ConvertTo-Json -Depth 10
} catch {
    Write-Host ""
    Write-Host "⚠️ Erro ao verificar configuração: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Tudo pronto!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "1. Vá em Canais > WhatsApp"
Write-Host "2. Clique em 'Configurar'"
Write-Host "3. Escaneie o QR Code"
Write-Host "4. Aguarde conectar"
Write-Host ""
