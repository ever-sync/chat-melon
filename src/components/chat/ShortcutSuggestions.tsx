import { forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ShortcutSuggestion } from '@/types/quickResponses';
import { Command, Zap } from 'lucide-react';

interface ShortcutSuggestionsProps {
  suggestions: ShortcutSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: ShortcutSuggestion) => void;
  onHover: (index: number) => void;
}

export const ShortcutSuggestions = forwardRef<HTMLDivElement, ShortcutSuggestionsProps>(
  ({ suggestions, selectedIndex, onSelect, onHover }, ref) => {
    if (suggestions.length === 0) return null;

    return (
      <div
        ref={ref}
        className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
      >
        <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Atalhos Rápidos
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            ↑↓ navegar • Enter selecionar • Esc fechar
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.shortcut}-${index}`}
              className={cn(
                'w-full text-left px-3 py-2 transition-colors flex items-start gap-3',
                'hover:bg-accent focus:bg-accent outline-none',
                selectedIndex === index && 'bg-accent'
              )}
              onClick={() => onSelect(suggestion)}
              onMouseEnter={() => onHover(index)}
            >
              <div className="flex-shrink-0 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-xs',
                    suggestion.matchType === 'exact'
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted'
                  )}
                >
                  /{suggestion.shortcut}
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {suggestion.name}
                  </span>
                  {suggestion.category && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {suggestion.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {suggestion.preview}
                </p>
              </div>

              {selectedIndex === index && (
                <div className="flex-shrink-0 self-center">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">
                    ↵
                  </kbd>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

ShortcutSuggestions.displayName = 'ShortcutSuggestions';
