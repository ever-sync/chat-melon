import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/config/constants';

/**
 * Hook para detectar media queries e responsividade
 *
 * @param query - Media query string
 * @returns Se a media query corresponde
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *
 *   return (
 *     <div>
 *       {isMobile && <MobileView />}
 *       {isDesktop && <DesktopView />}
 *       Theme: {prefersDark ? 'Dark' : 'Light'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set valor inicial
    setMatches(mediaQuery.matches);

    // Handler para mudanças
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Listener moderno
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback para navegadores antigos
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Hook com helpers pré-configurados para breakpoints comuns
 *
 * @returns Objeto com flags de responsividade
 *
 * @example
 * ```tsx
 * function Navigation() {
 *   const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoint();
 *
 *   return (
 *     <nav>
 *       {isMobile && <MobileMenu />}
 *       {isTablet && <TabletMenu />}
 *       {isDesktop && <DesktopMenu />}
 *       <p>Current: {currentBreakpoint}</p>
 *     </nav>
 *   );
 * }
 * ```
 */
export function useBreakpoint() {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.SM}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.MD}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.XL}px)`);
  const is2Xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2XL']}px)`);

  // Determina breakpoint atual
  let currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xs';
  if (is2Xl) currentBreakpoint = '2xl';
  else if (isXl) currentBreakpoint = 'xl';
  else if (isLg) currentBreakpoint = 'lg';
  else if (isMd) currentBreakpoint = 'md';
  else if (isSm) currentBreakpoint = 'sm';

  return {
    /** Extra small (< 640px) */
    isXs: !isSm,

    /** Small (>= 640px) */
    isSm: isSm && !isMd,

    /** Medium (>= 768px) */
    isMd: isMd && !isLg,

    /** Large (>= 1024px) */
    isLg: isLg && !isXl,

    /** Extra large (>= 1280px) */
    isXl: isXl && !is2Xl,

    /** 2XL (>= 1536px) */
    is2Xl,

    /** Mobile (< 768px) */
    isMobile: !isMd,

    /** Tablet (768px - 1023px) */
    isTablet: isMd && !isLg,

    /** Desktop (>= 1024px) */
    isDesktop: isLg,

    /** Breakpoint atual */
    currentBreakpoint,

    /** Largura da tela em pixels */
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  };
}

/**
 * Hook para detectar orientação do dispositivo
 *
 * @returns Orientação atual
 *
 * @example
 * ```tsx
 * function VideoPlayer() {
 *   const orientation = useOrientation();
 *
 *   return (
 *     <div className={orientation === 'landscape' ? 'fullscreen' : ''}>
 *       <video />
 *       <p>Orientação: {orientation}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Hook para detectar preferências do sistema
 *
 * @returns Preferências detectadas
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     prefersDarkMode,
 *     prefersReducedMotion,
 *     prefersHighContrast,
 *   } = useSystemPreferences();
 *
 *   return (
 *     <div
 *       className={prefersDarkMode ? 'dark' : ''}
 *       data-reduced-motion={prefersReducedMotion}
 *     >
 *       <YourApp />
 *     </div>
 *   );
 * }
 * ```
 */
export function useSystemPreferences() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const prefersReducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)');

  return {
    /** Usuário prefere dark mode */
    prefersDarkMode,

    /** Usuário prefere animações reduzidas */
    prefersReducedMotion,

    /** Usuário prefere alto contraste */
    prefersHighContrast,

    /** Usuário prefere transparência reduzida */
    prefersReducedTransparency,
  };
}

/**
 * Hook para detectar tipo de dispositivo
 *
 * @returns Tipo de dispositivo detectado
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isTouch, isDesktop, isMobile } = useDeviceType();
 *
 *   return (
 *     <div>
 *       {isTouch && <TouchOptimizedUI />}
 *       {isMobile && <p>Você está no mobile</p>}
 *       {isDesktop && <p>Você está no desktop</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeviceType() {
  const [isTouch, setIsTouch] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    // Detecta suporte a touch
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as { msMaxTouchPoints?: number }).msMaxTouchPoints > 0;

    setIsTouch(hasTouchScreen);
  }, []);

  return {
    /** Dispositivo com touch */
    isTouch,

    /** Mobile (< 768px) */
    isMobile,

    /** Tablet (768px - 1023px) */
    isTablet,

    /** Desktop (>= 1024px) */
    isDesktop,

    /** Smartphone (mobile + touch) */
    isSmartphone: isMobile && isTouch,

    /** Desktop com touch (tablets grandes, híbridos) */
    isTouchDesktop: isDesktop && isTouch,
  };
}
