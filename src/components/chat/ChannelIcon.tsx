import { MessageCircle, Instagram, Facebook, Send, MessageSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChannelType } from '@/types/channels';

interface ChannelIconProps {
  type: ChannelType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const CHANNEL_CONFIG: Record<
  ChannelType,
  {
    icon: typeof MessageCircle;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  whatsapp: {
    icon: MessageCircle,
    color: '#25D366',
    bgColor: 'bg-[#25D366]/10',
    label: 'WhatsApp',
  },
  instagram: {
    icon: Instagram,
    color: '#E4405F',
    bgColor: 'bg-[#E4405F]/10',
    label: 'Instagram',
  },
  messenger: {
    icon: Facebook,
    color: '#0084FF',
    bgColor: 'bg-[#0084FF]/10',
    label: 'Messenger',
  },
  telegram: {
    icon: Send,
    color: '#0088cc',
    bgColor: 'bg-[#0088cc]/10',
    label: 'Telegram',
  },
  widget: {
    icon: MessageSquare,
    color: '#22C55E',
    bgColor: 'bg-primary/10',
    label: 'Widget',
  },
  email: {
    icon: Mail,
    color: '#6366F1',
    bgColor: 'bg-[#6366F1]/10',
    label: 'Email',
  },
};

const SIZE_CONFIG = {
  xs: { icon: 'h-3 w-3', container: 'h-5 w-5' },
  sm: { icon: 'h-4 w-4', container: 'h-6 w-6' },
  md: { icon: 'h-5 w-5', container: 'h-8 w-8' },
  lg: { icon: 'h-6 w-6', container: 'h-10 w-10' },
};

export const ChannelIcon = ({
  type,
  size = 'sm',
  showBackground = false,
  className,
}: ChannelIconProps) => {
  const config = CHANNEL_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  if (showBackground) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          config.bgColor,
          sizeConfig.container,
          className
        )}
        title={config.label}
      >
        <Icon className={sizeConfig.icon} style={{ color: config.color }} />
      </div>
    );
  }

  return (
    <Icon
      className={cn(sizeConfig.icon, className)}
      style={{ color: config.color }}
      title={config.label}
    />
  );
};

// Badge version for conversation list
interface ChannelBadgeProps {
  type: ChannelType;
  className?: string;
}

export const ChannelBadge = ({ type, className }: ChannelBadgeProps) => {
  const config = CHANNEL_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        className
      )}
      style={{ color: config.color }}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
};

// Simple dot indicator
interface ChannelDotProps {
  type: ChannelType;
  className?: string;
}

export const ChannelDot = ({ type, className }: ChannelDotProps) => {
  const config = CHANNEL_CONFIG[type];

  return (
    <div
      className={cn('h-2 w-2 rounded-full', className)}
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
};

// Get channel color for styling
export const getChannelColor = (type: ChannelType): string => {
  return CHANNEL_CONFIG[type].color;
};

// Get channel label
export const getChannelLabel = (type: ChannelType): string => {
  return CHANNEL_CONFIG[type].label;
};
