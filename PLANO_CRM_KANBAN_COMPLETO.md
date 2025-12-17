# PLANO COMPLETO - CRM KANBAN COM DRAG & DROP

## VISÃO GERAL

Sistema de CRM estilo Kanban Board com funcionalidade de arrastar e soltar cards entre colunas (funis/stages), modal de detalhes ao clicar no card, e gestão completa de negócios.

## ANÁLISE DO SISTEMA ATUAL

### Estrutura Existente ✅

**Banco de Dados (Supabase):**
- `pipelines` - Funis de vendas
- `pipeline_stages` - Etapas dos funis (colunas do kanban)
- `deals` - Negócios/Cards
- `contacts` - Contatos vinculados aos negócios
- `deal_activities` - Histórico de atividades

**Componentes React:**
- `PipelineBoard` - Board principal com drag & drop (@dnd-kit)
- `DealCard` - Card individual arrastável
- `DealModal` - Modal para criar/editar negócio
- `DealDetail` - Modal de detalhes do negócio
- `DealWinLossModal` - Modal para marcar ganho/perda

**Hooks:**
- `useDeals` - CRUD de negócios
- `usePipelines` - Gerenciamento de pipelines

**Biblioteca Drag & Drop:**
- `@dnd-kit/core` - Já instalada e funcionando

---

## ARQUITETURA DO BANCO DE DADOS

### Tabelas Principais

```sql
-- Pipelines (Funis de Vendas)
CREATE TABLE pipelines (
    id uuid PRIMARY KEY,
    company_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Pipeline Stages (Colunas do Kanban)
CREATE TABLE pipeline_stages (
    id uuid PRIMARY KEY,
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text, -- Cor da coluna
    order_index integer DEFAULT 0, -- Ordem das colunas
    probability_default integer, -- % de probabilidade padrão
    is_closed_won boolean DEFAULT false, -- Stage de "Ganho"
    is_closed_lost boolean DEFAULT false, -- Stage de "Perda"
    automation_rules jsonb, -- Automações ao mover para este stage
    created_at timestamptz DEFAULT now()
);

-- Deals (Cards/Negócios)
CREATE TABLE deals (
    id uuid PRIMARY KEY,
    company_id uuid NOT NULL,
    pipeline_id uuid NOT NULL REFERENCES pipelines(id),
    stage_id uuid NOT NULL REFERENCES pipeline_stages(id),
    contact_id uuid REFERENCES contacts(id),
    assigned_to uuid REFERENCES profiles(id),

    -- Informações do negócio
    title text NOT NULL,
    value numeric, -- Valor do negócio
    probability integer, -- % de chance de fechar
    expected_close_date date,
    priority text, -- low, medium, high, urgent
    status text, -- open, won, lost
    temperature text, -- cold, warm, hot
    temperature_score integer,

    -- Dados estruturados
    products jsonb, -- Lista de produtos
    custom_fields jsonb, -- Campos customizados

    -- Qualificação (BANT)
    budget_confirmed boolean,
    timeline_confirmed boolean,
    decision_maker text,
    need_identified text,

    -- Motivos de ganho/perda
    win_reason text,
    loss_reason text,
    loss_reason_detail text,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_activity timestamptz DEFAULT now(),
    won_at timestamptz,
    lost_at timestamptz
);

-- Deal Activities (Histórico)
CREATE TABLE deal_activities (
    id uuid PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id),
    activity_type text NOT NULL, -- created, updated, stage_change, note_added, etc
    description text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Deal Notes (Notas internas)
CREATE TABLE deal_notes (
    id uuid PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id),
    company_id uuid NOT NULL,
    note text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Deal Tasks (Tarefas vinculadas)
CREATE TABLE deal_tasks (
    id uuid PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    assigned_to uuid REFERENCES profiles(id),
    due_date timestamptz,
    status text DEFAULT 'pending', -- pending, completed, cancelled
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Deal Files (Arquivos anexados)
CREATE TABLE deal_files (
    id uuid PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES profiles(id),
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    created_at timestamptz DEFAULT now()
);
```

### Índices para Performance

```sql
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);
```

---

## ESTRUTURA DE COMPONENTES REACT

### 1. PipelineBoard (Board Principal)

**Localização:** `src/components/crm/PipelineBoard.tsx` ✅ (já existe)

