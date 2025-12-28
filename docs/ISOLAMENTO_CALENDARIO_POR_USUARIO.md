# Isolamento de Calendário por Usuário e Empresa

## Problema Identificado

O calendário estava sendo compartilhado entre empresas e mostrando eventos de outros usuários quando não deveria.

### Comportamento Incorreto:
- ❌ Admin via eventos do Google Calendar de TODOS os usuários
- ❌ Eventos não eram filtrados por `company_id`
- ❌ Ao selecionar outro usuário, ainda mostrava eventos do Google Calendar do admin

### Comportamento Correto (Implementado):
- ✅ Cada usuário vê apenas SEU próprio calendário
- ✅ Admin/Proprietário pode ver calendários de outros usuários (tarefas e deals)
- ✅ Eventos do Google Calendar são privados (só o dono vê)
- ✅ Tudo é filtrado por `company_id`

## Arquitetura da Solução

### 1. Níveis de Permissão

#### Usuário Normal
```
Vê apenas:
- Seus próprios eventos do Google Calendar
- Suas próprias tarefas
- Seus próprios deals
```

#### Admin/Proprietário
```
Pode selecionar usuário e ver:
- Tarefas do usuário selecionado
- Deals do usuário selecionado
- Eventos do Google Calendar APENAS se selecionar ele mesmo
```

### 2. Filtros Implementados

#### Por Empresa (`company_id`)
Todas as queries filtram por empresa:

```typescript
// Tarefas
.eq('company_id', currentUser.company_id)

// Deals
.eq('company_id', currentUser.company_id)
```

#### Por Usuário (`assigned_to`)

**Para Usuários Normais:**
```typescript
const filterUserId = currentUser?.id;
query.eq('assigned_to', filterUserId);
```

**Para Admin/Proprietário:**
```typescript
const filterUserId = isAdminOrOwner && selectedUserId
  ? selectedUserId
  : currentUser?.id;

if (filterUserId) {
  query.eq('assigned_to', filterUserId);
}
```

#### Para Google Calendar (Privado)

```typescript
const shouldShowGoogleEvents = !selectedUserId || selectedUserId === currentUser?.id;

if (shouldShowGoogleEvents && todayEvents) {
  // Mostra eventos
} else {
  // Oculta eventos (admin vendo outro usuário)
}
```

## Implementação Detalhada

### Arquivo: `src/pages/Agenda.tsx`

#### 1. Verificar se é Admin/Owner (linhas 81-82)

```typescript
const isAdminOrOwner =
  currentUser?.role === 'admin' || currentUser?.companies?.owner_id === currentUser?.id;
```

#### 2. Buscar Atendentes (linhas 85-99)

Apenas admin/owner vê a lista de usuários para selecionar:

```typescript
const { data: attendants = [] } = useQuery({
  queryKey: ['company-attendants', currentUser?.company_id],
  queryFn: async () => {
    if (!isAdminOrOwner || !currentUser?.company_id) return [];

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('company_id', currentUser.company_id) // 👈 Filtro por empresa
      .order('full_name');

    return data || [];
  },
  enabled: isAdminOrOwner && !!currentUser?.company_id,
});
```

#### 3. Filtrar Tarefas (linhas 104-130)

```typescript
const { data: tasks = [] } = useQuery({
  queryKey: ['user-tasks', currentDate, filterUserId, isAdminOrOwner, selectedUserId],
  queryFn: async () => {
    if (!currentUser) return [];

    let query = supabase
      .from('tasks')
      .select('*, profiles(full_name, avatar_url)')
      .eq('company_id', currentUser.company_id) // 👈 Filtro por empresa
      .gte('due_date', start.toISOString())
      .lte('due_date', end.toISOString());

    if (filterUserId) {
      query = query.eq('assigned_to', filterUserId); // 👈 Filtro por usuário
    }

    const { data } = await query;
    return data || [];
  },
});
```

#### 4. Filtrar Deals (linhas 132-158)

Mesma lógica das tarefas.

#### 5. Filtrar Google Calendar (linhas 173-203)

```typescript
// IMPORTANTE: Só mostra eventos do Google Calendar se:
// 1. For o próprio usuário logado vendo seu calendário OU
// 2. Admin não selecionou nenhum usuário específico (ver todos)
const shouldShowGoogleEvents = !selectedUserId || selectedUserId === currentUser?.id;

if (shouldShowGoogleEvents && todayEvents && Array.isArray(todayEvents)) {
  // Adiciona eventos do Google Calendar
  todayEvents.forEach((event: any) => {
    events.push(event);
  });
} else {
  console.log('⚠️ Google events hidden (viewing another user)');
}
```

## Fluxos de Uso

### Fluxo 1: Usuário Normal Visualiza Seu Calendário

```
1. Usuário faz login
2. Acessa /agenda
3. Sistema:
   - Carrega eventos do Google Calendar do usuário
   - Carrega tarefas WHERE assigned_to = user_id AND company_id = user_company
   - Carrega deals WHERE assigned_to = user_id AND company_id = user_company
4. Usuário vê apenas seus próprios eventos
```

