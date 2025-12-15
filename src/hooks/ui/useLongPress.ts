import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

/**
 * Hook para detectar long press em elementos
 * Útil para menus de contexto no mobile
 */
export const useLongPress = ({
  onLongPress,
  onClick,
  delay = 500,
}: UseLongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
    isLongPressRef.current = false;
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  };
};

// Exemplo de uso:
// const longPressHandlers = useLongPress({
//   onLongPress: () => openContextMenu(),
//   onClick: () => selectItem(),
//   delay: 500,
// });
//
// <div {...longPressHandlers}>
//   Mantenha pressionado para menu
// </div>