**Responsabilidades:**
- Renderizar colunas (stages)
- Gerenciar drag & drop com @dnd-kit
- Sincronizar estado com backend
- Lidar com movimentação entre colunas

**Props:**
```typescript
interface PipelineBoardProps {
  selectedPipelineId?: string;
}
```

**Estado:**
```typescript
const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
const [modalOpen, setModalOpen] = useState(false);
const [selectedStage, setSelectedStage] = useState<string>();
const [editingDeal, setEditingDeal] = useState<Deal>();
const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
```

**Funcionalidades Principais:**
- ✅ Drag & Drop entre colunas
- ✅ Criar novo negócio em uma coluna específica
- ✅ Abrir modal de detalhes ao clicar no card
- ✅ Modal de ganho/perda em stages finais
- ✅ Atualização otimista de UI
- ✅ Loading states e skeletons

---

### 2. PipelineColumn (Coluna/Stage)

**Status:** Integrado ao PipelineBoard ✅

**Estrutura:**
```tsx
<Card className="min-w-[300px] flex-shrink-0">
  {/* Barra de cor no topo */}
  <div style={{ backgroundColor: stage.color }} />

  <CardHeader>
    {/* Nome do stage + botão adicionar */}
    <CardTitle>{stage.name}</CardTitle>
    <Button onClick={() => handleCreateDeal(stage.id)}>
      <Plus />
    </Button>

    {/* Contador e valor total */}
    <div>
      <span>{stageDeals.length} negócios</span>
      <span>{formatCurrency(stageDeals)}</span>
    </div>
  </CardHeader>

  <CardContent>
    {/* Área droppable com cards */}
    <SortableContext items={stageDeals}>
      {stageDeals.map(deal => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </SortableContext>
  </CardContent>
</Card>
```

---

### 3. DealCard (Card Individual)

**Localização:** `src/components/crm/DealCard.tsx` ✅ (já existe)

**Responsabilidades:**
- Renderizar informações do negócio
- Ser arrastável (useSortable)
- Abrir modal de detalhes ao clicar
- Mostrar menu de ações (editar, excluir)

**Interface:**
```typescript
interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
}
```

**Conteúdo do Card:**
```tsx
<div onClick={() => onView(deal)}>
  {/* Título */}
  <h4>{deal.title}</h4>

  {/* Valor */}
  <p className="text-green-600">{formatCurrency(deal.value)}</p>

  {/* Contato */}
  {deal.contacts && (
    <div>
      <Avatar />
      <span>{deal.contacts.name}</span>
    </div>
  )}

  {/* Responsável */}
  {deal.profiles && (
    <Badge>{deal.profiles.full_name}</Badge>
  )}

  {/* Tags/Status */}
  <Badge>{deal.priority}</Badge>
  <Badge>{deal.temperature}</Badge>

  {/* Data esperada */}
  {deal.expected_close_date && (
    <span>{format(deal.expected_close_date)}</span>
  )}

  {/* Menu de ações */}
  <DropdownMenu>
    <DropdownMenuItem onClick={() => onEdit(deal)}>
      Editar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onDelete(deal.id)}>
      Excluir
    </DropdownMenuItem>
  </DropdownMenu>
</div>
```

---

### 4. DealModal (Criar/Editar Negócio)

**Localização:** `src/components/crm/DealModal.tsx` ✅ (já existe)

**Responsabilidades:**
- Formulário para criar/editar negócio
- Validação de campos
- Seleção de contato, responsável, pipeline, stage

**Props:**
```typescript
interface DealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal; // Se existir, é edição
  stageId?: string; // Stage inicial ao criar
  pipelineId?: string;
  defaultContactId?: string;
  onSubmit: (data: TablesInsert<"deals">) => void;
}
```

