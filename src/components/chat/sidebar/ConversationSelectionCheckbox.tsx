import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ConversationSelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const ConversationSelectionCheckbox = ({
  checked,
  onCheckedChange,
  className,
}: ConversationSelectionCheckboxProps) => {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        className={cn(
          'h-5 w-5 rounded-full border-2 transition-all',
          'data-[state=checked]:bg-primary data-[state=checked]:border-primary'
        )}
      />
    </div>
  );
};
