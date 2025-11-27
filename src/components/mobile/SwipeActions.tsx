import { useState, useRef, ReactNode } from "react";
import { Trash2, Archive, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeAction {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}

interface SwipeActionsProps {
  children: ReactNode;
  actions: SwipeAction[];
  threshold?: number;
}

export const SwipeActions = ({ 
  children, 
  actions, 
  threshold = 80 
}: SwipeActionsProps) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const distance = startX.current - currentX;

    if (distance > 0) {
      setSwipeDistance(Math.min(distance, actions.length * 80));
    } else {
      setSwipeDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDistance >= threshold) {
      setIsRevealed(true);
      setSwipeDistance(actions.length * 80);
    } else {
      setIsRevealed(false);
      setSwipeDistance(0);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    setIsRevealed(false);
    setSwipeDistance(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Actions (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "w-20 flex flex-col items-center justify-center gap-1 text-white",
                action.color
              )}
              style={{
                transform: `translateX(${Math.max(0, (actions.length * 80) - swipeDistance)}px)`,
                transition: isRevealed ? 'transform 0.3s ease' : 'none',
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content (swipeable) */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-background"
        style={{
          transform: `translateX(-${swipeDistance}px)`,
          transition: isRevealed ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Exemplo de uso:
// <SwipeActions
//   actions={[
//     { icon: Archive, label: 'Arquivar', color: 'bg-yellow-600', onClick: () => {} },
//     { icon: Trash2, label: 'Excluir', color: 'bg-red-600', onClick: () => {} },
//   ]}
// >
//   <ConversationItem />
// </SwipeActions>
