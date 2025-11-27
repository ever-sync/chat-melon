import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "@/hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TaskCard = ({ task, onComplete, onEdit, onDelete }: TaskCardProps) => {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTaskTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      call: "Ligação",
      email: "Email",
      meeting: "Reunião",
      follow_up: "Follow-up",
      proposal: "Proposta",
      other: "Outro",
    };
    return types[type || "other"] || "Outro";
  };

  const getDateLabel = (date: string) => {
    const dueDate = new Date(date);
    if (isToday(dueDate)) return "Hoje";
    if (isTomorrow(dueDate)) return "Amanhã";
    return format(dueDate, "dd/MM/yyyy", { locale: ptBR });
  };

  const isOverdue = task.status === "pending" && isPast(new Date(task.due_date));
  const isCompleted = task.status === "completed";

  return (
    <Card className={isOverdue ? "border-destructive" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onComplete}
            className="mt-1"
          />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium text-sm ${
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority || "medium"}
              </Badge>

              <Badge variant="outline" className="text-xs">
                {getTaskTypeLabel(task.task_type)}
              </Badge>

              {isCompleted && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Concluída
                </Badge>
              )}

              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Atrasada
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{getDateLabel(task.due_date)}</span>
              </div>

              {task.profiles && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={task.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {task.profiles.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.profiles.full_name}</span>
                </div>
              )}

              {task.contacts && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{task.contacts.name || task.contacts.phone_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