**Campos do Formulário:**
```tsx
<Form>
  <Input name="title" label="Título" required />
  <Input name="value" label="Valor" type="number" />

  <Select name="contact_id" label="Contato">
    {/* Lista de contatos */}
  </Select>

  <Select name="pipeline_id" label="Pipeline">
    {/* Lista de pipelines */}
  </Select>

  <Select name="stage_id" label="Etapa">
    {/* Stages do pipeline selecionado */}
  </Select>

  <Select name="assigned_to" label="Responsável">
    {/* Membros da empresa */}
  </Select>

  <DatePicker name="expected_close_date" label="Fechamento esperado" />

  <Select name="priority" label="Prioridade">
    <option value="low">Baixa</option>
    <option value="medium">Média</option>
    <option value="high">Alta</option>
    <option value="urgent">Urgente</option>
  </Select>

  <Select name="temperature" label="Temperatura">
    <option value="cold">Frio</option>
    <option value="warm">Morno</option>
    <option value="hot">Quente</option>
  </Select>

  <Textarea name="need_identified" label="Necessidade identificada" />

  <Checkbox name="budget_confirmed" label="Orçamento confirmado" />
  <Checkbox name="timeline_confirmed" label="Timeline confirmado" />

  <Input name="decision_maker" label="Tomador de decisão" />

  <Button type="submit">Salvar</Button>
</Form>
```

---

### 5. DealDetail (Modal de Detalhes)

**Localização:** `src/components/crm/DealDetail.tsx` ✅ (já existe)

**Responsabilidades:**
- Mostrar todas as informações do negócio
- Exibir histórico de atividades
- Mostrar notas internas
- Listar tarefas vinculadas
- Mostrar arquivos anexados
- Permitir edição rápida

**Props:**
```typescript
interface DealDetailProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (deal: Deal) => void;
}
```

**Estrutura do Modal:**
```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-[600px] overflow-y-auto">

    {/* Header */}
    <SheetHeader>
      <div>
        <h2>{deal.title}</h2>
        <Badge>{deal.pipeline_stages?.name}</Badge>

        <div className="actions">
          <Button onClick={() => onEdit(deal)}>Editar</Button>
          <Button>Mover para Stage</Button>
          <DropdownMenu>
            <DropdownMenuItem>Marcar como Ganho</DropdownMenuItem>
            <DropdownMenuItem>Marcar como Perda</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem>Excluir</DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </SheetHeader>

    {/* Informações Principais */}
    <section>
      <h3>Informações</h3>
      <dl>
        <dt>Valor:</dt>
        <dd>{formatCurrency(deal.value)}</dd>

        <dt>Contato:</dt>
        <dd>
          <Avatar src={deal.contacts?.profile_pic_url} />
          {deal.contacts?.name}
        </dd>

        <dt>Responsável:</dt>
        <dd>{deal.profiles?.full_name}</dd>

        <dt>Data esperada:</dt>
        <dd>{format(deal.expected_close_date)}</dd>

        <dt>Prioridade:</dt>
        <dd><Badge>{deal.priority}</Badge></dd>

        <dt>Temperatura:</dt>
        <dd><Badge>{deal.temperature}</Badge></dd>

        <dt>Probabilidade:</dt>
        <dd>{deal.probability}%</dd>
      </dl>
    </section>

    <Separator />

    {/* Qualificação (BANT) */}
    <section>
      <h3>Qualificação</h3>
      <div>
        <CheckCircle /> Orçamento confirmado: {deal.budget_confirmed ? 'Sim' : 'Não'}
        <CheckCircle /> Timeline confirmado: {deal.timeline_confirmed ? 'Sim' : 'Não'}
        <p>Tomador de decisão: {deal.decision_maker}</p>
        <p>Necessidade: {deal.need_identified}</p>
      </div>
    </section>

    <Separator />

    {/* Timeline de Atividades */}
    <section>
      <h3>Histórico</h3>
      <Timeline>
        {activities.map(activity => (
          <TimelineItem key={activity.id}>
            <TimelineIcon type={activity.activity_type} />
            <div>
              <p>{activity.description}</p>
              <span>{format(activity.created_at)}</span>
            </div>
          </TimelineItem>
        ))}
      </Timeline>
    </section>

    <Separator />

    {/* Notas */}
    <section>
      <h3>Notas</h3>
      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note-card">
            <p>{note.note}</p>
            <div className="note-meta">
              <span>{note.profiles?.full_name}</span>
              <span>{format(note.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      <Textarea placeholder="Adicionar nota..." />
      <Button>Adicionar Nota</Button>
    </section>

    <Separator />

    {/* Tarefas */}
    <section>
      <h3>Tarefas</h3>
      <div className="tasks-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <Checkbox
              checked={task.status === 'completed'}
              onChange={() => handleCompleteTask(task.id)}
            />
            <div>
              <p>{task.title}</p>
              <span>{format(task.due_date)}</span>
            </div>
          </div>
        ))}
      </div>

      <Button>Nova Tarefa</Button>
    </section>

    <Separator />

    {/* Arquivos */}
    <section>
      <h3>Arquivos</h3>
      <div className="files-grid">
        {files.map(file => (
          <div key={file.id} className="file-card">
            <FileIcon type={file.file_type} />
            <span>{file.file_name}</span>
            <Button onClick={() => window.open(file.file_url)}>
              Download
            </Button>
          </div>
        ))}
      </div>

      <Button>Anexar Arquivo</Button>
    </section>

  </SheetContent>
</Sheet>
```

