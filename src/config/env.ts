import { z } from 'zod';

/**
 * Interface para variáveis de ambiente injetadas em runtime (Docker)
 */
declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

/**
 * Helper para obter variável de ambiente
 * Prioridade: window.__ENV__ (runtime) > import.meta.env (build-time)
 */
function getEnvVar(key: string): string | undefined {
  // Runtime injection (Docker)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    const value = window.__ENV__[key];
    // Ignora placeholders
    if (value && !value.startsWith('RUNTIME_REPLACE')) {
      return value;
    }
  }
  // Build-time (Vite)
  return (import.meta.env as Record<string, string>)[key];
}

/**
 * Schema de validação das variáveis de ambiente
 * Garante que todas as env vars necessárias estão presentes e são válidas
 */
const envSchema = z.object({
  // Supabase
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL deve ser uma URL válida'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY é obrigatório'),
  VITE_SUPABASE_PROJECT_ID: z.string().optional(),
  VITE_SUPABASE_POOLER_URL: z.string().url().optional(),
  // Redis Cache (opcional)
  VITE_REDIS_URL: z.string().url().optional(),
  VITE_REDIS_TOKEN: z.string().optional(), // Para Upstash
  VITE_CACHE_ENABLED: z
    .preprocess(
      (val) => {
        // Se for undefined ou null, retornar false
        if (val === undefined || val === null) return false;
        // Se for boolean, retornar como está
        if (typeof val === 'boolean') return val;
        // Se for string, converter para boolean
        if (typeof val === 'string') return val === 'true';
        return false;
      },
      z.boolean()
    )
    .default(false),

  // Ambiente
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
});

/**
 * Tipo inferido do schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Função para validar e parsear as variáveis de ambiente
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
      VITE_SUPABASE_PUBLISHABLE_KEY: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
      VITE_SUPABASE_PROJECT_ID: getEnvVar('VITE_SUPABASE_PROJECT_ID'),
      VITE_SUPABASE_POOLER_URL: getEnvVar('VITE_SUPABASE_POOLER_URL'),
      VITE_REDIS_URL: getEnvVar('VITE_REDIS_URL'),
      VITE_REDIS_TOKEN: getEnvVar('VITE_REDIS_TOKEN'),
      VITE_CACHE_ENABLED: getEnvVar('VITE_CACHE_ENABLED'),
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação de variáveis de ambiente:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Variáveis de ambiente inválidas. Verifique o console para mais detalhes.');
    }
    throw error;
  }
}

/**
 * Variáveis de ambiente validadas e tipadas
 *
 * @example
 * ```ts
 * import { env } from '@/config/env';
 *
 * const url = env.VITE_SUPABASE_URL; // ✅ Tipado e validado
 * ```
 */
export const env = validateEnv();

/**
 * Helpers para verificar o ambiente
 */
export const isDevelopment = env.MODE === 'development';
export const isProduction = env.MODE === 'production';
export const isTest = env.MODE === 'test';

