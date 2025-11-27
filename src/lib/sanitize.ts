import DOMPurify from 'dompurify';

/**
 * Configuração padrão do DOMPurify para mensagens de chat
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

/**
 * Sanitiza HTML removendo tags e atributos potencialmente perigosos
 *
 * @param dirty - HTML não sanitizado
 * @param config - Configuração opcional do DOMPurify
 * @returns HTML sanitizado e seguro
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script><b>Hello</b>';
 * const safe = sanitizeHTML(userInput);
 * // Resultado: '<b>Hello</b>'
 * ```
 */
export function sanitizeHTML(dirty: string, config?: DOMPurify.Config): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ...DEFAULT_CONFIG,
    ...config,
  });
}

/**
 * Sanitiza texto simples escapando caracteres especiais de HTML
 * Use quando NÃO quer permitir nenhuma tag HTML
 *
 * @param text - Texto não sanitizado
 * @returns Texto com caracteres HTML escapados
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = sanitizeText(userInput);
 * // Resultado: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza URL removendo protocolos perigosos
 *
 * @param url - URL não sanitizada
 * @returns URL sanitizada ou null se inválida
 *
 * @example
 * ```ts
 * sanitizeURL('javascript:alert(1)'); // null
 * sanitizeURL('https://example.com'); // 'https://example.com'
 * ```
 */
export function sanitizeURL(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Apenas protocolos seguros
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    // URL inválida
    return null;
  }
}

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 *
 * @param filename - Nome do arquivo
 * @returns Nome do arquivo sanitizado
 *
 * @example
 * ```ts
 * sanitizeFilename('../../../etc/passwd'); // 'etcpasswd'
 * sanitizeFilename('arquivo.txt'); // 'arquivo.txt'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove caracteres especiais
    .replace(/^\.+/, '') // Remove pontos no início
    .substring(0, 255); // Limita tamanho
}

/**
 * Valida e sanitiza número de telefone
 *
 * @param phone - Número de telefone
 * @returns Número sanitizado ou null se inválido
 *
 * @example
 * ```ts
 * sanitizePhone('+55 11 99999-9999'); // '+5511999999999'
 * sanitizePhone('invalid'); // null
 * ```
 */
export function sanitizePhone(phone: string): string | null {
  if (!phone) return null;

  // Remove tudo exceto números e +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Valida formato básico (opcional + seguido de números)
  if (!/^\+?\d{8,15}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Valida e sanitiza email
 *
 * @param email - Endereço de email
 * @returns Email sanitizado ou null se inválido
 *
 * @example
 * ```ts
 * sanitizeEmail('user@example.com'); // 'user@example.com'
 * sanitizeEmail('invalid-email'); // null
 * ```
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  const cleaned = email.trim().toLowerCase();

  // Regex básico de validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitiza objeto JSON profundamente aplicando sanitização em strings
 *
 * @param obj - Objeto a ser sanitizado
 * @param sanitizer - Função de sanitização (padrão: sanitizeText)
 * @returns Objeto com strings sanitizadas
 */
export function sanitizeObject<T>(
  obj: T,
  sanitizer: (str: string) => string = sanitizeText
): T {
  if (typeof obj === 'string') {
    return sanitizer(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sanitizer)) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    }

    return sanitized as T;
  }

  return obj;
}
