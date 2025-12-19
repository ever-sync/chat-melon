// Script para configurar CORS do Supabase Storage via API
// Execute: node fix-storage-cors.js

const SUPABASE_URL = 'https://nmbiuebxhovmwxrbaxsz.supabase.co';
const SUPABASE_SERVICE_KEY = 'SEU_SERVICE_ROLE_KEY_AQUI'; // Pegue em: Project Settings > API > service_role

async function configureStorageCORS() {
  console.log('🔧 Configurando CORS do Supabase Storage...\n');

  const corsConfig = {
    allowedOrigins: ['*'], // Permite todas as origens (ou especifique: ['http://localhost:5173'])
    allowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    allowedHeaders: ['*'],
    maxAgeSeconds: 3600
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/message-media`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        public: true,
        file_size_limit: 52428800,
        allowed_mime_types: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm',
          'audio/mpeg', 'audio/ogg', 'audio/wav',
          'application/pdf'
        ],
        ...corsConfig
      })
    });

    if (response.ok) {
      console.log('✅ CORS configurado com sucesso!');
      const data = await response.json();
      console.log('📋 Configuração:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Erro ao configurar CORS:', response.status, response.statusText);
      const error = await response.text();
      console.error('Detalhes:', error);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Verificar se SERVICE_KEY foi fornecida
if (SUPABASE_SERVICE_KEY === 'SEU_SERVICE_ROLE_KEY_AQUI') {
  console.error('❌ ERRO: Configure o SUPABASE_SERVICE_KEY no arquivo!');
  console.log('\n📍 Pegue a chave em:');
  console.log('   https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/settings/api');
  console.log('   Copie a "service_role" key (não a "anon" key!)');
  process.exit(1);
}

configureStorageCORS();