### Fluxo 2: Admin Visualiza Calendário de Outro Usuário

```
1. Admin faz login
2. Acessa /agenda
3. Vê dropdown de usuários (porque é admin)
4. Seleciona "João Silva"
5. Sistema:
   - OCULTA eventos do Google Calendar do admin
   - Carrega tarefas WHERE assigned_to = joao_id AND company_id = admin_company
   - Carrega deals WHERE assigned_to = joao_id AND company_id = admin_company
6. Admin vê tarefas e deals de João, mas não eventos do Google Calendar
```

### Fluxo 3: Admin Visualiza Todos os Usuários

```
1. Admin faz login
2. Acessa /agenda
3. Não seleciona nenhum usuário (dropdown vazio ou "Todos")
4. Sistema:
   - Mostra eventos do Google Calendar do admin
   - Carrega tarefas de TODOS os usuários da empresa
   - Carrega deals de TODOS os usuários da empresa
5. Admin vê overview de toda a equipe
```

## Isolamento por Empresa

### Como Funciona

O `company_id` é obtido do perfil do usuário logado:

```typescript
const { data: currentUser } = useQuery({
  queryKey: ['current-user-profile'],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, companies(owner_id)')
      .eq('id', user.id)
      .single();

    return profile; // contém profile.company_id
  },
});
```

Todas as queries usam `currentUser.company_id`:

```sql
SELECT * FROM tasks
WHERE company_id = <currentUser.company_id>
  AND assigned_to = <user_id>
```

### Row Level Security (RLS)

No Supabase, você deve ter políticas RLS configuradas:

```sql
-- Exemplo de política para tarefas
CREATE POLICY "Users can view tasks of their company"
ON tasks FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles
    WHERE id = auth.uid()
  )
);
```

## Teste da Implementação

### Cenário 1: Usuário em Empresa A

```
Usuário: user@empresaA.com
Empresa: Empresa A (ID: aaa-111)

Deve ver:
✅ Seus eventos do Google Calendar
✅ Suas tarefas da Empresa A
✅ Seus deals da Empresa A

NÃO deve ver:
❌ Eventos de outros usuários
❌ Tarefas de outras empresas
❌ Deals de outras empresas
```

### Cenário 2: Admin em Empresa A Visualizando User B

```
Admin: admin@empresaA.com
Empresa: Empresa A (ID: aaa-111)
Selecionado: User B da Empresa A

Deve ver:
✅ Tarefas do User B da Empresa A
✅ Deals do User B da Empresa A

NÃO deve ver:
❌ Eventos do Google Calendar do User B
❌ Eventos do Google Calendar do próprio admin (porque selecionou outro)
❌ Dados de outras empresas
```

### Cenário 3: Empresas Diferentes

```
Empresa A: ID aaa-111
Empresa B: ID bbb-222

User A (Empresa A) NÃO deve ver:
❌ Tarefas da Empresa B
❌ Deals da Empresa B
❌ Usuários da Empresa B no dropdown (se fosse admin)
```

## Troubleshooting

### Problema: Admin vê eventos de outros usuários

**Causa**: Google Calendar não está sendo filtrado corretamente

**Solução**: Verificar linha 177:
```typescript
const shouldShowGoogleEvents = !selectedUserId || selectedUserId === currentUser?.id;
```

### Problema: Usuário vê tarefas de outras empresas

**Causa**: Filtro de `company_id` não está sendo aplicado

**Solução**: Verificar linhas 116 e 144:
```typescript
.eq('company_id', currentUser.company_id)
```

### Problema: Dropdown de usuários vazio para admin

**Causa**: Query não está retornando usuários

**Solução**: Verificar linha 93:
```typescript
.eq('company_id', currentUser.company_id)
```

E conferir se `isAdminOrOwner` está true (linha 82).

## Logs de Debug

Para debugar, procure no console:

```javascript
console.log('🔍 Consolidating events...', {
  googleEventsCount: todayEvents?.length || 0,
  tasksCount: tasks?.length || 0,
  dealsCount: deals?.length || 0,
  isAdminOrOwner,
  selectedUserId,
  currentUserId: currentUser?.id,
});
```

E:

```javascript
console.log('⚠️ Google events hidden (viewing another user) or no events:', {
  shouldShowGoogleEvents,
  hasEvents: !!todayEvents,
});
```

## Melhorias Futuras

1. **Compartilhamento de Calendário**: Permitir usuário compartilhar seu Google Calendar com equipe
2. **Visualização de Disponibilidade**: Mostrar apenas slots disponíveis de outros usuários
3. **Calendário de Equipe**: Visão consolidada apenas de eventos públicos
4. **Permissões Granulares**: Definir quem pode ver o quê por tipo de evento

## Conclusão

O calendário agora está completamente isolado por:
1. ✅ **Empresa** - Através de `company_id`
2. ✅ **Usuário** - Através de `assigned_to` e `filterUserId`
3. ✅ **Privacidade** - Google Calendar é privado por padrão
4. ✅ **Permissões** - Admin pode ver dados de equipe, exceto Google Calendar
