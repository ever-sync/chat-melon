import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Star } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";

interface QuickRepliesProps {
  onSelect: (content: string, templateId: string) => void;
}

export const QuickReplies = ({ onSelect }: QuickRepliesProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { templates, incrementUsage } = useTemplates({
    search: search || undefined,
  });

  const handleSelect = (content: string, templateId: string) => {
    onSelect(content, templateId);
    incrementUsage.mutate(templateId);
    setOpen(false);
    setSearch("");
  };

  const favorites = templates.filter((t) => t.is_favorite);
  const others = templates.filter((t) => !t.is_favorite);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <FileText className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="p-3 space-y-3">
            {favorites.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground px-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  FAVORITOS
                </div>
                {favorites.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.content, template.id)}
                    className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">
                          {template.name}
                        </span>
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {template.variables.map((v) => (
                            <Badge
                              key={v}
                              variant="outline"
                              className="text-xs"
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {others.length > 0 && (
              <div className="space-y-2">
                {favorites.length > 0 && (
                  <div className="text-xs font-semibold text-muted-foreground px-1">
                    TODOS OS TEMPLATES
                  </div>
                )}
                {others.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.content, template.id)}
                    className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">
                          {template.name}
                        </span>
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {template.variables.map((v) => (
                            <Badge
                              key={v}
                              variant="outline"
                              className="text-xs"
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {templates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Nenhum template encontrado
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
