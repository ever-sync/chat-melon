import { z } from 'zod';

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
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
      VITE_SUPABASE_POOLER_URL: import.meta.env.VITE_SUPABASE_POOLER_URL,
      VITE_REDIS_URL: import.meta.env.VITE_REDIS_URL,
      VITE_REDIS_TOKEN: import.meta.env.VITE_REDIS_TOKEN,
      VITE_CACHE_ENABLED: import.meta.env.VITE_CACHE_ENABLED,
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
