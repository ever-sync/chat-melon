import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Star,
  Copy,
  Edit,
  Trash2,
} from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateModal } from "./dialogs/TemplateModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const TemplatesManager = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>();
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
  });

  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    toggleFavorite,
    deleteTemplate,
  } = useTemplates({
    category: filters.category === "all" ? undefined : filters.category || undefined,
    search: filters.search || undefined,
  });

  const handleSubmit = (data: TablesInsert<"message_templates">) => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...data });
    } else {
      createTemplate.mutate(data);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Template copiado!");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates de Mensagem</CardTitle>
              <Button
                onClick={() => {
                  setEditingTemplate(undefined);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="boas-vindas">Boas-vindas</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="agradecimento">Agradecimento</SelectItem>
                  <SelectItem value="objecao">Objeção</SelectItem>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Templates List */}
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum template encontrado
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">
                              {template.name}
                            </h3>
                            {template.is_favorite && (
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.content}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            {template.category && (
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                            {template.variables && template.variables.length > 0 && (
                              <div className="flex items-center gap-1">
                                {template.variables.map((v) => (
                                  <Badge
                                    key={v}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {`{{${v}}}`}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {template.usage_count || 0} usos
                            </Badge>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toggleFavorite.mutate({
                                  id: template.id,
                                  isFavorite: template.is_favorite || false,
                                })
                              }
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {template.is_favorite
                                ? "Remover favorito"
                                : "Favoritar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopy(template.content)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingTemplate(template);
                                setModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    "Deseja realmente excluir este template?"
                                  )
                                ) {
                                  deleteTemplate.mutate(template.id);
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        template={editingTemplate}
        onSubmit={handleSubmit}
      />
    </>
  );
};
