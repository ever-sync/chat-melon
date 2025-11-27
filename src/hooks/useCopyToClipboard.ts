import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Resultado do hook useCopyToClipboard
 */
interface UseCopyToClipboardResult {
  /** Último valor copiado */
  copiedText: string | null;
  /** Função para copiar texto */
  copy: (text: string) => Promise<boolean>;
  /** Se está no processo de copiar */
  isCopying: boolean;
}

/**
 * Hook para copiar texto para a área de transferência
 * Com feedback visual automático via toast
 *
 * @param options - Opções de configuração
 * @returns Objeto com função de copiar e estado
 *
 * @example
 * ```tsx
 * function ShareLink() {
 *   const { copy, copiedText } = useCopyToClipboard();
 *
 *   return (
 *     <div>
 *       <input value="https://example.com/share/123" readOnly />
 *       <button onClick={() => copy('https://example.com/share/123')}>
 *         {copiedText ? 'Copiado!' : 'Copiar Link'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function CodeBlock({ code }: { code: string }) {
 *   const { copy, isCopying } = useCopyToClipboard({
 *     successMessage: 'Código copiado!',
 *   });
 *
 *   return (
 *     <pre>
 *       <code>{code}</code>
 *       <button onClick={() => copy(code)} disabled={isCopying}>
 *         {isCopying ? 'Copiando...' : 'Copiar'}
 *       </button>
 *     </pre>
 *   );
 * }
 * ```
 */
export function useCopyToClipboard(options?: {
  /** Mensagem de sucesso customizada */
  successMessage?: string;
  /** Mensagem de erro customizada */
  errorMessage?: string;
  /** Se deve mostrar toast de sucesso */
  showSuccessToast?: boolean;
  /** Se deve mostrar toast de erro */
  showErrorToast?: boolean;
  /** Timeout para resetar copiedText (ms) */
  resetTimeout?: number;
}): UseCopyToClipboardResult {
  const {
    successMessage = 'Copiado para área de transferência!',
    errorMessage = 'Erro ao copiar',
    showSuccessToast = true,
    showErrorToast = true,
    resetTimeout = 2000,
  } = options || {};

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard API não suportada');
        if (showErrorToast) {
          toast.error('Navegador não suporta copiar para área de transferência');
        }
        return false;
      }

      // Se já está copiando, ignora
      if (isCopying) {
        return false;
      }

      try {
        setIsCopying(true);

        await navigator.clipboard.writeText(text);

        setCopiedText(text);

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        // Reseta após timeout
        setTimeout(() => {
          setCopiedText(null);
        }, resetTimeout);

        return true;
      } catch (error) {
        console.error('Erro ao copiar:', error);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        setCopiedText(null);
        return false;
      } finally {
        setIsCopying(false);
      }
    },
    [isCopying, successMessage, errorMessage, showSuccessToast, showErrorToast, resetTimeout]
  );

  return { copiedText, copy, isCopying };
}

/**
 * Hook simplificado que apenas retorna a função de copiar
 * sem estado
 *
 * @param successMessage - Mensagem de sucesso opcional
 * @returns Função de copiar
 *
 * @example
 * ```tsx
 * function QuickCopy() {
 *   const copy = useCopy('Link copiado!');
 *
 *   return (
 *     <button onClick={() => copy('https://example.com')}>
 *       Copiar
 *     </button>
 *   );
 * }
 * ```
 */
export function useCopy(successMessage?: string) {
  const { copy } = useCopyToClipboard({
    successMessage,
  });
  return copy;
}

/**
 * Hook para copiar HTML formatado
 * Copia tanto em HTML quanto texto plano
 *
 * @returns Função de copiar HTML
 *
 * @example
 * ```tsx
 * function RichTextEditor() {
 *   const copyHTML = useCopyHTML();
 *
 *   const handleCopy = () => {
 *     const html = '<b>Bold text</b> and <i>italic</i>';
 *     const text = 'Bold text and italic';
 *     copyHTML(html, text);
 *   };
 *
 *   return <button onClick={handleCopy}>Copiar Formatação</button>;
 * }
 * ```
 */
export function useCopyHTML() {
  return useCallback(async (html: string, plainText?: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API não suportada');
      toast.error('Navegador não suporta copiar HTML');
      return false;
    }

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText || html], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ]);

      toast.success('Formatação copiada!');
      return true;
    } catch (error) {
      console.error('Erro ao copiar HTML:', error);
      toast.error('Erro ao copiar formatação');
      return false;
    }
  }, []);
}

/**
 * Hook para ler da área de transferência
 * Requer permissão do usuário
 *
 * @returns Função de leitura e estado
 *
 * @example
 * ```tsx
 * function PasteButton() {
 *   const { read, text, isReading } = useReadClipboard();
 *
 *   return (
 *     <div>
 *       <button onClick={read} disabled={isReading}>
 *         {isReading ? 'Lendo...' : 'Colar'}
 *       </button>
 *       {text && <p>Colado: {text}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useReadClipboard() {
  const [text, setText] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const read = useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API não suportada');
      toast.error('Navegador não suporta ler da área de transferência');
      return null;
    }

    try {
      setIsReading(true);

      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);

      return clipboardText;
    } catch (error) {
      console.error('Erro ao ler clipboard:', error);
      toast.error('Erro ao ler área de transferência. Permissão negada?');
      return null;
    } finally {
      setIsReading(false);
    }
  }, []);

  return { read, text, isReading };
}
