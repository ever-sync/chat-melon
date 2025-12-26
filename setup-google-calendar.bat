@echo off
echo ================================================
echo   CONFIGURACAO DO GOOGLE CALENDAR - MelonChat
echo ================================================
echo.

echo Este script ira configurar as credenciais do Google Calendar
echo no Supabase para que a integracao funcione.
echo.
echo ANTES DE CONTINUAR, voce precisa:
echo   1. Criar um projeto no Google Cloud Console
echo   2. Ativar a Google Calendar API
echo   3. Criar credenciais OAuth 2.0
echo.
echo Siga o guia completo em: GOOGLE_CALENDAR_SETUP.md
echo.
pause

echo.
echo ================================================
echo   PASSO 1: Client ID do Google
echo ================================================
echo.
echo Entre em: https://console.cloud.google.com/apis/credentials
echo Copie o "ID do cliente" (termina com .apps.googleusercontent.com)
echo.
set /p GOOGLE_CLIENT_ID="Cole o GOOGLE_CLIENT_ID aqui: "

echo.
echo ================================================
echo   PASSO 2: Client Secret do Google
echo ================================================
echo.
echo Ainda na mesma pagina, copie a "Chave secreta do cliente"
echo.
set /p GOOGLE_CLIENT_SECRET="Cole o GOOGLE_CLIENT_SECRET aqui: "

echo.
echo ================================================
echo   PASSO 3: Configurando no Supabase
echo ================================================
echo.

echo Configurando GOOGLE_CLIENT_ID...
npx supabase secrets set GOOGLE_CLIENT_ID="%GOOGLE_CLIENT_ID%"

echo.
echo Configurando GOOGLE_CLIENT_SECRET...
npx supabase secrets set GOOGLE_CLIENT_SECRET="%GOOGLE_CLIENT_SECRET%"

echo.
echo ================================================
echo   CONFIGURACAO CONCLUIDA!
echo ================================================
echo.
echo As credenciais foram configuradas no Supabase.
echo.
echo PROXIMOS PASSOS:
echo   1. Aguarde 1-2 minutos para propagacao
echo   2. Acesse: http://192.168.15.2:8081/settings
echo   3. Va na secao "Google Calendar"
echo   4. Clique em "Conectar Google Calendar"
echo.
echo Se der erro, verifique:
echo   - URLs configuradas no Google Cloud Console
echo   - Siga o guia: GOOGLE_CALENDAR_SETUP.md
echo.
pause
