import { useState, useEffect, useRef } from 'react';
import { Search, X, Sliders, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdvancedFiltersDialog } from '@/components/chat/dialogs/AdvancedFiltersDialog';
import { ChatFilters } from '@/types/chatFilters';

type SearchBarProps = {
  onSearch: (query: string) => void;
  searchQuery: string;
  isSearching?: boolean;
  filters: ChatFilters;
  onFilterChange: (filters: Partial<ChatFilters>) => void;
  onClearAllFilters: () => void;
  conversationCounts: {
    myAttendances: number;
    unread: number;
    waiting: number;
    reEntry: number;
    active: number;
    chatbot: number;
    closed: number;
  };
  onSelectConversation?: (conversationId: string) => void;
};

const SearchBar = ({
  onSearch,
  searchQuery,
  isSearching,
  filters,
  onFilterChange,
  onClearAllFilters,
  conversationCounts,
  onSelectConversation,
}: SearchBarProps) => {
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Carregar histórico do localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(value);

      // Adicionar ao histórico se tiver texto
      if (value.trim()) {
        const newHistory = [value, ...searchHistory.filter((s) => s !== value)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('search-history', JSON.stringify(newHistory));
      }
    }, 500);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    onSearch('');
    setShowHistory(false);
  };

  const handleHistorySelect = (query: string) => {
    setLocalQuery(query);
    onSearch(query);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search-history');
  };

  return (
    <div className="p-3 border-b border-border bg-card/50 space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={localQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          placeholder="Buscar conversas ou mensagens..."
          className="pl-10 pr-20"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
          {localQuery && (
            <Button variant="ghost" size="icon" onClick={handleClearSearch} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFiltersDialog(true)}
            className="h-7 w-7"
          >
            <Sliders className="w-4 h-4" />
          </Button>
        </div>

        {/* Histórico de buscas */}
        {showHistory && searchHistory.length > 0 && !localQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Buscas recentes</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-6 text-xs"
              >
                Limpar
              </Button>
            </div>
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => handleHistorySelect(query)}
                className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
              >
                <Search className="inline w-3 h-3 mr-2 text-muted-foreground" />
                {query}
              </button>
            ))}
          </div>
        )}
      </div>

      <AdvancedFiltersDialog
        filters={filters}
        onFiltersChange={onFilterChange}
        conversationCounts={conversationCounts}
        onSelectConversation={onSelectConversation}
        open={showFiltersDialog}
        onOpenChange={setShowFiltersDialog}
      />
    </div>
  );
};

export default SearchBar;
