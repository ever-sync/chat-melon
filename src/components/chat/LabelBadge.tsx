import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface LabelBadgeProps {
  name: string;
  color: string;
  icon?: string | null;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

export function LabelBadge({ 
  name, 
  color, 
  icon, 
  className, 
  onClick,
  variant = "default" 
}: LabelBadgeProps) {
  // Busca o ícone dinamicamente do lucide-react
  const IconComponent = icon && (LucideIcons as any)[icon] as LucideIcon;
  
  // Calcula cor do texto baseado na luminância da cor de fundo
  const getTextColor = (hexColor: string) => {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 128 ? '#000000' : '#FFFFFF';
  };

  const textColor = getTextColor(color);
  
  return (
    <Badge
      variant={variant}
      className={cn(
        "text-xs font-medium flex items-center gap-1 cursor-pointer transition-all hover:scale-105",
        variant === "default" && "border-0",
        className
      )}
      style={
        variant === "default"
          ? {
              backgroundColor: `${color}33`, // 20% opacity
              color: color,
            }
          : {
              borderColor: color,
              color: color,
              backgroundColor: 'transparent',
            }
      }
      onClick={onClick}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      <span>{name}</span>
    </Badge>
  );
}