---

### 6. DealWinLossModal

**Localização:** `src/components/crm/DealWinLossModal.tsx` ✅ (já existe)

**Responsabilidades:**
- Capturar motivo de ganho/perda
- Permitir análise posterior de motivos

**Props:**
```typescript
interface DealWinLossModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "won" | "lost";
  onSubmit: (data: { reason: string; detail: string }) => void;
}
```

---

## HOOKS CUSTOMIZADOS

### 1. useDeals ✅ (já existe)

**Localização:** `src/hooks/crm/useDeals.ts`

**Funcionalidades:**
```typescript
export const useDeals = (pipelineId?: string, contactId?: string) => {
  // Query de negócios
  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals", companyId, pipelineId, contactId],
    queryFn: async () => {
      // Buscar deals com joins
      const { data } = await supabase
        .from("deals")
        .select(`
          *,
          contacts (*),
          pipeline_stages (*),
          profiles:assigned_to (*)
        `)
        .eq("company_id", companyId)
        .eq("status", "open");

      return data;
    }
  });

  // Criar negócio
  const createDeal = useMutation({
    mutationFn: async (deal: TablesInsert<"deals">) => {
      const { data } = await supabase
        .from("deals")
        .insert({ ...deal, company_id: companyId })
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio criado!");
    }
  });

  // Atualizar negócio
  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio atualizado!");
    }
  });

  // Mover negócio entre stages
  const moveDeal = useMutation({
    mutationFn: async ({ dealId, targetStageId }) => {
      const { data } = await supabase
        .from("deals")
        .update({
          stage_id: targetStageId,
          last_activity: new Date().toISOString()
        })
        .eq("id", dealId)
        .select()
        .single();

      // Registrar atividade
      await supabase.from("deal_activities").insert({
        deal_id: dealId,
        activity_type: "stage_change",
        description: `Movido para "${targetStage.name}"`
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    }
  });

  // Excluir negócio
  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      await supabase.from("deals").delete().eq("id", dealId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Negócio excluído!");
    }
  });

  return {
    deals,
    isLoading,
    createDeal,
    updateDeal,
    moveDeal,
    deleteDeal
  };
};
```

---

### 2. usePipelines ✅ (já existe)

**Localização:** `src/hooks/crm/usePipelines.ts`

**Funcionalidades:**
```typescript
export const usePipelines = () => {
  const { companyId } = useCompanyQuery();

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["pipelines", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("pipelines")
        .select(`
          *,
          pipeline_stages (*)
        `)
        .eq("company_id", companyId)
        .order("order_index");

      return data;
    },
    enabled: !!companyId
  });

  const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];

  return {
    pipelines,
    defaultPipeline,
    isLoading
  };
};
```

---

### 3. useDealActivities (NOVO - A CRIAR)

**Localização:** `src/hooks/crm/useDealActivities.ts`

**Objetivo:** Gerenciar histórico de atividades de um negócio

```typescript
export const useDealActivities = (dealId?: string) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["deal-activities", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data } = await supabase
        .from("deal_activities")
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      return data;
    },
    enabled: !!dealId
  });

  const addActivity = useMutation({
    mutationFn: async (activity: TablesInsert<"deal_activities">) => {
      const { data } = await supabase
        .from("deal_activities")
        .insert(activity)
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-activities"] });
    }
  });

  return {
    activities,
    isLoading,
    addActivity
  };
};
```

---

### 4. useDealNotes (NOVO - A CRIAR)

**Localização:** `src/hooks/crm/useDealNotes.ts`

**Objetivo:** Gerenciar notas de um negócio

