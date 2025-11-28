#!/bin/bash

# Script de configuração rápida do Supabase Local
# Execute: bash setup-local.sh

echo "🚀 EvoTalk Gateway - Setup Local do Supabase"
echo "=============================================="
echo ""

# Verifica se Docker está rodando
echo "🐳 Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "   Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi
echo "✅ Docker está rodando"
echo ""

# Verifica se Supabase CLI está instalado
echo "🔧 Verificando Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI não encontrado!"
    echo "   Instalando via npm..."
    npm install -g supabase
    echo "✅ Supabase CLI instalado"
else
    echo "✅ Supabase CLI já instalado ($(supabase --version))"
fi
echo ""

# Inicializa o Supabase (se ainda não foi)
if [ ! -d "supabase" ]; then
    echo "📦 Inicializando Supabase..."
    supabase init
    echo "✅ Supabase inicializado"
else
    echo "✅ Supabase já está inicializado"
fi
echo ""

# Inicia os serviços do Supabase
echo "🚀 Iniciando serviços do Supabase..."
echo "   (Primeira vez pode demorar ~5min para baixar imagens Docker)"
echo ""
supabase start

# Pega as credenciais
echo ""
echo "📋 Copiando credenciais para .env.local..."

# Extrai a anon key e API URL
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
API_URL=$(supabase status | grep "API URL" | awk '{print $3}')

# Cria arquivo .env.local
cat > .env.local << EOF
# Gerado automaticamente por setup-local.sh
# $(date)

VITE_SUPABASE_URL=$API_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
EOF

echo "✅ Arquivo .env.local criado"
echo ""

# Mostra informações úteis
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URLs Importantes:"
echo "   API:       $API_URL"
echo "   Studio:    $(supabase status | grep "Studio URL" | awk '{print $3}')"
echo "   Inbucket:  $(supabase status | grep "Inbucket URL" | awk '{print $3}')"
echo ""
echo "🚀 Próximos Passos:"
echo "   1. Inicie o projeto: npm run dev:local"
echo "   2. Acesse o Studio: http://localhost:54323"
echo "   3. Configure suas tabelas no Studio"
echo ""
echo "📚 Comandos Úteis:"
echo "   npm run supabase:status  - Ver status dos serviços"
echo "   npm run supabase:stop    - Parar serviços"
echo "   npm run supabase:reset   - Resetar banco (apaga dados!)"
echo "   npm run supabase:studio  - Abrir Studio no navegador"
echo ""
echo "📖 Documentação completa: SUPABASE_LOCAL_SETUP.md"
echo ""
