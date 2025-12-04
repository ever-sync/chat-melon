// Teste de configuração Evolution API
// Execute este script no console do navegador (F12)

(async function testEvolutionConfig() {
  console.log('🔍 Testando configuração Evolution API...\n');

  // 1. Verificar Supabase
  if (!window.supabase) {
    console.error('❌ Supabase não encontrado');
    return;
  }
  console.log('✅ Supabase inicializado');

  // 2. Verificar usuário autenticado
  const { data: { user }, error: userError } = await window.supabase.auth.getUser();
  if (userError || !user) {
    console.error('❌ Usuário não autenticado:', userError);
    return;
  }
  console.log('✅ Usuário autenticado:', user.email);

  // 3. Buscar company_id do usuário
  const { data: companyUser, error: companyError } = await window.supabase
    .from('company_users')
    .select('company_id, companies(name, evolution_instance_name)')
    .eq('user_id', user.id)
    .single();

  if (companyError || !companyUser) {
    console.error('❌ Erro ao buscar empresa:', companyError);
    return;
  }
  console.log('✅ Empresa encontrada:', {
    company_id: companyUser.company_id,
    name: companyUser.companies?.name,
    instance_name: companyUser.companies?.evolution_instance_name
  });

  // 4. Verificar evolution_settings
  const { data: evolutionSettings, error: settingsError } = await window.supabase
    .from('evolution_settings')
    .select('*')
    .eq('company_id', companyUser.company_id)
    .single();

  if (settingsError || !evolutionSettings) {
    console.error('❌ Evolution Settings não encontrado:', settingsError);
    console.log('💡 Execute este SQL no Supabase:');
    console.log(`
INSERT INTO evolution_settings (company_id, api_url, api_key, instance_name, is_connected)
VALUES (
  '${companyUser.company_id}',
  'https://sua-evolution-api.com',
  'sua-api-key',
  'nome-da-instancia',
  true
);
    `);
    return;
  }

  console.log('✅ Evolution Settings encontrado:');
  console.log({
    company_id: evolutionSettings.company_id,
    api_url: evolutionSettings.api_url,
    api_key: evolutionSettings.api_key ? '***' + evolutionSettings.api_key.slice(-4) : 'NÃO CONFIGURADO',
    instance_name: evolutionSettings.instance_name,
    is_connected: evolutionSettings.is_connected
  });

  // 5. Verificar se tem credenciais
  if (!evolutionSettings.api_url || !evolutionSettings.api_key) {
    console.error('❌ Credenciais não configuradas');
    console.log('💡 Configure em: Configurações > Evolution API');
    return;
  }
  console.log('✅ Credenciais configuradas');

  // 6. Buscar uma conversa para testar
  const { data: conversation, error: convError } = await window.supabase
    .from('conversations')
    .select('id, contact_number, contact_name, profile_pic_url')
    .eq('company_id', companyUser.company_id)
    .limit(1)
    .single();

  if (convError || !conversation) {
    console.error('❌ Nenhuma conversa encontrada:', convError);
    return;
  }

  console.log('✅ Conversa encontrada:', {
    contact_name: conversation.contact_name,
    contact_number: conversation.contact_number,
    has_profile_pic: !!conversation.profile_pic_url
  });

  // 7. Testar chamada à Evolution API
  console.log('\n🔍 Testando busca de foto de perfil...');

  try {
    const response = await fetch(
      `${evolutionSettings.api_url}/chat/fetchProfilePictureUrl/${evolutionSettings.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionSettings.api_key,
        },
        body: JSON.stringify({
          number: conversation.contact_number
        }),
      }
    );

    if (!response.ok) {
      console.error('❌ Erro na requisição Evolution API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Resposta da Evolution API:');
    console.log(result);

    if (result.profilePictureUrl) {
      console.log('✅ FOTO ENCONTRADA:', result.profilePictureUrl);
      // Testar se a URL funciona
      const img = new Image();
      img.onload = () => console.log('✅ Imagem carregada com sucesso!');
      img.onerror = () => console.error('❌ Erro ao carregar imagem');
      img.src = result.profilePictureUrl;
    } else {
      console.log('⚠️ Foto não disponível para este contato');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar foto:', error);
  }

  console.log('\n✅ Teste concluído!');
})();
