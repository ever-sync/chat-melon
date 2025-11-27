import { MainLayout } from "@/components/MainLayout";
import { TaskList } from "@/components/tasks/TaskList";

export default function Tasks() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e acompanhamento de clientes
          </p>
        </div>

        <TaskList />
      </div>
    </MainLayout>
  );
}
