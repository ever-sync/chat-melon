import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { ChannelIcon, getChannelLabel } from './ChannelIcon';
import type { ChannelType } from '@/types/channels';
import { cn } from '@/lib/utils';

interface ChannelFilterProps {
  selectedChannels: ChannelType[];
  onChannelsChange: (channels: ChannelType[]) => void;
  availableChannels?: ChannelType[];
  className?: string;
}

const ALL_CHANNELS: ChannelType[] = [
  'whatsapp',
  'instagram',
  'messenger',
  'telegram',
  'widget',
  'email',
];

export const ChannelFilter = ({
  selectedChannels,
  onChannelsChange,
  availableChannels = ALL_CHANNELS,
  className,
}: ChannelFilterProps) => {
  const toggleChannel = (channel: ChannelType) => {
    if (selectedChannels.includes(channel)) {
      onChannelsChange(selectedChannels.filter((c) => c !== channel));
    } else {
      onChannelsChange([...selectedChannels, channel]);
    }
  };

  const selectAll = () => {
    onChannelsChange([...availableChannels]);
  };

  const clearAll = () => {
    onChannelsChange([]);
  };

  const hasFilter =
    selectedChannels.length > 0 && selectedChannels.length < availableChannels.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasFilter ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('gap-2', className)}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Canais</span>
          {hasFilter && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
              {selectedChannels.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Filtrar por Canal</span>
          {hasFilter && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearAll}>
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {availableChannels.map((channel) => (
          <DropdownMenuCheckboxItem
            key={channel}
            checked={selectedChannels.includes(channel)}
            onCheckedChange={() => toggleChannel(channel)}
            className="gap-2"
          >
            <ChannelIcon type={channel} size="sm" />
            <span>{getChannelLabel(channel)}</span>
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={selectAll}>
            Todos
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={clearAll}>
            Nenhum
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Compact version for mobile
interface ChannelFilterChipsProps {
  selectedChannels: ChannelType[];
  onChannelsChange: (channels: ChannelType[]) => void;
  availableChannels?: ChannelType[];
  className?: string;
}

export const ChannelFilterChips = ({
  selectedChannels,
  onChannelsChange,
  availableChannels = ALL_CHANNELS,
  className,
}: ChannelFilterChipsProps) => {
  const toggleChannel = (channel: ChannelType) => {
    if (selectedChannels.includes(channel)) {
      // If it's the only selected, do nothing (keep at least one selected)
      // Or clear all if you want to show all when none selected
      onChannelsChange(selectedChannels.filter((c) => c !== channel));
    } else {
      onChannelsChange([...selectedChannels, channel]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {availableChannels.map((channel) => {
        const isSelected = selectedChannels.length === 0 || selectedChannels.includes(channel);

        return (
          <button
            key={channel}
            onClick={() => toggleChannel(channel)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all',
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <ChannelIcon type={channel} size="xs" />
            <span className="hidden sm:inline">{getChannelLabel(channel)}</span>
          </button>
        );
      })}
    </div>
  );
};
