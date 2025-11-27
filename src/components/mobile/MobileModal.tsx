import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MobileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modal otimizado para mobile - fullscreen em dispositivos móveis
 */
export const MobileModal = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: MobileModalProps) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          isMobile && [
            "fixed inset-0 h-screen max-h-screen w-screen max-w-none",
            "rounded-none border-none p-0 m-0",
            "flex flex-col"
          ]
        )}
      >
        {/* Header fixo */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold flex-1">
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>

        {/* Footer fixo (se fornecido) */}
        {footer && (
          <div className="p-4 border-t bg-background shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
