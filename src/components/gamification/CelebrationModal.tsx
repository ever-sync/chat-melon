import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "deal_won" | "goal_achieved" | "achievement";
  data: {
    title: string;
    value?: number;
    message?: string;
    icon?: string;
  };
}

export const CelebrationModal = ({ open, onOpenChange, type, data }: CelebrationModalProps) => {
  
  useEffect(() => {
    if (open) {
      // Confetti explosion
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
        });

        confetti({
          particleCount,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10B981', '#3B82F6', '#F59E0B'],
        });

        confetti({
          particleCount,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EF4444', '#8B5CF6', '#F59E0B'],
        });
      }, 250);

      // Som de vitória (opcional)
      try {
        const audio = new Audio('/sounds/celebration.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}

      return () => clearInterval(interval);
    }
  }, [open]);

  const getTitle = () => {
    switch (type) {
      case "deal_won":
        return "🎉 Negócio Fechado!";
      case "goal_achieved":
        return "🏆 Meta Atingida!";
      case "achievement":
        return `${data.icon || "⭐"} Achievement Desbloqueado!`;
      default:
        return "🎊 Parabéns!";
    }
  };

  const getMessage = () => {
    if (data.message) return data.message;
    
    switch (type) {
      case "deal_won":
        return `Você fechou: ${data.title}${data.value ? ` - ${formatCurrency(data.value)}` : ''}`;
      case "goal_achieved":
        return `Você bateu sua meta: ${data.title}`;
      case "achievement":
        return data.title;
      default:
        return "Continue assim!";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="py-8 space-y-4">
          <div className="text-6xl animate-bounce">
            {type === "deal_won" ? "🎉" : type === "goal_achieved" ? "🏆" : data.icon || "⭐"}
          </div>
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          <p className="text-lg text-muted-foreground">{getMessage()}</p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
