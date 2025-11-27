import { format as dateFnsFormat, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FORMAT } from '@/config/constants';

/**
 * Formata número como moeda brasileira (BRL)
 *
 * @param value - Valor numérico
 * @param options - Opções de formatação
 * @returns String formatada como moeda
 *
 * @example
 * ```ts
 * formatCurrency(1234.56);        // "R$ 1.234,56"
 * formatCurrency(1000, { minimumFractionDigits: 0 }); // "R$ 1.000"
 * ```
 */
export function formatCurrency(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    style: 'currency',
    currency: FORMAT.CURRENCY,
    ...options,
  }).format(value);
}

/**
 * Formata número com separadores de milhar
 *
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 0)
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatNumber(1234567);     // "1.234.567"
 * formatNumber(1234.56, 2);  // "1.234,56"
 * ```
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata porcentagem
 *
 * @param value - Valor de 0 a 1 (ou 0 a 100 se isAlreadyPercentage = true)
 * @param options - Opções
 * @returns String formatada como porcentagem
 *
 * @example
 * ```ts
 * formatPercentage(0.1234);              // "12,34%"
 * formatPercentage(0.5);                 // "50%"
 * formatPercentage(75, { isAlreadyPercentage: true }); // "75%"
 * ```
 */
export function formatPercentage(
  value: number,
  options?: {
    decimals?: number;
    isAlreadyPercentage?: boolean;
  }
): string {
  const { decimals = 0, isAlreadyPercentage = false } = options || {};
  const percentValue = isAlreadyPercentage ? value : value * 100;

  return new Intl.NumberFormat(FORMAT.LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(isAlreadyPercentage ? value / 100 : value);
}

/**
 * Formata data no formato brasileiro
 *
 * @param date - Data a formatar
 * @param formatString - Formato desejado (padrão: 'dd/MM/yyyy')
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatDate(new Date());                    // "27/11/2024"
 * formatDate(new Date(), 'dd/MM/yyyy HH:mm'); // "27/11/2024 14:30"
 * formatDate('2024-11-27', 'dd MMM yyyy');    // "27 nov 2024"
 * ```
 */
export function formatDate(
  date: Date | string | number,
  formatString: string = FORMAT.DATE
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  return dateFnsFormat(dateObj, formatString, { locale: ptBR });
}

/**
 * Formata data relativa (há X minutos/horas/dias)
 *
 * @param date - Data a formatar
 * @returns String formatada relativamente
 *
 * @example
 * ```ts
 * formatRelativeDate(new Date(Date.now() - 5 * 60 * 1000)); // "há 5 minutos"
 * formatRelativeDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)); // "há 2 dias"
 * ```
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: ptBR,
  });
}

/**
 * Formata data de forma inteligente
 * - Hoje: "Hoje às 14:30"
 * - Ontem: "Ontem às 14:30"
 * - Esta semana: "Seg às 14:30"
 * - Mais de 7 dias: "27/11/2024"
 *
 * @param date - Data a formatar
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatSmartDate(new Date()); // "Hoje às 14:30"
 * formatSmartDate(yesterday);  // "Ontem às 19:45"
 * ```
 */
export function formatSmartDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  if (isToday(dateObj)) {
    return `Hoje às ${dateFnsFormat(dateObj, FORMAT.TIME)}`;
  }

  if (isYesterday(dateObj)) {
    return `Ontem às ${dateFnsFormat(dateObj, FORMAT.TIME)}`;
  }

  const daysDiff = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) {
    return dateFnsFormat(dateObj, "EEE 'às' HH:mm", { locale: ptBR });
  }

  return dateFnsFormat(dateObj, FORMAT.DATE, { locale: ptBR });
}

/**
 * Formata telefone brasileiro
 *
 * @param phone - Número de telefone (apenas dígitos ou com +55)
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatPhone('11999887766');     // "(11) 99988-7766"
 * formatPhone('+5511999887766');  // "+55 (11) 99988-7766"
 * formatPhone('1133334444');      // "(11) 3333-4444"
 * ```
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // Com código do país (+55)
  if (cleaned.startsWith('55') && cleaned.length === 13) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }

  // Celular (11 dígitos)
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  // Fixo (10 dígitos)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  return phone; // Retorna original se não reconhecer formato
}

/**
 * Formata CPF
 *
 * @param cpf - CPF (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatCPF('12345678901'); // "123.456.789-01"
 * ```
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return cpf;
  }

  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

/**
 * Formata CNPJ
 *
 * @param cnpj - CNPJ (apenas dígitos)
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatCNPJ('12345678000199'); // "12.345.678/0001-99"
 * ```
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) {
    return cnpj;
  }

  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
}

/**
 * Formata bytes em tamanho legível
 *
 * @param bytes - Tamanho em bytes
 * @param decimals - Casas decimais (padrão: 2)
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatBytes(1024);           // "1 KB"
 * formatBytes(1536);           // "1.5 KB"
 * formatBytes(1048576);        // "1 MB"
 * formatBytes(1073741824);     // "1 GB"
 * formatBytes(1234567, 1);     // "1.2 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Abrevia nome completo para iniciais
 *
 * @param name - Nome completo
 * @param maxInitials - Máximo de iniciais (padrão: 2)
 * @returns Iniciais
 *
 * @example
 * ```ts
 * formatInitials('João Silva');          // "JS"
 * formatInitials('Maria Santos Costa');  // "MS"
 * formatInitials('Ana Paula', 3);        // "AP"
 * ```
 */
export function formatInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .filter((word) => word.length > 2) // Ignora preposições
    .slice(0, maxInitials)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Trunca texto com ellipsis
 *
 * @param text - Texto a truncar
 * @param maxLength - Comprimento máximo
 * @param suffix - Sufixo (padrão: '...')
 * @returns Texto truncado
 *
 * @example
 * ```ts
 * truncate('Texto muito longo aqui', 10);        // "Texto muit..."
 * truncate('Short', 10);                         // "Short"
 * truncate('Texto longo', 10, ' [...]');         // "Texto long [...]"
 * ```
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Formata número de forma compacta (1K, 1M, 1B)
 *
 * @param value - Valor numérico
 * @returns String formatada
 *
 * @example
 * ```ts
 * formatCompactNumber(1234);          // "1.2K"
 * formatCompactNumber(1234567);       // "1.2M"
 * formatCompactNumber(1234567890);    // "1.2B"
 * ```
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(FORMAT.LOCALE, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

/**
 * Capitaliza primeira letra de cada palavra
 *
 * @param text - Texto a capitalizar
 * @returns Texto capitalizado
 *
 * @example
 * ```ts
 * capitalize('joão silva');         // "João Silva"
 * capitalize('MARIA SANTOS');       // "Maria Santos"
 * ```
 */
export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Remove acentos de texto
 *
 * @param text - Texto com acentos
 * @returns Texto sem acentos
 *
 * @example
 * ```ts
 * removeAccents('José García');     // "Jose Garcia"
 * removeAccents('Ação');             // "Acao"
 * ```
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
