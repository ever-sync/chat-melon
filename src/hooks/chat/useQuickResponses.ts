import { useState, useCallback, useMemo } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import type { ShortcutSuggestion } from '@/types/quickResponses';

interface UseQuickResponsesOptions {
  maxSuggestions?: number;
}

export const useQuickResponses = (options: UseQuickResponsesOptions = {}) => {
  const { maxSuggestions = 5 } = options;
  const [inputValue, setInputValue] = useState('');
  const [isShortcutMode, setIsShortcutMode] = useState(false);
  const [shortcutSearch, setShortcutSearch] = useState('');

  const { templates, incrementUsage } = useTemplates();

  // Detect if user is typing a shortcut (starts with /)
  const detectShortcut = useCallback((value: string): { isShortcut: boolean; search: string } => {
    // Check if the input starts with / or has a / at cursor position
    const shortcutMatch = value.match(/^\/(\S*)$/);
    if (shortcutMatch) {
      return { isShortcut: true, search: shortcutMatch[1] };
    }

    // Check for / anywhere (for mid-message shortcuts)
    const lastSlashIndex = value.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const afterSlash = value.substring(lastSlashIndex + 1);
      // Only if there's no space after the slash (still typing the shortcut)
      if (!afterSlash.includes(' ')) {
        return { isShortcut: true, search: afterSlash };
      }
    }

    return { isShortcut: false, search: '' };
  }, []);

  // Get shortcut suggestions based on input
  const suggestions = useMemo((): ShortcutSuggestion[] => {
    if (!isShortcutMode || !shortcutSearch) {
      // Show all templates with shortcuts when just typing /
      if (isShortcutMode && !shortcutSearch) {
        return templates
          .filter(t => t.shortcut)
          .slice(0, maxSuggestions)
          .map(t => ({
            shortcut: t.shortcut!,
            name: t.name,
            content: t.content,
            category: t.category || undefined,
            preview: t.content.slice(0, 60) + (t.content.length > 60 ? '...' : ''),
            matchType: 'exact' as const,
          }));
      }
      return [];
    }

    const searchLower = shortcutSearch.toLowerCase();

    // First, find exact shortcut matches
    const exactMatches = templates
      .filter(t => t.shortcut?.toLowerCase() === searchLower)
      .map(t => ({
        shortcut: t.shortcut!,
        name: t.name,
        content: t.content,
        category: t.category || undefined,
        preview: t.content.slice(0, 60) + (t.content.length > 60 ? '...' : ''),
        matchType: 'exact' as const,
      }));

    // Then, find partial matches (shortcut starts with search)
    const partialMatches = templates
      .filter(t =>
        t.shortcut?.toLowerCase().startsWith(searchLower) &&
        t.shortcut?.toLowerCase() !== searchLower
      )
      .map(t => ({
        shortcut: t.shortcut!,
        name: t.name,
        content: t.content,
        category: t.category || undefined,
        preview: t.content.slice(0, 60) + (t.content.length > 60 ? '...' : ''),
        matchType: 'partial' as const,
      }));

    // Also search by name/content if no shortcut matches
    const contentMatches = templates
      .filter(t =>
        !t.shortcut?.toLowerCase().startsWith(searchLower) &&
        (t.name.toLowerCase().includes(searchLower) ||
          t.content.toLowerCase().includes(searchLower))
      )
      .slice(0, maxSuggestions - exactMatches.length - partialMatches.length)
      .map(t => ({
        shortcut: t.shortcut || `#${t.name.slice(0, 10)}`,
        name: t.name,
        content: t.content,
        category: t.category || undefined,
        preview: t.content.slice(0, 60) + (t.content.length > 60 ? '...' : ''),
        matchType: 'partial' as const,
      }));

    return [...exactMatches, ...partialMatches, ...contentMatches].slice(0, maxSuggestions);
  }, [templates, isShortcutMode, shortcutSearch, maxSuggestions]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    const { isShortcut, search } = detectShortcut(value);
    setIsShortcutMode(isShortcut);
    setShortcutSearch(search);
  }, [detectShortcut]);

  // Select a suggestion and replace the shortcut in the input
  const selectSuggestion = useCallback((suggestion: ShortcutSuggestion): string => {
    // Find the template to increment usage
    const template = templates.find(t => t.shortcut === suggestion.shortcut);
    if (template) {
      incrementUsage.mutate(template.id);
    }

    // Replace the /shortcut with the content
    const lastSlashIndex = inputValue.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const beforeSlash = inputValue.substring(0, lastSlashIndex);
      return beforeSlash + suggestion.content;
    }

    return suggestion.content;
  }, [inputValue, templates, incrementUsage]);

  // Check if Enter should select suggestion or send message
  const shouldSelectSuggestion = useCallback((selectedIndex: number): boolean => {
    return isShortcutMode && suggestions.length > 0 && selectedIndex >= 0;
  }, [isShortcutMode, suggestions.length]);

  // Reset shortcut mode
  const resetShortcutMode = useCallback(() => {
    setIsShortcutMode(false);
    setShortcutSearch('');
  }, []);

  return {
    inputValue,
    setInputValue: handleInputChange,
    isShortcutMode,
    shortcutSearch,
    suggestions,
    selectSuggestion,
    shouldSelectSuggestion,
    resetShortcutMode,
  };
};

// Hook for keyboard navigation in suggestions
export const useShortcutNavigation = (suggestionsCount: number) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent): 'select' | 'navigate' | 'none' => {
    if (suggestionsCount === 0) return 'none';

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestionsCount - 1 ? prev + 1 : 0
        );
        return 'navigate';

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestionsCount - 1
        );
        return 'navigate';

      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          return 'select';
        }
        return 'none';

      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault();
          return 'select';
        }
        return 'none';

      case 'Escape':
        e.preventDefault();
        setSelectedIndex(-1);
        return 'navigate';

      default:
        return 'none';
    }
  }, [suggestionsCount, selectedIndex]);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    resetSelection,
  };
};
