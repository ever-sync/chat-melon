# Guia de Hooks do CRM

Este documento mostra como usar os hooks React criados para o sistema de CRM.

## Índice

1. [useDealNotes](#usedeal notes)
2. [useDealTasks](#usedealtasks)
3. [useDealFiles](#usedealfiles)
4. [useDealActivities](#usedealactivities)
5. [useLossReasons](#uselossreasons)
6. [useDealStats](#usedealstats)

---

## useDealNotes

Hook para gerenciar notas internas de um negócio.

### Importação

```typescript
import { useDealNotes } from "@/hooks/crm/useDealNotes";
```

### Uso Básico

```typescript
const MyComponent = ({ dealId }: { dealId: string }) => {
  const {
    notes,
    isLoading,
    createNote,
    updateNote,
    togglePin,
    deleteNote,
  } = useDealNotes(dealId);

  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    createNote.mutate({ note: newNote });
    setNewNote("");
  };

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {/* Formulário de adicionar nota */}
      <Textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Digite sua nota..."
      />
      <Button onClick={handleAddNote} disabled={createNote.isPending}>
        Adicionar Nota
      </Button>

      {/* Lista de notas */}
      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="p-3 border rounded">
            {/* Nota fixada aparece com destaque */}
            {note.is_pinned && <Pin className="w-4 h-4" />}

            <p>{note.note}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{note.profiles?.full_name}</span>
              <span>•</span>
              <span>{format(new Date(note.created_at), "dd/MM/yyyy HH:mm")}</span>
            </div>

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => togglePin.mutate({
                  noteId: note.id,
                  isPinned: !note.is_pinned
                })}
              >
                {note.is_pinned ? "Desafixar" : "Fixar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteNote.mutate(note.id)}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### API

**Retorno:**
- `notes: DealNote[]` - Array de notas
- `isLoading: boolean` - Estado de carregamento
- `createNote.mutate({ note: string })` - Criar nova nota
- `updateNote.mutate({ noteId: string, note: string })` - Atualizar nota
- `togglePin.mutate({ noteId: string, isPinned: boolean })` - Fixar/desafixar
- `deleteNote.mutate(noteId: string)` - Deletar nota

---

## useDealTasks

Hook para gerenciar tarefas vinculadas a um negócio.

### Importação

```typescript
import { useDealTasks } from "@/hooks/crm/useDealTasks";
```

### Uso Básico

```typescript
const TasksSection = ({ dealId }: { dealId: string }) => {
  const {
    tasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    isLoading,
    createTask,
    completeTask,
    reopenTask,
    deleteTask,
  } = useDealTasks(dealId);

  const handleCreateTask = () => {
    createTask.mutate({
      title: "Ligar para o cliente",
      description: "Confirmar interesse no produto",
      priority: "high",
      due_date: new Date().toISOString(),
      assigned_to: userId,
    });
  };

  return (
    <div>
      <h3>Tarefas Pendentes ({pendingTasks.length})</h3>
      {pendingTasks.map((task) => (
        <div key={task.id} className="flex items-start gap-2">
          <Checkbox
            checked={false}
            onCheckedChange={() => completeTask.mutate(task.id)}
          />
          <div className="flex-1">
            <p className="font-medium">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}

            {/* Badge de prioridade */}
            <Badge variant={
              task.priority === "urgent" ? "destructive" :
              task.priority === "high" ? "default" :
              "secondary"
            }>
              {task.priority}
            </Badge>

            {/* Data de vencimento */}
            {task.due_date && (
              <span className={cn(
                "text-sm",
                new Date(task.due_date) < new Date() && "text-red-600"
              )}>
                {format(new Date(task.due_date), "dd/MM/yyyy HH:mm")}
              </span>
            )}

            {/* Responsável */}
            {task.assigned_profile && (
              <div className="flex items-center gap-1">
                <Avatar src={task.assigned_profile.avatar_url} />
                <span>{task.assigned_profile.full_name}</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteTask.mutate(task.id)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Tarefas atrasadas */}
      {overdueTasks.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Você tem {overdueTasks.length} tarefa(s) atrasada(s)
          </AlertDescription>
        </Alert>
      )}

      {/* Tarefas concluídas (colapsável) */}
      <Collapsible>
        <CollapsibleTrigger>
          Tarefas Concluídas ({completedTasks.length})
        </CollapsibleTrigger>
        <CollapsibleContent>
          {completedTasks.map((task) => (
            <div key={task.id} className="opacity-60">
              <Checkbox checked={true} disabled />
              <span className="line-through">{task.title}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reopenTask.mutate(task.id)}
              >
                Reabrir
              </Button>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={handleCreateTask}>
        <Plus className="w-4 h-4 mr-2" />
        Nova Tarefa
      </Button>
    </div>
  );
};
```

### API

**Retorno:**
- `tasks: DealTask[]` - Todas as tarefas
- `pendingTasks: DealTask[]` - Tarefas pendentes/em progresso
- `completedTasks: DealTask[]` - Tarefas concluídas
- `overdueTasks: DealTask[]` - Tarefas atrasadas
- `isLoading: boolean`
- `createTask.mutate(input: CreateDealTaskInput)`
- `updateTask.mutate({ taskId: string, updates: UpdateDealTaskInput })`
- `completeTask.mutate(taskId: string)`
- `reopenTask.mutate(taskId: string)`
- `deleteTask.mutate(taskId: string)`

---

## useDealFiles

Hook para gerenciar arquivos anexados a um negócio.

### Importação

```typescript
import { useDealFiles } from "@/hooks/crm/useDealFiles";
```

### Uso Básico

```typescript
const FilesSection = ({ dealId }: { dealId: string }) => {
  const {
    files,
    imageFiles,
    documentFiles,
    isLoading,
    uploadFile,
    deleteFile,
    downloadFile,
    formatFileSize,
    getFileIcon,
  } = useDealFiles(dealId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadFile.mutate({
      file,
      description: "Proposta comercial",
      is_public: false,
    });
  };

  return (
    <div>
      {/* Upload de arquivo */}
      <div>
        <input
          type="file"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        {uploadFile.isPending && <Progress value={50} />}
      </div>

      {/* Grid de imagens */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {imageFiles.map((file) => (
            <div key={file.id} className="relative group">
              <img
                src={file.file_url}
                alt={file.file_name}
                className="w-full h-24 object-cover rounded"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={() => downloadFile(file)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteFile.mutate(file.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de documentos */}
      {documentFiles.length > 0 && (
        <div className="space-y-2">
          {documentFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 border rounded">
              <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
              <div className="flex-1">
                <p className="font-medium">{file.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.file_size)} • {file.uploader_profile?.full_name}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadFile(file)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteFile.mutate(file.id)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### API

**Retorno:**
- `files: DealFile[]` - Todos os arquivos
- `imageFiles: DealFile[]` - Apenas imagens
- `documentFiles: DealFile[]` - Documentos (PDF, Word, Excel, etc)
- `otherFiles: DealFile[]` - Outros tipos
- `isLoading: boolean`
- `uploadFile.mutate(input: UploadDealFileInput)`
- `updateFileDescription.mutate({ fileId: string, description: string })`
- `deleteFile.mutate(fileId: string)`
- `downloadFile(file: DealFile)` - Função assíncrona
- `formatFileSize(bytes: number)` - Formatar tamanho (ex: "2.5 MB")
- `getFileIcon(mimeType: string)` - Obter emoji do tipo

---

## useDealActivities

Hook para visualizar o histórico de atividades de um negócio.

### Importação

```typescript
import { useDealActivities } from "@/hooks/crm/useDealActivities";
```

### Uso Básico

```typescript
const ActivityTimeline = ({ dealId }: { dealId: string }) => {
  const {
    activities,
    groupedActivities,
    recentActivities,
    isLoading,
    addActivity,
    getActivityIcon,
    getActivityColor,
    formatActivityDescription,
  } = useDealActivities(dealId);

  const handleAddCustomActivity = () => {
    addActivity.mutate({
      activity_type: "call_made",
      description: "Ligação realizada - Cliente interessado no produto X",
      metadata: { duration: 15, outcome: "positive" },
    });
  };

  return (
    <div>
      {/* Timeline agrupada por data */}
      {Object.entries(groupedActivities).map(([date, activities]) => (
        <div key={date}>
          <h4 className="font-semibold">{date}</h4>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getActivityColor(activity.activity_type)
                )}>
                  <span>{getActivityIcon(activity.activity_type)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {formatActivityDescription(activity)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {activity.profile && (
                      <>
                        <span>{activity.profile.full_name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {format(new Date(activity.created_at), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Badge de atividades recentes */}
      {recentActivities.length > 0 && (
        <Badge>
          {recentActivities.length} atividade(s) nas últimas 24h
        </Badge>
      )}

      {/* Botão para adicionar atividade customizada */}
      <Button onClick={handleAddCustomActivity}>
        Registrar Atividade
      </Button>
    </div>
  );
};
```

### API

**Retorno:**
- `activities: DealActivity[]` - Todas as atividades
- `groupedActivities: Record<string, DealActivity[]>` - Agrupadas por data
- `recentActivities: DealActivity[]` - Últimas 24 horas
- `isLoading: boolean`
- `addActivity.mutate(input: CreateActivityInput)` - Adicionar manualmente
- `getActivityIcon(type: DealActivityType)` - Obter emoji
- `getActivityColor(type: DealActivityType)` - Obter classe CSS de cor
- `formatActivityDescription(activity: DealActivity)` - Formatar descrição

**Tipos de atividade:**
- `created`, `updated`, `stage_change`
- `note_added`, `task_created`, `task_completed`
- `file_uploaded`, `contact_linked`
- `email_sent`, `call_made`, `meeting_scheduled`
- `custom`

---

## useLossReasons

Hook para obter motivos predefinidos de perda de negócio.

### Importação

```typescript
import { useLossReasons } from "@/hooks/crm/useLossReasons";
```

### Uso Básico

```typescript
const LossReasonSelector = () => {
  const {
    lossReasons,
    groupedByCategory,
    categoryLabels,
    isLoading,
  } = useLossReasons();

  const [selectedReason, setSelectedReason] = useState("");

  return (
    <div>
      <Select value={selectedReason} onValueChange={setSelectedReason}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o motivo" />
        </SelectTrigger>
        <SelectContent>
          {/* Agrupado por categoria */}
          {Object.entries(groupedByCategory).map(([category, reasons]) => (
            <SelectGroup key={category}>
              <SelectLabel>{categoryLabels[category]}</SelectLabel>
              {reasons.map((reason) => (
                <SelectItem key={reason.id} value={reason.reason}>
                  {reason.reason}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {/* Ou como lista simples */}
      {lossReasons.map((reason) => (
        <Button
          key={reason.id}
          variant={selectedReason === reason.reason ? "default" : "outline"}
          onClick={() => setSelectedReason(reason.reason)}
        >
          {reason.reason}
        </Button>
      ))}
    </div>
  );
};
```

### API

**Retorno:**
- `lossReasons: LossReason[]` - Lista completa
- `groupedByCategory: Record<string, LossReason[]>` - Agrupados
- `categoryLabels: Record<string, string>` - Traduções das categorias
- `isLoading: boolean`

---

## useDealStats

Hook para obter estatísticas e métricas do pipeline.

### Importação

```typescript
import { useDealStats } from "@/hooks/crm/useDealStats";
```

### Uso Básico

```typescript
const PipelineAnalytics = ({ pipelineId }: { pipelineId: string }) => {
  const {
    stageStats,
    pipelineStats,
    funnelAnalysis,
    isLoading,
    formatCurrency,
    formatPercentage,
  } = useDealStats(pipelineId);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {/* Cards de métricas gerais */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Negócios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {pipelineStats?.total_deals}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(pipelineStats?.total_value || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatPercentage(pipelineStats?.conversion_rate || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio de Fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {pipelineStats?.average_time_to_close || 0} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise de funil */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Funil</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelAnalysis?.map((stage) => (
            <div key={stage.stage_id} className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{stage.stage_name}</span>
                <div className="flex items-center gap-2">
                  <Badge>{stage.deal_count} deals</Badge>
                  <span className="text-sm text-green-600 font-bold">
                    {formatCurrency(stage.total_value)}
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <Progress value={stage.percentage} />

              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatPercentage(stage.percentage)} do total</span>
                <span>
                  {formatPercentage(stage.conversion_from_previous)} de conversão
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Estatísticas por stage */}
      <div className="grid grid-cols-3 gap-4">
        {stageStats.map((stat) => (
          <Card key={stat.stage_id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stat.color || "#ccc" }}
                />
                <CardTitle className="text-sm">{stat.stage_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.deal_count}</p>
              <p className="text-sm text-green-600 font-medium">
                {formatCurrency(stat.total_value)}
              </p>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(stat.average_value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### API

**Retorno:**
- `stageStats: DealStageStats[]` - Estatísticas por stage
- `pipelineStats: PipelineStats | null` - Estatísticas gerais
- `funnelAnalysis` - Análise de funil com conversões
- `isLoading: boolean`
- `formatCurrency(value: number): string`
- `formatPercentage(value: number): string`

---

## Combinando Múltiplos Hooks

Exemplo completo de um componente que usa vários hooks:

```typescript
const DealDetailPanel = ({ dealId }: { dealId: string }) => {
  const { notes, createNote } = useDealNotes(dealId);
  const { tasks, pendingTasks, createTask } = useDealTasks(dealId);
  const { files, uploadFile } = useDealFiles(dealId);
  const { activities } = useDealActivities(dealId);

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="notes">
          Notas ({notes.length})
        </TabsTrigger>
        <TabsTrigger value="tasks">
          Tarefas ({pendingTasks.length})
        </TabsTrigger>
        <TabsTrigger value="files">
          Arquivos ({files.length})
        </TabsTrigger>
        <TabsTrigger value="activity">
          Atividades ({activities.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        {/* Informações principais do deal */}
      </TabsContent>

      <TabsContent value="notes">
        {/* Componente de notas usando useDealNotes */}
      </TabsContent>

      <TabsContent value="tasks">
        {/* Componente de tarefas usando useDealTasks */}
      </TabsContent>

      <TabsContent value="files">
        {/* Componente de arquivos usando useDealFiles */}
      </TabsContent>

      <TabsContent value="activity">
        {/* Timeline usando useDealActivities */}
      </TabsContent>
    </Tabs>
  );
};
```

---

## Dicas de Performance

### 1. Invalidação de Cache

Os hooks invalidam automaticamente as queries relacionadas após mutações:

```typescript
// Após criar uma nota, invalida:
// - ["deal-notes", dealId]
// - ["deal-activities", dealId]

// Após criar uma tarefa, invalida:
// - ["deal-tasks", dealId]
// - ["deal-activities", dealId]
```

### 2. Stale Time

Cada hook tem um `staleTime` configurado:

- `useDealNotes`: 30 segundos
- `useDealTasks`: 30 segundos
- `useDealFiles`: 1 minuto
- `useDealActivities`: 30 segundos
- `useLossReasons`: 5 minutos
- `useDealStats`: 1 minuto

### 3. Enabled Queries

As queries só executam quando `dealId` está disponível:

```typescript
enabled: !!dealId
```

### 4. Real-time (Opcional)

Para sincronizar em tempo real, adicione subscriptions do Supabase:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`deal:${dealId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deal_notes",
        filter: `deal_id=eq.${dealId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["deal-notes", dealId] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [dealId]);
```

---

## Conclusão

Todos os hooks estão prontos para uso! Eles seguem as melhores práticas:

- ✅ TypeScript com tipos fortes
- ✅ React Query para cache e sincronização
- ✅ Toasts automáticos de feedback
- ✅ Invalidação inteligente de cache
- ✅ Funções auxiliares úteis
- ✅ RLS do Supabase respeitado

Próximos passos: Implementar os componentes UI que consomem esses hooks!
