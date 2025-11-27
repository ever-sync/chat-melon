import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para usar localStorage com TypeScript e sincronização
 * Automaticamente serializa/deserializa JSON
 *
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial se não existir no storage
 * @returns Tupla [valor, setter, remover]
 *
 * @example
 * ```tsx
 * interface UserPreferences {
 *   theme: 'light' | 'dark';
 *   notifications: boolean;
 * }
 *
 * function Settings() {
 *   const [prefs, setPrefs, removePrefs] = useLocalStorage<UserPreferences>(
 *     'user-preferences',
 *     { theme: 'light', notifications: true }
 *   );
 *
 *   return (
 *     <div>
 *       <select
 *         value={prefs.theme}
 *         onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
 *       >
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Função para setar o valor
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Permite passar função como no useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          // Dispara evento customizado para sincronização entre tabs
          window.dispatchEvent(
            new CustomEvent('local-storage', {
              detail: { key, value: valueToStore },
            })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Função para remover o valor
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);

        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, value: undefined },
          })
        );
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sincronização entre tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors
        }
      } else if ('detail' in e && e.detail?.key === key) {
        setStoredValue(e.detail.value ?? initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('local-storage', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook para usar sessionStorage (similar ao useLocalStorage)
 * Dados são limpos ao fechar a aba/janela
 *
 * @param key - Chave do sessionStorage
 * @param initialValue - Valor inicial
 * @returns Tupla [valor, setter, remover]
 *
 * @example
 * ```tsx
 * function SearchPage() {
 *   const [searchTerm, setSearchTerm] = useSessionStorage('search-term', '');
 *
 *   return <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
 * }
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook para detectar se há suporte a localStorage
 *
 * @returns Se localStorage está disponível
 *
 * @example
 * ```tsx
 * function App() {
 *   const hasStorage = useIsStorageAvailable();
 *
 *   if (!hasStorage) {
 *     return <div>LocalStorage não disponível no seu navegador</div>;
 *   }
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function useIsStorageAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  return available;
}
