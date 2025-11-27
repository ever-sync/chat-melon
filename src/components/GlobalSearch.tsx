import { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Users, Target, CheckSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "conversation" | "contact" | "deal" | "task";
  title: string;
  subtitle: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!searchQuery || !currentCompany?.id) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      // Search conversations
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, contact_name, contact_number, last_message")
        .eq("company_id", currentCompany.id)
        .or(`contact_name.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%,last_message.ilike.%${searchQuery}%`)
        .limit(5);

      if (conversations) {
        allResults.push(
          ...conversations.map((c) => ({
            id: c.id,
            type: "conversation" as const,
            title: c.contact_name,
            subtitle: c.last_message || c.contact_number,
          }))
        );
      }

      // Search contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, phone_number")
        .eq("company_id", currentCompany.id)
        .or(`name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
        .limit(5);

      if (contacts) {
        allResults.push(
          ...contacts.map((c) => ({
            id: c.id,
            type: "contact" as const,
            title: c.name || "Sem nome",
            subtitle: c.phone_number,
          }))
        );
      }

      // Search deals
      const { data: deals } = await supabase
        .from("deals")
        .select("id, title, contacts(name)")
        .eq("company_id", currentCompany.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      if (deals) {
        allResults.push(
          ...deals.map((d: any) => ({
            id: d.id,
            type: "deal" as const,
            title: d.title,
            subtitle: d.contacts?.name || "Sem contato",
          }))
        );
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, contacts(name)")
        .eq("company_id", currentCompany.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);

      if (tasks) {
        allResults.push(
          ...tasks.map((t: any) => ({
            id: t.id,
            type: "task" as const,
            title: t.title,
            subtitle: t.contacts?.name || "Sem contato",
          }))
        );
      }

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchAll]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");

    switch (result.type) {
      case "conversation":
        navigate(`/chat?conversation=${result.id}`);
        break;
      case "contact":
        navigate(`/contacts?id=${result.id}`);
        break;
      case "deal":
        navigate(`/crm?deal=${result.id}`);
        break;
      case "task":
        navigate(`/tasks?id=${result.id}`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "conversation":
        return <MessageSquare className="h-4 w-4" />;
      case "contact":
        return <Users className="h-4 w-4" />;
      case "deal":
        return <Target className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "conversation":
        return "Conversa";
      case "contact":
        return "Contato";
      case "deal":
        return "Negócio";
      case "task":
        return "Tarefa";
      default:
        return type;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative max-w-xl flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas, contatos, negócios..."
            className="pl-12 h-11 bg-card border-border/50 rounded-xl shadow-sm focus-visible:ring-primary"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && results.length === 0 && query && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            {!isLoading && results.length > 0 && (
              <CommandGroup heading="Resultados">
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      result.type === "conversation" && "bg-blue-500/10 text-blue-500",
                      result.type === "contact" && "bg-green-500/10 text-green-500",
                      result.type === "deal" && "bg-purple-500/10 text-purple-500",
                      result.type === "task" && "bg-orange-500/10 text-orange-500"
                    )}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getTypeLabel(result.type)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