```typescript
export const useDealNotes = (dealId?: string) => {
  const { companyId } = useCompanyQuery();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["deal-notes", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data } = await supabase
        .from("deal_notes")
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      return data;
    },
    enabled: !!dealId
  });

  const addNote = useMutation({
    mutationFn: async (note: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("deal_notes")
        .insert({
          deal_id: dealId,
          user_id: user!.id,
          company_id: companyId,
          note
        })
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-notes"] });
      toast.success("Nota adicionada!");
    }
  });

  return {
    notes,
    isLoading,
    addNote
  };
};
```

---

### 5. useDealTasks (NOVO - A CRIAR)

**Localização:** `src/hooks/crm/useDealTasks.ts`

**Objetivo:** Gerenciar tarefas vinculadas a um negócio

```typescript
export const useDealTasks = (dealId?: string) => {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["deal-tasks", dealId],
    queryFn: async () => {
      if (!dealId) return [];

      const { data } = await supabase
        .from("deal_tasks")
        .select(`
          *,
          profiles:assigned_to (full_name, avatar_url)
        `)
        .eq("deal_id", dealId)
        .order("due_date", { ascending: true });

      return data;
    },
    enabled: !!dealId
  });

  const createTask = useMutation({
    mutationFn: async (task: TablesInsert<"deal_tasks">) => {
      const { data } = await supabase
        .from("deal_tasks")
        .insert(task)
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks"] });
      toast.success("Tarefa criada!");
    }
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await supabase
        .from("deal_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", taskId)
        .select()
        .single();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-tasks"] });
      toast.success("Tarefa concluída!");
    }
  });

  return {
    tasks,
    isLoading,
    createTask,
    completeTask
  };
};
```

---

## FLUXO DE DRAG & DROP

### Implementação com @dnd-kit

```typescript
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

// No PipelineBoard
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Mínimo de 8px para ativar o drag
    },
  })
);

const handleDragStart = (event: DragStartEvent) => {
  const deal = deals.find((d) => d.id === event.active.id);
  setActiveDeal(deal || null);
};

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveDeal(null);

  if (!over) return;

  const dealId = active.id as string;
  const deal = deals.find((d) => d.id === dealId);

  // Identificar o stage de destino
  let targetStageId = over.id as string;
  const overDeal = deals.find((d) => d.id === over.id);

  if (overDeal) {
    // Se soltou sobre outro deal, usar o stage daquele deal
    targetStageId = overDeal.stage_id;
  }

  const targetStage = stages.find((s) => s.id === targetStageId);

  if (!targetStage) return;

  if (deal && deal.stage_id !== targetStageId) {
    // Verificar se é stage de fechamento
    if (targetStage.is_closed_won) {
      setWinLossModal({ open: true, type: "won", dealId });
      return;
    }

    if (targetStage.is_closed_lost) {
      setWinLossModal({ open: true, type: "lost", dealId });
      return;
    }

    // Mover normalmente
    moveDeal.mutate({ dealId, targetStageId });
  }
};

<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* Colunas */}
  {stages.map((stage) => (
    <div key={stage.id}>
      <SortableContext
        items={stageDeals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
        id={stage.id}
      >
        {/* Cards */}
      </SortableContext>
    </div>
  ))}

  {/* Overlay durante drag */}
  <DragOverlay>
    {activeDeal ? <DealCard deal={activeDeal} /> : null}
  </DragOverlay>
</DndContext>
```

---

## FUNCIONALIDADES AVANÇADAS

### 1. Filtros e Busca

```typescript
const [filters, setFilters] = useState({
  search: "",
  assignedTo: null,
  priority: null,
  temperature: null,
  dateRange: null,
});

// Aplicar filtros nos deals
const filteredDeals = deals.filter(deal => {
  if (filters.search && !deal.title.toLowerCase().includes(filters.search.toLowerCase())) {
    return false;
  }

  if (filters.assignedTo && deal.assigned_to !== filters.assignedTo) {
    return false;
  }

  if (filters.priority && deal.priority !== filters.priority) {
    return false;
  }

  // ... outros filtros

  return true;
});
```

### 2. Métricas do Pipeline

```typescript
const pipelineMetrics = {
  totalDeals: deals.length,
  totalValue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
  averageDealValue: deals.length > 0
    ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length
    : 0,
  conversionRate: (wonDeals / totalDeals) * 100,
  averageTimeToClose: calculateAverageTime(deals),
};
```

