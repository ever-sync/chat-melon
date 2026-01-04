// Script para testar o webhook do Instagram
// Execute: node test_instagram_webhook.js

const WEBHOOK_URL = "https://nmbiuebxhovmwxrbaxsz.supabase.co/functions/v1/instagram-webhook";

// Payload real que o Instagram envia
const webhookPayload = {
  object: "instagram",
  entry: [
    {
      id: "17841474124486428", // Instagram Account ID da eversync.oficial (CORRETO!)
      time: Date.now(),
      messaging: [
        {
          sender: {
            id: "1234567890" // ID fictício de um cliente
          },
          recipient: {
            id: "17841474124486428" // Instagram Account ID da eversync.oficial
          },
          timestamp: Date.now(),
          message: {
            mid: "test_message_" + Date.now(),
            text: "Olá, esta é uma mensagem de teste CORRIGIDA!"
          }
        }
      ]
    }
  ]
};

async function testWebhook() {
  console.log("📤 Enviando payload para o webhook...");
  console.log(JSON.stringify(webhookPayload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "facebookexternalua"
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await response.text();

    console.log("\n📥 Resposta do webhook:");
    console.log("Status:", response.status);
    console.log("Body:", responseText);

    if (response.status === 200) {
      console.log("\n✅ Webhook respondeu com sucesso!");
      console.log("🔍 Agora verifique os logs em:");
      console.log("https://supabase.com/dashboard/project/nmbiuebxhovmwxrbaxsz/functions/instagram-webhook/logs");
    } else {
      console.log("\n❌ Webhook retornou erro!");
    }
  } catch (error) {
    console.error("❌ Erro ao chamar webhook:", error);
  }
}

testWebhook();
