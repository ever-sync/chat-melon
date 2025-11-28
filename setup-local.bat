@echo off
REM Script de configuração rápida do Supabase Local (Windows)
REM Execute: setup-local.bat

echo.
echo ========================================
echo  EvoTalk Gateway - Setup Local do Supabase
echo ========================================
echo.

REM Verifica se Docker está rodando
echo Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo [OK] Docker esta rodando
echo.

REM Verifica se Supabase CLI está instalado
echo Verificando Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Supabase CLI nao encontrado!
    echo Instalando via npm...
    call npm install -g supabase
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar Supabase CLI
        echo Instale manualmente: npm install -g supabase
        pause
        exit /b 1
    )
    echo [OK] Supabase CLI instalado
) else (
    echo [OK] Supabase CLI ja instalado
)
echo.

REM Inicializa o Supabase (se ainda não foi)
if not exist "supabase" (
    echo Inicializando Supabase...
    call supabase init
    echo [OK] Supabase inicializado
) else (
    echo [OK] Supabase ja esta inicializado
)
echo.

REM Inicia os serviços do Supabase
echo Iniciando servicos do Supabase...
echo (Primeira vez pode demorar ~5min para baixar imagens Docker)
echo.
call supabase start

REM Mostra informações úteis
echo.
echo ========================================
echo  Setup concluido com sucesso!
echo ========================================
echo.
echo URLs Importantes:
call supabase status
echo.
echo Proximos Passos:
echo 1. Copie as credenciais acima para .env.local
echo 2. Inicie o projeto: npm run dev:local
echo 3. Acesse o Studio em: http://localhost:54323
echo.
echo Comandos Uteis:
echo   npm run supabase:status  - Ver status dos servicos
echo   npm run supabase:stop    - Parar servicos
echo   npm run supabase:reset   - Resetar banco (apaga dados!)
echo   npm run supabase:studio  - Abrir Studio no navegador
echo.
echo Documentacao completa: SUPABASE_LOCAL_SETUP.md
echo.
pause