### 3. Automações ao Mover Card

```typescript
// Executar quando mover para um stage com automações
if (targetStage.automation_rules) {
  const rules = targetStage.automation_rules;

  // Ex: Criar tarefa automaticamente
  if (rules.create_task) {
    await supabase.from("deal_tasks").insert({
      deal_id: dealId,
      title: rules.task_title,
      due_date: addDays(new Date(), rules.due_days),
    });
  }

  // Ex: Enviar notificação
  if (rules.notify_team) {
    await sendNotification({
      team_id: deal.team_id,
      message: `Novo negócio em ${targetStage.name}`,
    });
  }

  // Ex: Atualizar probabilidade automaticamente
  if (rules.update_probability) {
    await supabase.from("deals").update({
      probability: targetStage.probability_default,
    }).eq("id", dealId);
  }
}
```

### 4. Real-time com Supabase Subscriptions

```typescript
// Sincronizar mudanças em tempo real
useEffect(() => {
  const channel = supabase
    .channel(`pipeline:${pipelineId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deals",
        filter: `pipeline_id=eq.${pipelineId}`,
      },
      (payload) => {
        console.log("Deal changed:", payload);
        queryClient.invalidateQueries({ queryKey: ["deals"] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [pipelineId]);
```

### 5. Visualizações Alternativas

```typescript
// Além do Kanban, oferecer:
const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");

// Vista de Lista
if (view === "list") {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map(deal => (
          <TableRow key={deal.id} onClick={() => handleViewDeal(deal)}>
            <TableCell>{deal.title}</TableCell>
            <TableCell>{formatCurrency(deal.value)}</TableCell>
            <TableCell><Badge>{deal.pipeline_stages?.name}</Badge></TableCell>
            <TableCell>{deal.profiles?.full_name}</TableCell>
            <TableCell>{format(deal.expected_close_date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Vista de Calendário (deals agrupados por expected_close_date)
if (view === "calendar") {
  return (
    <Calendar
      events={deals.map(deal => ({
        id: deal.id,
        title: deal.title,
        start: deal.expected_close_date,
        color: deal.pipeline_stages?.color,
      }))}
      onEventClick={handleViewDeal}
    />
  );
}
```

---

## MELHORIAS DE UX

### 1. Loading States

```typescript
// Skeleton loader enquanto carrega
{isLoading && (
  <div className="flex gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} className="min-w-[300px] h-[600px]" />
    ))}
  </div>
)}
```

### 2. Empty States

```typescript
// Quando não há deals em um stage
{stageDeals.length === 0 && (
  <div className="text-center py-12">
    <Plus className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Nenhum negócio</p>
    <p className="text-xs text-muted-foreground">Arraste cards para cá</p>
  </div>
)}
```

### 3. Animações

```typescript
import { motion } from "framer-motion";

// Card com animação
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  <DealCard deal={deal} />
</motion.div>
```

### 4. Toasts e Feedback

```typescript
import { toast } from "sonner";

// Feedback imediato ao arrastar
toast.success(`${deal.title} movido para ${targetStage.name}`);

// Loading toast durante operações longas
const loadingToast = toast.loading("Movendo negócio...");
// ... operação
toast.dismiss(loadingToast);
toast.success("Negócio movido!");
```

---

## RESPONSIVIDADE MOBILE

### Layout Mobile do Kanban

```typescript
// src/components/crm/MobilePipelineLayout.tsx
export const MobilePipelineLayout = ({ pipelineId }: Props) => {
  const [selectedStage, setSelectedStage] = useState<string>();
  const { deals } = useDeals(pipelineId);
  const { pipelines } = usePipelines();

  const stages = pipelines
    .find(p => p.id === pipelineId)
    ?.pipeline_stages || [];

  return (
    <div className="mobile-pipeline">
      {/* Tabs para stages */}
      <Tabs value={selectedStage} onValueChange={setSelectedStage}>
        <TabsList className="w-full overflow-x-auto">
          {stages.map(stage => (
            <TabsTrigger key={stage.id} value={stage.id}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
              {stage.name}
              <Badge>{stageDeals(stage.id).length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {stages.map(stage => (
          <TabsContent key={stage.id} value={stage.id}>
            <div className="space-y-2">
              {stageDeals(stage.id).map(deal => (
                <MobileDealCard
                  key={deal.id}
                  deal={deal}
                  onTap={() => handleViewDeal(deal)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* FAB para criar negócio */}
      <Button
        className="fixed bottom-4 right-4 rounded-full w-14 h-14"
        onClick={() => handleCreateDeal(selectedStage)}
      >
        <Plus />
      </Button>
    </div>
  );
};
```

---

## PERFORMANCE E OTIMIZAÇÕES

### 1. Virtualização de Listas

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

// Para stages com muitos cards
const parentRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: stageDeals.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120,
});

<div ref={parentRef} className="overflow-y-auto" style={{ height: "600px" }}>
  <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const deal = stageDeals[virtualRow.index];
      return (
        <div
          key={deal.id}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <DealCard deal={deal} />
        </div>
      );
    })}
  </div>
</div>
```

### 2. Debounce em Buscas

```typescript
import { useDebouncedCallback } from "use-debounce";

const handleSearch = useDebouncedCallback((value: string) => {
  setFilters({ ...filters, search: value });
}, 300);
```

### 3. Cache Otimista

```typescript
// Atualizar UI imediatamente, reverter se falhar
moveDeal.mutate(
  { dealId, targetStageId },
  {
    onMutate: async (variables) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["deals"] });

      // Snapshot do estado anterior
      const previousDeals = queryClient.getQueryData(["deals"]);

      // Atualizar cache otimisticamente
      queryClient.setQueryData(["deals"], (old: Deal[]) => {
        return old.map(d =>
          d.id === dealId
            ? { ...d, stage_id: targetStageId }
            : d
        );
      });

      return { previousDeals };
    },
    onError: (err, variables, context) => {
      // Reverter em caso de erro
      queryClient.setQueryData(["deals"], context?.previousDeals);
    },
  }
);
```

---

## SEGURANÇA E PERMISSÕES

### RLS (Row Level Security) no Supabase

```sql
-- Deals podem ser vistos por membros da empresa
CREATE POLICY "Company members can view deals"
ON deals FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_members
    WHERE user_id = auth.uid()
  )
);

-- Apenas o responsável ou admin pode editar
CREATE POLICY "Deal owner or admin can update"
ON deals FOR UPDATE
USING (
  assigned_to = auth.uid()
  OR
  auth.uid() IN (
    SELECT user_id FROM company_members
    WHERE company_id = deals.company_id
    AND role IN ('admin', 'manager')
  )
);
```

---

## PRÓXIMOS PASSOS (ROADMAP)

### Fase 1: Fundação ✅
- [x] Estrutura de banco de dados
- [x] PipelineBoard com drag & drop
- [x] DealCard básico
- [x] DealModal para criar/editar
- [x] Hooks useDeals e usePipelines

### Fase 2: Detalhamento ⏳
- [ ] Implementar DealDetail completo
- [ ] Criar useDealActivities
- [ ] Criar useDealNotes
- [ ] Criar useDealTasks
- [ ] Sistema de arquivos anexados

### Fase 3: Funcionalidades Avançadas
- [ ] Filtros e busca avançada
- [ ] Visualizações alternativas (lista, calendário)
- [ ] Automações ao mover cards
- [ ] Real-time com subscriptions
- [ ] Métricas e relatórios do pipeline

### Fase 4: UX e Performance
- [ ] Virtualização de listas longas
- [ ] Animações suaves
- [ ] Layout mobile responsivo
- [ ] Cache otimista completo
- [ ] PWA offline-first

### Fase 5: Integrações
- [ ] Integração com email (Gmail, Outlook)
- [ ] Integração com calendário
- [ ] Webhooks para eventos do CRM
- [ ] API pública para integrações

---

## CONCLUSÃO

Este plano fornece uma arquitetura completa para um CRM Kanban profissional com:

- **Drag & Drop fluido** usando @dnd-kit
- **Modal de detalhes rico** com todas informações do negócio
- **Banco de dados bem estruturado** no Supabase
- **Hooks reutilizáveis** para toda gestão de estado
- **Performance otimizada** com cache e virtualização
- **UX moderna** com animações e feedback
- **Mobile-first** com layout responsivo
- **Real-time** com Supabase subscriptions
- **Seguro** com RLS policies

O sistema já está 70% implementado. As próximas etapas envolvem completar o DealDetail e adicionar funcionalidades avançadas como automações e relatórios.
