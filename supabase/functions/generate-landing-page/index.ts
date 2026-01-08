import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Você é um especialista em criar landing pages profissionais e de alta conversão.

Sua tarefa é gerar o código HTML completo de uma landing page baseado no prompt do usuário.

REGRAS IMPORTANTES:
1. Retorne APENAS o código HTML completo, sem explicações
2. Inclua CSS inline usando <style> no <head>
3. Use JavaScript vanilla se necessário dentro de <script>
4. A página deve ser responsiva (mobile-first)
5. Use cores atraentes e design moderno
6. Inclua meta tags para SEO
7. O formulário deve ter action e method apropriados
8. Use fontes do Google Fonts
9. Adicione animações CSS sutis para melhorar UX
10. Garanta acessibilidade (ARIA labels, alt text, etc.)

ESTRUTURA ESPERADA:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Título da Página]</title>
  <meta name="description" content="[Descrição SEO]">
  <style>
    /* CSS aqui */
  </style>
</head>
<body>
  <!-- Conteúdo da landing page -->
  <script>
    // JavaScript se necessário
  </script>
</body>
</html>

Gere uma landing page profissional baseada no seguinte prompt:`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id, provider, prompt, name, slug, description } = await req.json()

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get AI provider config
    const { data: providerConfig, error: configError } = await supabaseClient
      .from('ai_provider_keys')
      .select('*')
      .eq('company_id', company_id)
      .eq('provider', provider)
      .eq('is_active', true)
      .single()

    if (configError || !providerConfig) {
      throw new Error('AI provider not configured')
    }

    const startTime = Date.now()
    let htmlContent = ''

    // Generate with selected provider
    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${providerConfig.model_name}:generateContent?key=${providerConfig.api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }]
            }]
          })
        }
      )

      const data = await response.json()
      htmlContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    } else if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': providerConfig.api_key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: providerConfig.model_name,
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `${SYSTEM_PROMPT}\n\n${prompt}`
          }]
        })
      })

      const data = await response.json()
      htmlContent = data.content?.[0]?.text || ''

    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.api_key}`
        },
        body: JSON.stringify({
          model: providerConfig.model_name,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 8000
        })
      })

      const data = await response.json()
      htmlContent = data.choices?.[0]?.message?.content || ''
    }

    // Extract HTML from code blocks if present
    const codeBlockMatch = htmlContent.match(/```html\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      htmlContent = codeBlockMatch[1]
    }

    const generationTime = Date.now() - startTime
    const tokensUsed = Math.ceil(htmlContent.length / 4)

    // Create landing page
    const { data: landingPage, error: lpError } = await supabaseClient
      .from('landing_pages')
      .insert({
        company_id,
        name,
        slug,
        description,
        generation_prompt: prompt,
        ai_provider: provider,
        html_content: htmlContent,
        status: 'draft',
        meta_tags: { title: name, description: description || name }
      })
      .select()
      .single()

    if (lpError) throw lpError

    // Log generation
    await supabaseClient.from('landing_page_ai_generations').insert({
      company_id,
      landing_page_id: landingPage.id,
      provider,
      model: providerConfig.model_name,
      prompt,
      response: htmlContent.substring(0, 1000),
      tokens_used: tokensUsed,
      status: 'completed',
      generation_time_ms: generationTime
    })

    return new Response(
      JSON.stringify({
        id: landingPage.id,
        name: landingPage.name,
        slug: landingPage.slug,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
