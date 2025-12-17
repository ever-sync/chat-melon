import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export const FloatingActionButton = ({
  icon,
  onClick,
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  };

  return (
    <Button
      size="icon"
      onClick={onClick}
      className={cn(
        'fixed z-40 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform',
        positionClasses[position],
        className
      )}
    >
      {icon}
    </Button>
  );
};
