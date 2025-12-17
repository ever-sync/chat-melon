import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityReport } from "@/hooks/useActivityReport";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { MessageSquare, Phone, Calendar, FileText, CheckSquare, Download } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const activityIcons = {
  message: MessageSquare,
  call: Phone,
  meeting: Calendar,
  proposal: FileText,
  task: CheckSquare,
};

export const ActivityReport = () => {
  const [period, setPeriod] = useState("month");
  const [userId, setUserId] = useState<string | undefined>();
  const [activityType, setActivityType] = useState<string | undefined>();

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "today":
        return { startDate: now, endDate: now };
      case "yesterday": {
        const yesterday = subDays(now, 1);
        return { startDate: yesterday, endDate: yesterday };
      }
      case "week":
        return { startDate: subDays(now, 7), endDate: now };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();
  const { summary, byDay, byUser, detailedActivities, isLoading } = useActivityReport({
    ...dateRange,
    userId,
    activityType,
  });

  const exportToCSV = () => {
    if (!detailedActivities.length) return;

    const headers = ["Data/Hora", "Vendedor", "Tipo", "Descrição"];
    const rows = detailedActivities.map(activity => [
      format(new Date(activity.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      activity.userName,
      activity.type,
      activity.description,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `atividades_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userId || "all"} onValueChange={v => setUserId(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {byUser.map(user => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activityType || "all"} onValueChange={v => setActivityType(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="message">Mensagens</SelectItem>
                <SelectItem value="call">Ligações</SelectItem>
                <SelectItem value="meeting">Reuniões</SelectItem>
                <SelectItem value="proposal">Propostas</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Mensagens</p>
                <p className="text-2xl font-bold">{summary?.messages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ligações</p>
                <p className="text-2xl font-bold">{summary?.calls || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reuniões</p>
                <p className="text-2xl font-bold">{summary?.meetings || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Propostas</p>
                <p className="text-2xl font-bold">{summary?.proposals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-teal-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tarefas</p>
                <p className="text-2xl font-bold">{summary?.tasks || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities by Day Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              messages: { label: "Mensagens", color: "hsl(var(--chart-1))" },
              calls: { label: "Ligações", color: "hsl(var(--chart-2))" },
              meetings: { label: "Reuniões", color: "hsl(var(--chart-3))" },
              proposals: { label: "Propostas", color: "hsl(var(--chart-4))" },
              tasks: { label: "Tarefas", color: "hsl(var(--chart-5))" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), "dd/MM")} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" stackId="a" fill="hsl(var(--chart-1))" name="Mensagens" />
                <Bar dataKey="calls" stackId="a" fill="hsl(var(--chart-2))" name="Ligações" />
                <Bar dataKey="meetings" stackId="a" fill="hsl(var(--chart-3))" name="Reuniões" />
                <Bar dataKey="proposals" stackId="a" fill="hsl(var(--chart-4))" name="Propostas" />
                <Bar dataKey="tasks" stackId="a" fill="hsl(var(--chart-5))" name="Tarefas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Activities by User Table */}
      <Card>
        <CardHeader>
          <CardTitle>Por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">Mensagens</TableHead>
                <TableHead className="text-center">Ligações</TableHead>
                <TableHead className="text-center">Reuniões</TableHead>
                <TableHead className="text-center">Propostas</TableHead>
                <TableHead className="text-center">Tarefas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byUser.map(user => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell className="text-center">{user.messages}</TableCell>
                  <TableCell className="text-center">{user.calls}</TableCell>
                  <TableCell className="text-center">{user.meetings}</TableCell>
                  <TableCell className="text-center">{user.proposals}</TableCell>
                  <TableCell className="text-center">{user.tasks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Activity Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Log Detalhado</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {detailedActivities.slice(0, 50).map(activity => {
              const Icon = activityIcons[activity.type as keyof typeof activityIcons] || MessageSquare;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent">
                  <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{format(new Date(activity.timestamp), "HH:mm", { locale: ptBR })}</span>
                      {" "}
                      <span className="text-muted-foreground">{activity.userName}</span>
                      {" - "}
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
