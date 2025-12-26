// Teste simples para verificar se as variáveis de ambiente estão configuradas
console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('RESEND_API_KEY:', Deno.env.get("RESEND_API_KEY") ? 'CONFIGURADO ✓' : 'NÃO CONFIGURADO ✗');
console.log('APP_URL:', Deno.env.get("APP_URL") || 'NÃO CONFIGURADO - usando http://localhost:5173');
console.log('SUPABASE_URL:', Deno.env.get("SUPABASE_URL") ? 'CONFIGURADO ✓' : 'NÃO CONFIGURADO ✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? 'CONFIGURADO ✓' : 'NÃO CONFIGURADO ✗');
console.log('=====================================');

// Verificar o valor do RESEND_API_KEY (primeiros caracteres)
const resendKey = Deno.env.get("RESEND_API_KEY");
if (resendKey) {
  console.log('RESEND_API_KEY começa com:', resendKey.substring(0, 10) + '...');
  console.log('Tamanho da chave:', resendKey.length);
}
