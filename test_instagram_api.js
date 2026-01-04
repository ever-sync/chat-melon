// Teste da API do Instagram Graph - Buscar perfil de usuário
// Execute: node test_instagram_api.js

// INSTRUÇÕES:
// 1. Pegue o PAGE_ACCESS_TOKEN do banco de dados:
//    SELECT credentials->>'page_access_token' FROM channels WHERE type = 'instagram';
// 2. Pegue um SENDER_ID de uma mensagem recebida:
//    SELECT metadata->>'sender_id' FROM messages WHERE metadata->>'channel_type' = 'instagram' LIMIT 1;
// 3. Substitua os valores abaixo e execute

const PAGE_ACCESS_TOKEN = "SEU_TOKEN_AQUI"; // Da query acima
const SENDER_ID = "665271133345480"; // ID do remetente (exemplo da mensagem "oi")

async function testInstagramAPI() {
  console.log("🔍 Testando API do Instagram Graph...\n");

  console.log("📊 Dados do teste:");
  console.log("  Token:", PAGE_ACCESS_TOKEN.substring(0, 20) + "...");
  console.log("  Sender ID:", SENDER_ID);
  console.log("");

  try {
    // Teste 1: Buscar perfil básico
    console.log("📥 Teste 1: Buscando perfil básico (name, username)...");
    const url1 = `https://graph.facebook.com/v18.0/${SENDER_ID}?fields=name,username&access_token=${PAGE_ACCESS_TOKEN}`;
    const response1 = await fetch(url1);
    const data1 = await response1.json();

    console.log(`  Status: ${response1.status}`);
    console.log(`  Resposta:`, JSON.stringify(data1, null, 2));
    console.log("");

    // Teste 2: Buscar perfil completo (com foto)
    console.log("📥 Teste 2: Buscando perfil completo (com foto)...");
    const url2 = `https://graph.facebook.com/v18.0/${SENDER_ID}?fields=name,username,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`;
    const response2 = await fetch(url2);
    const data2 = await response2.json();

    console.log(`  Status: ${response2.status}`);
    console.log(`  Resposta:`, JSON.stringify(data2, null, 2));
    console.log("");

    // Análise dos resultados
    if (response1.ok && data1.name) {
      console.log("✅ Sucesso! Nome encontrado:", data1.name);
    } else if (data1.error) {
      console.log("❌ Erro da API:");
      console.log(`  Código: ${data1.error.code}`);
      console.log(`  Mensagem: ${data1.error.message}`);
      console.log(`  Tipo: ${data1.error.type}`);

      // Sugestões baseadas no erro
      if (data1.error.code === 190) {
        console.log("\n💡 Solução: Token inválido ou expirado. Reconecte o canal Instagram.");
      } else if (data1.error.code === 10) {
        console.log("\n💡 Solução: Faltam permissões. Verifique se o token tem 'instagram_basic'.");
      } else if (data1.error.code === 100) {
        console.log("\n💡 Solução: Parâmetro inválido. Verifique se o SENDER_ID está correto.");
      }
    } else {
      console.log("⚠️ Resposta inesperada da API");
    }

  } catch (error) {
    console.error("❌ Erro ao chamar API:", error.message);
  }
}

// Validação antes de executar
if (PAGE_ACCESS_TOKEN === "SEU_TOKEN_AQUI") {
  console.log("❌ ERRO: Você precisa substituir PAGE_ACCESS_TOKEN!");
  console.log("\n📋 Passos:");
  console.log("1. Execute no Supabase SQL Editor:");
  console.log("   SELECT credentials->>'page_access_token' FROM channels WHERE type = 'instagram';");
  console.log("2. Copie o token e cole na variável PAGE_ACCESS_TOKEN deste arquivo");
  console.log("3. Execute novamente: node test_instagram_api.js");
} else {
  testInstagramAPI();
}
