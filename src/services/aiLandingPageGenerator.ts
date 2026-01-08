import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export interface GenerateOptions {
  provider: 'claude' | 'openai' | 'gemini';
  apiKey: string;
  model: string;
  prompt: string;
}

export interface GenerateResult {
  htmlContent: string;
  tokensUsed: number;
}

async function generateWithClaude(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true // Necessário para uso no navegador
  });

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

async function generateWithOpenAI(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Necessário para uso no navegador
  });

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

async function generateWithGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
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

export async function generateLandingPage(
  options: GenerateOptions
): Promise<GenerateResult> {
  const { provider, apiKey, model, prompt } = options;

  let htmlContent: string;

  switch (provider) {
    case 'claude':
      htmlContent = await generateWithClaude(apiKey, model, prompt);
      break;

    case 'openai':
      htmlContent = await generateWithOpenAI(apiKey, model, prompt);
      break;

    case 'gemini':
      htmlContent = await generateWithGemini(apiKey, model, prompt);
      break;

    default:
      throw new Error('Invalid AI provider');
  }

  // Rough estimate of tokens used
  const tokensUsed = Math.ceil(htmlContent.length / 4);

  return {
    htmlContent,
    tokensUsed
  };
}
