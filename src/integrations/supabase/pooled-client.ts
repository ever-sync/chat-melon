import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env, isProduction } from '@/config/env';

/**
 * Cliente Supabase com suporte a connection pooling
 * 
 * Usa pooler URL quando disponível (produção), caso contrário usa URL direta.
 * O pooler ajuda a gerenciar conexões de forma mais eficiente em ambientes
 * com muitas requisições simultâneas.
 * 
 * @example
 * ```ts
 * import { supabase } from '@/integrations/supabase/pooled-client';
 * 
 * const { data } = await supabase.from('table').select('*');
 * ```
 */
export const supabase = createClient<Database>(
  // Usar pooler URL se disponível e em produção, senão usar URL normal
  env.VITE_SUPABASE_POOLER_URL && isProduction
    ? env.VITE_SUPABASE_POOLER_URL
    : env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      // Configurações otimizadas para pooling
      schema: 'public',
    },
    global: {
      // Headers para identificar uso de pooler
      headers: env.VITE_SUPABASE_POOLER_URL && isProduction
        ? { 'x-supabase-pooler': 'true' }
        : {},
    },
  }
);

/**
 * Indica se está usando connection pooling
 */
export const isUsingPooler = Boolean(env.VITE_SUPABASE_POOLER_URL && isProduction);

if (isUsingPooler) {
  console.log('✅ Connection pooling habilitado');
} else if (env.VITE_SUPABASE_POOLER_URL) {
  console.log('ℹ️ Pooler URL configurada, mas não está em produção');
} else {
  console.log('ℹ️ Usando conexão direta (pooler não configurado)');
}

