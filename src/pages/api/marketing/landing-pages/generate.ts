import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerateRequest {
  company_id: string;
  provider: string;
  prompt: string;
  name: string;
  slug: string;
  description?: string;
}

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

async function generateWithClaude(apiKey: string, model: string, prompt: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `${SYSTEM_PROMPT}\n\n${prompt}`
      }
    ]
  });

  const content = message.content[0];
  if (content.type === 'text') {
    // Extract HTML from code blocks if present
    let html = content.text;
    const codeBlockMatch = html.match(/```html\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      html = codeBlockMatch[1];
    }
    return html.trim();
  }

  throw new Error('Resposta inválida do Claude');
}

async function generateWithOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 8000
  });

  let html = completion.choices[0]?.message?.content || '';

  // Extract HTML from code blocks if present
  const codeBlockMatch = html.match(/```html\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    html = codeBlockMatch[1];
  }

  return html.trim();
}

async function generateWithGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  const result = await geminiModel.generateContent(`${SYSTEM_PROMPT}\n\n${prompt}`);
  const response = await result.response;
  let html = response.text();

  // Extract HTML from code blocks if present
  const codeBlockMatch = html.match(/```html\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    html = codeBlockMatch[1];
  }

  return html.trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const {
      company_id,
      provider,
      prompt,
      name,
      slug,
      description
    } = req.body as GenerateRequest;

    // Validate input
    if (!company_id || !provider || !prompt || !name || !slug) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get AI provider configuration
    const { data: providerConfig, error: configError } = await supabase
      .from('ai_provider_keys')
      .select('*')
      .eq('company_id', company_id)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (configError || !providerConfig) {
      return res.status(400).json({ error: 'AI provider not configured' });
    }

    // Check if slug is unique
    const { data: existingPage } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('company_id', company_id)
      .eq('slug', slug)
      .single();

    if (existingPage) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Generate HTML with selected AI provider
    let htmlContent: string;
    let tokensUsed = 0;

    try {
      switch (provider) {
        case 'claude':
          htmlContent = await generateWithClaude(
            providerConfig.api_key,
            providerConfig.model_name,
            prompt
          );
          tokensUsed = Math.ceil(htmlContent.length / 4); // Rough estimate
          break;

        case 'openai':
          htmlContent = await generateWithOpenAI(
            providerConfig.api_key,
            providerConfig.model_name,
            prompt
          );
          tokensUsed = Math.ceil(htmlContent.length / 4);
          break;

        case 'gemini':
          htmlContent = await generateWithGemini(
            providerConfig.api_key,
            providerConfig.model_name,
            prompt
          );
          tokensUsed = Math.ceil(htmlContent.length / 4);
          break;

        default:
          return res.status(400).json({ error: 'Invalid AI provider' });
      }
    } catch (aiError: any) {
      console.error('AI Generation Error:', aiError);

      // Log failed generation
      await supabase.from('landing_page_ai_generations').insert({
        company_id,
        provider,
        model: providerConfig.model_name,
        prompt,
        status: 'failed',
        error_message: aiError.message,
        generation_time_ms: Date.now() - startTime
      });

      return res.status(500).json({
        error: 'Erro ao gerar landing page com IA',
        details: aiError.message
      });
    }

    // Create landing page
    const { data: landingPage, error: lpError } = await supabase
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
        meta_tags: {
          title: name,
          description: description || name
        }
      })
      .select()
      .single();

    if (lpError) {
      console.error('Database Error:', lpError);
      return res.status(500).json({ error: 'Error creating landing page' });
    }

    // Log successful generation
    await supabase.from('landing_page_ai_generations').insert({
      company_id,
      landing_page_id: landingPage.id,
      provider,
      model: providerConfig.model_name,
      prompt,
      response: htmlContent.substring(0, 1000), // Store first 1000 chars
      tokens_used: tokensUsed,
      status: 'completed',
      generation_time_ms: Date.now() - startTime
    });

    return res.status(200).json({
      id: landingPage.id,
      name: landingPage.name,
      slug: landingPage.slug,
      html_content: htmlContent,
      tokens_used: tokensUsed,
      generation_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
