#!/bin/sh

# Script que injeta variáveis de ambiente em runtime para SPAs
# As variáveis são escritas em um arquivo JS que é carregado antes do app

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_PUBLISHABLE_KEY: "${VITE_SUPABASE_PUBLISHABLE_KEY}",
  VITE_SUPABASE_PROJECT_ID: "${VITE_SUPABASE_PROJECT_ID}",
  VITE_EVOLUTION_API_URL: "${VITE_EVOLUTION_API_URL}",
  VITE_EVOLUTION_API_KEY: "${VITE_EVOLUTION_API_KEY}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID}",
  VITE_REDIS_URL: "${VITE_REDIS_URL}",
  VITE_REDIS_TOKEN: "${VITE_REDIS_TOKEN}",
  VITE_CACHE_ENABLED: "${VITE_CACHE_ENABLED}"
};
EOF

echo "✅ Environment variables injected into env-config.js"

# Inicia o nginx
exec nginx -g 'daemon off;'
