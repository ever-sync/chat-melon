import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProposalTemplates, ProposalTemplate } from "@/hooks/useProposalTemplates";
import { Search, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalTemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ProposalTemplate) => void;
}

export const ProposalTemplateGallery = ({
  open,
  onOpenChange,
  onSelectTemplate,
}: ProposalTemplateGalleryProps) => {
  const { templates, isLoading } = useProposalTemplates();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template: ProposalTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolher Template de Proposta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar templates..."
              className="pl-9"
            />
          </div>

          {/* Filtro por Categoria */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category || null)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Grid de Templates */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-32 bg-muted rounded mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={cn(
                    "border rounded-lg p-4 text-left hover:border-primary transition-colors group relative",
                    template.is_default && "border-primary/50"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded mb-3 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{template.name}</h3>
                      {template.is_default && (
                        <Badge variant="secondary" className="shrink-0">
                          <Check className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </div>

                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Usado {template.usage_count}x
                    </p>
                  </div>

                  {/* Seções Preview */}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {template.content.sections.length} seções
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Botão para começar em branco */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Começar em Branco
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
