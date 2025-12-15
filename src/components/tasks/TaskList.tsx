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
import { Plus, Search, AlertCircle } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { useTasks } from "@/hooks/crm/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TablesInsert } from "@/integrations/supabase/types";

export const TaskList = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>();
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
  });

  const {
    tasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  } = useTasks({
    status: filters.status === "all" ? undefined : filters.status || undefined,
    priority: filters.priority === "all" ? undefined : filters.priority || undefined,
  });

  const filteredTasks = tasks.filter((task) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.contacts?.name?.toLowerCase().includes(searchLower)
    );
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const handleSubmit = async (data: TablesInsert<"tasks">) => {
    if (editingTask) {
      return await updateTask.mutateAsync({ id: editingTask.id, ...data });
    } else {
      return await createTask.mutateAsync(data);
    }
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
        {overdueTasks.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem {overdueTasks.length} tarefa{overdueTasks.length > 1 ? "s" : ""}{" "}
              atrasada{overdueTasks.length > 1 ? "s" : ""}!
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tarefas</CardTitle>
              <Button onClick={() => { setEditingTask(undefined); setModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              {pendingTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    PENDENTES ({pendingTasks.length})
                  </h3>
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={() => completeTask.mutate(task.id)}
                      onEdit={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      onDelete={() => {
                        if (confirm("Deseja realmente excluir esta tarefa?")) {
                          deleteTask.mutate(task.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    CONCLUÍDAS ({completedTasks.length})
                  </h3>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={() => {}}
                      onEdit={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      onDelete={() => {
                        if (confirm("Deseja realmente excluir esta tarefa?")) {
                          deleteTask.mutate(task.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        onSubmit={handleSubmit}
      />
    </>
  );
};
