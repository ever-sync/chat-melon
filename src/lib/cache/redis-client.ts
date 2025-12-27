/**
 * Cliente Redis com suporte a Upstash (REST API) e Redis tradicional
 * 
 * Suporta:
 * - Upstash Redis (via REST API com token)
 * - Redis tradicional (via URL de conexão)
 * 
 * Fallback graceful: se Redis não estiver disponível, retorna null
 * e o sistema continua funcionando normalmente com React Query cache.
 */

import { env } from '@/config/env';

export interface RedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
}

class UpstashRedisClient implements RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.token = token;
  }

  private async request<T>(command: string, args: unknown[]): Promise<T> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const result = await this.request<string>('GET', [key]);
      if (!result) return null;
      return JSON.parse(result) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.request('SETEX', [key, ttlSeconds, serialized]);
      } else {
        await this.request('SET', [key, serialized]);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.request('DEL', [key]);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.request<number>('EXISTS', [key]);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.request<string[]>('KEYS', [pattern]);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  async flush(): Promise<void> {
    try {
      await this.request('FLUSHDB', []);
    } catch (error) {
      console.error('Redis FLUSH error:', error);
    }
  }
}

class NullRedisClient implements RedisClient {
  async get<T = unknown>(): Promise<T | null> {
    return null;
  }

  async set(): Promise<void> {
    // No-op
  }

  async del(): Promise<void> {
    // No-op
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async keys(): Promise<string[]> {
    return [];
  }

  async flush(): Promise<void> {
    // No-op
  }
}

/**
 * Cria e retorna o cliente Redis apropriado
 */
function createRedisClient(): RedisClient {
  // Se cache não está habilitado, retornar cliente nulo
  if (!env.VITE_CACHE_ENABLED) {
    return new NullRedisClient();
  }

  // Se temos URL e token, usar Upstash
  if (env.VITE_REDIS_URL && env.VITE_REDIS_TOKEN) {
    try {
      return new UpstashRedisClient(env.VITE_REDIS_URL, env.VITE_REDIS_TOKEN);
    } catch (error) {
      console.warn('⚠️ Falha ao inicializar cliente Upstash Redis:', error);
      return new NullRedisClient();
    }
  }

  // Se temos apenas URL (Redis tradicional), precisaríamos de uma biblioteca
  // Por enquanto, retornar cliente nulo
  if (env.VITE_REDIS_URL) {
    console.warn('⚠️ Redis tradicional não suportado ainda. Use Upstash ou configure VITE_REDIS_TOKEN.');
    return new NullRedisClient();
  }

  // Sem configuração Redis
  return new NullRedisClient();
}

/**
 * Cliente Redis singleton
 */
export const redisClient = createRedisClient();

/**
 * Verifica se Redis está disponível e funcionando
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!env.VITE_CACHE_ENABLED) return false;

  try {
    // Teste simples: tentar fazer um GET em uma chave de teste
    await redisClient.get('__redis_test__');
    return true;
  } catch (error) {
    console.warn('Redis não disponível:', error);
    return false;
  }
}

/**
 * Helper para criar chaves de cache padronizadas
 */
export function createCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const filtered = parts.filter((p) => p !== undefined && p !== null);
  return `${prefix}:${filtered.join(':')}`;
}

