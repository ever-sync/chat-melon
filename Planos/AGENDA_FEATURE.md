# Feature: Página de Agenda Pessoal

## Descrição

Foi criada uma nova página `/agenda` dedicada para que cada atendente possa visualizar e gerenciar sua agenda pessoal, integrando:

- **Eventos do Google Calendar** (quando conectado)
- **Tarefas** atribuídas ao atendente
- **Negociações (Deals)** com data prevista de fechamento

## Como Funciona

### 1. Acessando a Agenda

- **Desktop**: Clique em "Agenda" no menu lateral (ícone de calendário)
- **Mobile**: Toque em "Agenda" no menu inferior
- **URL direta**: `http://192.168.15.2:8081/agenda`

### 2. Conectando o Google Calendar

Para que os eventos do Google Calendar apareçam na agenda, cada atendente deve:

1. Acessar **Configurações** (menu lateral)
2. Procurar a seção **"Google Calendar"**
3. Clicar em **"Conectar Google Calendar"**
4. Autorizar o acesso no popup que abrir
5. Pronto! Os eventos serão sincronizados automaticamente

#### Importante sobre o Google Calendar

- Cada atendente conecta **sua própria conta** do Google
- Os eventos são **pessoais** e privados de cada usuário
- A sincronização acontece automaticamente a cada 5 minutos
- É possível desconectar a qualquer momento nas configurações

### 3. Visualizando a Agenda

A tela de agenda mostra:

- **Calendário mensal** com todos os eventos
- **Cores diferentes** para cada tipo:
  - 🔵 Azul = Google Calendar
  - 🟢 Verde = Tarefas
  - 🟣 Roxo = Negociações (Deals)
- **Detalhes ao passar o mouse** sobre cada evento
- **Navegação** entre meses (setas < >)
- **Botão "Hoje"** para voltar ao mês atual

### 4. Criando Novos Eventos

Você pode criar eventos de duas formas:

#### 4.1. Pelo botão "Criar Evento"
1. Clique no botão **"Criar Evento"** no topo
2. Escolha o tipo:
   - **Tarefa/Reunião (Sistema)**: Cria uma tarefa no sistema
   - **Google Calendar**: Cria direto no Google Calendar (requer conexão)
3. Preencha os dados:
   - Título
   - Descrição (opcional)
   - Data e horários
   - Prioridade (para tarefas)
4. Clique em "Criar Evento"

#### 4.2. Clicando em um dia específico
1. Passe o mouse sobre qualquer dia no calendário
2. Clique no **ícone + (plus)** que aparece
3. O modal abre com a data já selecionada
4. Preencha e crie o evento

### 5. Tipos de Eventos

#### Google Calendar (🔵)
- Eventos sincronizados da sua conta Google
- Aparecem em **azul**
- Mostram horário de início e fim
- Atualizados automaticamente

#### Tarefas (🟢/🟡/🔴)
- Tarefas do sistema atribuídas a você
- Cores baseadas na prioridade:
  - 🔴 Urgente
  - 🟡 Alta
  - 🟢 Normal/Baixa
- Mostram horário agendado

#### Negociações (🟣)
- Deals com data prevista de fechamento
- Cor baseada no estágio do pipeline
- Mostram valor e cliente
- Aparecem na data prevista

## Recursos da Agenda

✅ Visualização mensal consolidada
✅ Integração com Google Calendar
✅ Tarefas e reuniões do sistema
✅ Negociações do pipeline de vendas
✅ Criação rápida de eventos
✅ Navegação entre meses
✅ Responsive (mobile e desktop)
✅ Atualização automática

## Configuração Requerida

### Para Usar o Google Calendar

**IMPORTANTE**: É necessário configurar as credenciais do Google Cloud Console:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Adicione os seguintes URIs:

**Authorized JavaScript origins:**
```
http://192.168.15.2:8081
```

**Authorized redirect URIs:**
```
[URL_DO_SUPABASE]/functions/v1/google-calendar-oauth
```

3. Copie o Client ID e Client Secret
4. Configure as variáveis de ambiente no Supabase:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Sem Google Calendar

Mesmo sem conectar o Google Calendar, você pode:
- Ver todas as tarefas atribuídas a você
- Ver negociações com datas previstas
- Criar novas tarefas/reuniões no sistema
- Usar a agenda para organização interna

## Fluxo de Trabalho Recomendado

1. **Todo atendente** acessa `/agenda` pela primeira vez
2. **Opcional**: Conecta seu Google Calendar em Configurações
3. **Diariamente**:
   - Verifica a agenda pela manhã
   - Cria tarefas para follow-ups
   - Marca reuniões com clientes
   - Monitora prazos de negociações
4. **Semanalmente**:
   - Revisa eventos da semana
   - Ajusta prioridades
   - Planeja próximas ações

## Arquivos Criados/Modificados

### Novos Arquivos
- `/src/pages/Agenda.tsx` - Página principal da agenda
- `/src/components/agenda/CreateEventModal.tsx` - Modal de criação de eventos
- `/AGENDA_FEATURE.md` - Esta documentação

### Arquivos Modificados
- `/src/App.tsx` - Adicionada rota `/agenda`
- `/src/components/AppSidebar.tsx` - Adicionado link "Agenda" no menu
- `/src/components/mobile/MobileBottomNav.tsx` - Adicionado ícone de agenda no mobile
- `/src/hooks/useGoogleCalendar.ts` - Melhorado para listar eventos do mês
- `/supabase/functions/google-calendar-sync/index.ts` - Adicionadas ações:
  - `list_month_events` - Lista eventos do mês inteiro
  - `create_direct_event` - Cria eventos direto no Google Calendar

## Troubleshooting

### Eventos do Google Calendar não aparecem
1. Verifique se está conectado (Configurações > Google Calendar)
2. Verifique as credenciais do Google Cloud Console
3. Tente desconectar e reconectar
4. Aguarde até 5 minutos para sincronização

### Não consigo conectar o Google Calendar
1. Verifique se os URIs estão corretos no Google Cloud Console
2. Verifique se as variáveis de ambiente estão configuradas
3. Limpe o cache do navegador
4. Tente em modo anônimo

### Tarefas não aparecem
1. Verifique se a tarefa tem uma data definida
2. Verifique se está atribuída a você
3. Navegue para o mês correto da tarefa

## Próximos Passos (Sugestões)

- [ ] Arrastar e soltar eventos para reagendar
- [ ] Filtros por tipo de evento
- [ ] Vista semanal
- [ ] Vista diária com timeline
- [ ] Notificações de eventos próximos
- [ ] Exportar agenda para PDF
- [ ] Integração com outros calendários (Outlook, etc)
