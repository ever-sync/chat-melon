import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { PipelineListContainer } from "@/components/crm/PipelineListContainer";
import { usePipelines } from "@/hooks/crm/usePipelines";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, Settings2, Search, Filter, X, BarChart3, LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export interface DealFilters {
  search: string;
  assignedTo: string;
  priority: string;
  temperature: string;
}

export default function CRM() {
  const { pipelines, defaultPipeline } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(defaultPipeline?.id);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"board" | "list" | "calendar">("board");

  // Estados de filtros
  const [filters, setFilters] = useState<DealFilters>({
    search: "",
    assignedTo: "all",
    priority: "all",
    temperature: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Buscar usuários para filtro de responsável
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  // Sincronizar selectedPipelineId com defaultPipeline quando carregar
  useEffect(() => {
    if (defaultPipeline?.id && !selectedPipelineId) {
      setSelectedPipelineId(defaultPipeline.id);
    }
  }, [defaultPipeline?.id, selectedPipelineId]);

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      search: "",
      assignedTo: "all",
      priority: "all",
      temperature: "all",
    });
  };

  // Contar filtros ativos
  const activeFiltersCount = [
    filters.search,
    filters.assignedTo !== "all" ? filters.assignedTo : "",
    filters.priority !== "all" ? filters.priority : "",
    filters.temperature !== "all" ? filters.temperature : "",
  ].filter(Boolean).length;

  return (
    <MainLayout>
      <div className="space-y-8 h-full flex flex-col p-6">
        {/* Premium Header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm">
                <TrendingUp className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Pipeline de Vendas
                </h1>
                <p className="text-gray-500 mt-1 text-base">
                  Visualize e gerencie suas oportunidades de negócio
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Select
              value={selectedPipelineId}
              onValueChange={setSelectedPipelineId}
            >
              <SelectTrigger className="w-[280px] h-11 rounded-xl border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {pipeline.name}
                      {pipeline.is_default && (
                        <span className="text-xs text-gray-500 ml-1">(Padrão)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Switcher */}
            <div className="flex items-center bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                className={`h-9 px-3 rounded-md transition-all ${viewMode === "board" ? "shadow-sm font-medium" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className={`h-9 px-3 rounded-md transition-all ${viewMode === "list" ? "shadow-sm font-medium" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="sm"
                className={`h-9 px-3 rounded-md transition-all ${viewMode === "calendar" ? "shadow-sm font-medium" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setViewMode("calendar")}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Agenda
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2" />

            <Button
              variant="outline"
              className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105"
              onClick={() => navigate("/settings/pipelines")}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="space-y-3 flex-shrink-0">
          {/* Linha principal: Busca + Toggle de filtros */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar negócios por título..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-10 rounded-lg"
              />
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 rounded-lg"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 min-w-[20px] h-5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-10 rounded-lg text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Filtros avançados (colapsável) */}
          {showFilters && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={filters.assignedTo}
                  onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters({ ...filters, priority: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperatura</label>
                <Select
                  value={filters.temperature}
                  onValueChange={(value) => setFilters({ ...filters, temperature: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="hot">🔥 Quente</SelectItem>
                    <SelectItem value="warm">☀️ Morno</SelectItem>
                    <SelectItem value="cold">❄️ Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Views */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden -mx-6 px-6">
          {viewMode === "board" ? (
            <PipelineBoard selectedPipelineId={selectedPipelineId} filters={filters} />
          ) : (
            <PipelineListContainer selectedPipelineId={selectedPipelineId} filters={filters} viewMode={viewMode} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
