# 📚 Documentação de Funcionalidades - CRM WhatsApp

## 🗺️ Hierarquia de Navegação

### Navegação Principal (Sidebar)

```
├── 📊 Dashboard (/)
├── 💬 Chat (/chat)
├── 👥 Contatos (/contacts)
├── 🎯 CRM (/crm)
├── ✅ Tarefas (/tasks)
├── 📄 Propostas (/proposals)
├── 🎨 Templates (/templates)
├── 👥 Grupos (/groups)
├── 📊 Segmentos (/segments)
├── 🔀 Duplicados (/duplicates)
├── 📦 Produtos (/products)
├── 📢 Campanhas (/campaigns)
├── ⚡ Automações (/automation)
├── 🎮 Gamificação (/gamification)
└── 📈 Relatórios (/reports)
    ├── Atividades (/reports)
    ├── Performance da Equipe (/reports/team-performance)
    └── Insights IA (via /reports)

### Configurações (/settings)

```
├── Geral
├── WhatsApp (Instâncias Evolution)
├── Pipeline
├── Campos Personalizados
├── Usuários
├── Filas
├── Inteligência Artificial
├── Email
├── Google Calendar
└── Satisfação (CSAT/NPS)
```

### Super Admin (/super-admin)
```
├── Features Globais
├── Planos
├── Empresas
└── Métricas
```

---

## 📱 MÓDULO: CHAT

**Rota:** `/chat`

### Funcionalidades Principais

#### 1. **Lista de Conversas (ConversationList)**
- Exibe todas as conversas do WhatsApp
- Busca em tempo real por nome/número
- Filtros avançados:
  - Status: Abertas, Pendentes, Resolvidas, Fechadas
  - Atribuição: Minhas, Não atribuídas, Todos
  - Labels (tags coloridas)
  - Não lidas
  - Data (hoje, ontem, última semana, mês, customizado)
  - Tempo de resposta (>1h, >4h, >24h, >48h)
  - Com mídia
- Salvamento de filtros favoritos
- Indicadores:
  - Badge de mensagens não lidas
  - Status online/offline do contato
  - Temperatura do lead (🔥 quente, 🌡️ morno, ❄️ frio)
  - Última mensagem e horário
  - Avatar do responsável

**Botões:**
- `+ Nova Conversa` - Inicia conversa com número não existente
- `Filtros` - Abre diálogo de filtros avançados
- `Salvar Filtro` - Salva combinação de filtros
- Chips de filtros ativos (clicáveis para remover)

#### 2. **Área de Mensagens (MessageArea)**

**Funcionalidades:**
- Histórico completo de mensagens
- Scroll infinito (carrega mensagens antigas)
- Indicador de "digitando..." em tempo real
- Status de entrega: ⏱️ pendente, ✓ enviado, ✓✓ entregue, ✓✓ lido (azul)
- Suporte a múltiplos tipos de mídia:
  - Texto
  - Imagem
  - Vídeo
  - Áudio
  - Documento
  - Localização
  - Contato
  - Sticker
  - Poll (enquete)
  - Lista interativa

**Botões no Header:**
- `Ligar` - Inicia chamada via Evolution API
- `Atribuir a Mim` - Assume responsabilidade pela conversa
- `Transferir` - Transfere para outro usuário/fila
- `Resolver` - Marca conversa como resolvida
- `Encerrar` - Encerra conversa (dispara pesquisa CSAT se habilitado)
- `⋮ Mais Opções`:
  - Reabrir conversa
  - Bloquear contato
  - Arquivar
  - Ver perfil do contato

#### 3. **Painel de Contato (ContactDetailPanel)**

**Seções (colapsáveis):**

**Informações Básicas:**
- Avatar com status online
- Nome (editável inline)
- Telefone (editável com botão copiar)
- Email (editável)
- Empresa (editável)
- Cliente desde
- Última interação
- Total de conversas
- Receita total de deals ganhos

**Labels:**
- Adicionar/remover labels da conversa
- Labels coloridas clicáveis

**Negócios:**
- Lista de deals do contato
- Exibe: Título, Valor, Stage atual
- `+ Novo Negócio` - Cria deal para este contato

**Tarefas:**
- Lista de tarefas pendentes
- Checkbox para marcar como concluída
- `+ Nova Tarefa` - Cria tarefa para este contato

**Notas:**
- Adicionar notas sobre o contato
- Exibe data e autor
- Opção de fixar notas importantes

**Arquivos:**
- Grid de mídias enviadas/recebidas
- Filtro por tipo (imagem, vídeo, documento)
- Thumbnails clicáveis

**Ações Rápidas no Topo:**
- `Ligar`
- `Bloquear`
- `Arquivar`

#### 4. **Input de Mensagem (MessageInput)**

**Funcionalidades:**
- Auto-resize do campo de texto
- Enter para enviar, Shift+Enter para quebra de linha
- Indicador de "digitando..." automático

**Botões:**
- `📎 Anexar` - Upload de arquivo/imagem/vídeo/documento
- `📷 Câmera` - Tirar foto
- `🎤 Áudio` - Gravar áudio (pressionar para gravar)
- `⚡ Respostas Rápidas` - Templates salvos
- `😊 Emoji` - Picker de emojis
- `📊 Interativo` - Enviar Poll ou Lista
- `✈️ Enviar` - Envia mensagem

#### 5. **Assistente IA (AIAssistant)**

**Painel Lateral com:**

**Análise da Conversa:**
- Sentimento (😊 Positivo, 😐 Neutro, 😞 Negativo)
- Temperatura (🔥 Quente, 🌡️ Morno, ❄️ Frio)
- Intenção detectada (quer comprar, dúvida, objeção, etc)
- Nível de urgência

**Sugestões de Resposta:**
- 3 respostas geradas por IA
- Botões: `[Usar]` `[Editar]` `[Regenerar]`

**Resumo da Conversa:**
- Auto-gerado dos últimos 20 mensagens
- Botão copiar

**Battle Card:**
- Aparece quando concorrente é mencionado
- Vantagens vs. concorrente
- Perguntas sugeridas
- Respostas para objeções

**Próximos Passos:**
- Ações sugeridas (criar tarefa, enviar proposta, agendar reunião)
- Botões de execução direta

**Controles:**
- Dropdown de tom (Formal, Casual, Técnico, Amigável)
- Configurações de IA

---

## 👥 MÓDULO: CONTATOS

**Rota:** `/contacts`

### Funcionalidades Principais

#### 1. **Lista de Contatos**

**Visualização:**
- Tabela/Grid com avatar, nome, telefone, email, empresa
- Tags (badges coloridas)
- Última interação
- Lead Score (com badge colorido: 🔥 80-100, 🟠 60-79, 🟡 40-59, ❄️ 0-39)

**Filtros:**
- Busca por nome/telefone/email/empresa
- Por tag
- Por fonte (WhatsApp, Manual, Importação)
- Por período de criação
- Por última interação
- Por Lead Score
- Por segmento

**Botões Principais:**
- `+ Novo Contato` - Abre modal de criação
- `Importar` - Importa CSV/Excel
- `Exportar` - Exporta contatos filtrados
- `Detectar Duplicados` - Roda detecção manual
- `Segmentos` - Navega para /segments

**Ações em Massa (checkboxes):**
- Adicionar tag
- Remover tag
- Exportar selecionados
- Deletar (se tiver permissão)

#### 2. **Modal de Contato**

**Campos:**
- Nome
- Telefone (formatação automática)
- Email (validação)
- Empresa
- CNPJ (máscara automática)
- LinkedIn URL
- Tags (multi-select)
- Campos personalizados (dinâmicos conforme configuração)

**Botões:**
- `Salvar`
- `Salvar e Criar Negócio`
- `Cancelar`

**Detecção de Duplicados:**
- Alerta se encontrar telefone existente
- Opção de ver contato existente ou criar mesmo assim

#### 3. **Enriquecimento de Dados**

**Botão:** `Enriquecer Dados` (no painel de detalhes)

**Processo:**
- Consulta API externa com CNPJ
- Atualiza automaticamente:
  - Razão Social
  - Nome Fantasia
  - CNAE
  - Endereço completo
  - Capital Social
  - Data Fundação
  - Situação Cadastral

**Status de Enriquecimento:**
- ✅ Enriquecido (badge verde)
- ⏳ Pendente (badge amarelo)
- ❌ Não Encontrado (badge vermelho)

#### 4. **Importação de Contatos**

**Modal de 4 Etapas:**

**Etapa 1: Upload**
- Arraste arquivo CSV/Excel
- Preview das primeiras 5 linhas
- Detecção automática de delimitador

**Etapa 2: Mapeamento**
- Auto-match de colunas
- Mapeia para campos do sistema
- Mapeia para campos personalizados

**Etapa 3: Validação**
- Valida formato de telefone
- Detecta duplicados no arquivo
- Detecta duplicados no banco
- Exibe erros

**Etapa 4: Processamento**
- Barra de progresso
- Importação em lote
- Opções de conflito:
  - Ignorar erros
  - Atualizar existentes por telefone
  - Criar duplicados

**Resultado:**
- X contatos importados
- Y erros encontrados
- Download de log de erros

#### 5. **Exportação de Contatos**

**Opções:**
- Formato: CSV ou Excel
- Escopo: Filtrados ou Todos
- Seleção de campos (checkboxes)
- Download automático

---

## 🎯 MÓDULO: CRM (PIPELINE)

**Rota:** `/crm`

### Funcionalidades Principais

#### 1. **Pipeline Kanban (PipelineBoard)**

**Visualização:**
- Colunas representando stages
- Nome do stage + cor
- Contagem de deals na coluna
- Soma de valores da coluna
- Cards de deals arrastáveis

**Drag & Drop:**
- Arrastar deals entre stages
- Atualiza automaticamente no banco
- Registra atividade no histórico
- Atualiza probabilidade se stage tiver default
- Dispara celebração se mover para "Fechado Ganho"
- Solicita motivo se mover para "Fechado Perdido"
- Executa playbooks configurados para mudança de stage

**Filtros:**
- Por vendedor (assigned_to)
- Por valor mínimo/máximo
- Por data de criação
- Por tags
- Busca por nome do deal ou contato

**Botões:**
- `+ Adicionar Deal` (em cada coluna) - Cria deal naquele stage
- `⋮ Configurar Pipeline` - Navega para /settings/pipeline

#### 2. **Card de Deal (DealCard)**

**Informações Exibidas:**
- Avatar e nome do contato
- Título do deal
- Valor formatado (R$ 10.000,00)
- Probabilidade (badge com %)
- Prioridade (ícone: 🔴 urgente, 🟡 alta, 🟢 média, ⚪ baixa)
- Temperatura (🔥 quente, 🌡️ morno, ❄️ frio)
- Indicador de BANT (barra de progresso 0-100%)
- Próximo passo com data
- Avatar do vendedor responsável
- ⚠️ Alerta se inativo >7 dias

**Menu de Ações (⋮):**
- Ver detalhes
- Editar
- Enviar proposta
- Criar tarefa
- Conversar (abre chat)
- Marcar como ganho
- Marcar como perdido
- Deletar

**Edição Inline:**
- Click no valor permite editar diretamente

#### 3. **Modal de Deal (DealModal)**

**Tabs:**

**Tab Geral:**
- Título (obrigatório)
- Contato (select com busca)
- Valor (currency input)
- Stage (select)
- Probabilidade (0-100%)
- Prioridade (low/medium/high/urgent)
- Data prevista de fechamento
- Vendedor responsável
- Produtos/Serviços (multi-select do catálogo)
- Temperatura (hot/warm/cold)

**Tab Qualificação (BANT):**
- ✅ Budget Confirmado (toggle)
- ✅ Timeline Confirmado (toggle)
- Decision Maker (texto)
- Necessidade Identificada (textarea)
- Barra de progresso BANT (0-100%)

**Tab Concorrência:**
- Concorrente Principal (select)
- Pontos Fortes do Concorrente (textarea)
- Nossos Diferenciais (textarea)

**Tab Próximos Passos:**
- Próxima Ação (texto)
- Data da Próxima Ação (date)
- Checkbox: Criar tarefa automaticamente

**Tab Campos Personalizados:**
- Campos dinâmicos configurados em /settings/custom-fields

**Botões:**
- `Salvar`
- `Salvar e Enviar Proposta`
- `Cancelar`

#### 4. **Detalhes do Deal (DealDetail)**

**Modal/Página com Tabs:**

**Tab Resumo:**
- Todas as informações do deal
- Edição inline de campos
- Cards de métricas (valor, probabilidade, dias em stage)

**Tab Timeline:**
- Histórico cronológico de atividades
- Ícones por tipo:
  - 🎯 Deal criado
  - ➡️ Stage alterado
  - 💰 Valor alterado
  - 📄 Proposta enviada
  - ✅ Proposta aceita
  - ❌ Proposta rejeitada
  - ✅ Tarefa completada
  - 💬 Mensagem enviada
  - 📞 Ligação realizada
  - 📝 Nota adicionada
  - 👤 Responsável alterado
- Filtros por tipo de atividade e período
- `+ Adicionar Atividade` - Modal para call/meeting/email/note manual

**Tab Propostas:**
- Lista de propostas enviadas
- Status e valores
- Botão para criar nova

**Tab Tarefas:**
- Tarefas relacionadas ao deal
- Criar nova tarefa

**Tab Notas:**
- Notas do deal
- Adicionar nota

#### 5. **Workflow de Fechamento**

**Deal Ganho:**
- Modal de celebração com confetti
- Campo: Motivo da vitória (select)
- Atualiza status para 'won'
- Move para stage "Fechado Ganho"
- Registra won_at
- Atualiza metas do vendedor
- Cria notificação para equipe
- Verifica conquistas (achievements)

**Deal Perdido:**
- Modal obrigatório
- Motivo (select): Preço, Concorrente, Timing, Orçamento Cancelado, Sem Resposta, Outro
- Detalhes (textarea obrigatória)
- Atualiza status para 'lost'
- Move para stage "Fechado Perdido"
- Registra lost_at e lost_reason

---

## ✅ MÓDULO: TAREFAS

**Rota:** `/tasks`

### Funcionalidades Principais

#### 1. **Lista de Tarefas (TaskList)**

**Visualizações:**
- Lista (padrão)
- Calendário (por dia/semana/mês)
- Kanban (por status)

**Filtros:**
- Minhas tarefas / Todas
- Por tipo (call, email, meeting, follow_up, proposal, other)
- Por prioridade (low, medium, high, urgent)
- Por status (pending, completed, cancelled)
- Por data (hoje, esta semana, este mês, atrasadas)
- Por responsável

**Busca:**
- Por título ou descrição

**Ordenação:**
- Data de vencimento
- Prioridade
- Data de criação

**Indicadores:**
- ⚠️ Badge vermelho para tarefas atrasadas
- Dias de atraso
- Cor por prioridade

**Botões:**
- `+ Nova Tarefa` - Abre modal de criação
- Botões de visualização (lista/calendário/kanban)

#### 2. **Card de Tarefa (TaskCard)**

**Informações:**
- Checkbox para completar
- Ícone do tipo de tarefa
- Título
- Descrição (preview)
- Data/hora de vencimento
- Prioridade (badge colorido)
- Avatar do contato relacionado
- Nome do deal relacionado (se houver)
- Avatar do responsável

**Ações (hover/menu):**
- Editar
- Marcar como concluída
- Deletar
- Adiar (quick actions: +1h, +1d, +1w)

#### 3. **Modal de Tarefa (TaskModal)**

**Campos:**
- Título (obrigatório)
- Descrição (textarea)
- Tipo (select: call, email, meeting, follow_up, proposal, other)
- Prioridade (select: low, medium, high, urgent)
- Data/Hora de vencimento (datetime picker)
- Responsável (user select)
- Contato relacionado (select com busca)
- Negócio relacionado (select com busca)
- ✅ Adicionar ao Google Calendar (checkbox)

**Botões:**
- `Salvar`
- `Salvar e Criar Outra`
- `Cancelar`

#### 4. **Conclusão de Tarefa**

**Ação:**
- Checkbox no card
- Atualiza status para 'completed'
- Registra completed_at
- Toast de confirmação
- Verifica achievements
- Remove da lista de pendentes (com animação)

**Notificações:**
- Alerta de tarefas atrasadas (via Edge Function check-notifications)
- Push notification se habilitado

---

## 📄 MÓDULO: PROPOSTAS

**Rota:** `/proposals`

### Funcionalidades Principais

#### 1. **Lista de Propostas (ProposalList)**

**Visualização:**
- Cards de propostas
- Status (draft, sent, viewed, accepted, rejected, expired)
- Valor total
- Cliente
- Data de criação
- Validade
- Badge de versão (se >1)

**Filtros:**
- Por status
- Por vendedor
- Por período
- Por cliente
- Busca por título

**Botões:**
- `+ Nova Proposta` - Escolher template ou começar em branco
- `Templates` - Navega para /proposals/templates

**Ações por Proposta:**
- Editar (cria nova versão se já enviada)
- Ver detalhes
- Copiar link público
- Enviar por WhatsApp
- Gerar PDF
- Duplicar
- Deletar (se draft)
- Ver histórico de versões

#### 2. **Construtor de Proposta (ProposalBuilder)**

**Layout:**
- Sidebar esquerda: Catálogo de produtos
- Centro: Editor de conteúdo
- Direita: Preview em tempo real

**Seções de Conteúdo (drag-drop):**
- Header (título, subtítulo, logo)
- Texto (rich text editor)
- Produtos (do catálogo)
- Tabela de Preços
- Termos e Condições
- Assinatura
- Imagens
- Divisores

**Substituição de Variáveis:**
- `{{empresa_cliente}}`
- `{{nome_contato}}`
- `{{data_hoje}}`
- `{{validade}}`
- `{{total}}`
- `{{vendedor_nome}}`

**Cálculos Automáticos:**
- Subtotal
- Desconto (% ou valor fixo)
- Impostos
- Total

**Botões:**
- `Salvar Rascunho`
- `Gerar PDF`
- `Criar Link Público`
- `Enviar por WhatsApp`
- `Enviar por Email`
- `Preview`

#### 3. **Galeria de Templates (ProposalTemplateGallery)**

**Visualização:**
- Cards com thumbnail dos templates
- Nome e descrição
- Categoria
- Contador de uso

**Filtros:**
- Por categoria (Vendas, Serviços, Consultoria, etc)
- Busca

**Ações:**
- `Usar Template` - Inicia nova proposta
- `Preview`
- Editar template (se admin)
- Deletar template (se admin)

**Botão:**
- `+ Criar Template` - Cria novo template

#### 4. **Visualização Pública (ProposalPublic)**

**Rota:** `/p/:slug`

**Funcionalidades:**
- Visualização da proposta completa
- Design responsivo e profissional
- Tracking de visualização (primeira vez)
- Botões de ação do cliente:

**Aprovar Proposta:**
- Modal com campo de assinatura digital (canvas)
- Nome completo
- CPF/CNPJ
- Confirma aprovação
- Atualiza status para 'accepted'
- Move deal para próximo stage (ou fechado ganho)
- Notifica vendedor

**Solicitar Ajustes:**
- Campo de texto para descrever alterações
- Atualiza status para 'rejected'
- Cria tarefa para vendedor revisar
- Notifica vendedor

**Compartilhar:**
- Copiar link
- Compartilhar via WhatsApp

#### 5. **Versionamento de Propostas**

**Quando editar proposta enviada:**
- Modal: "Descrever mudanças desta versão"
- Cria nova versão (incrementa número)
- Mantém versão anterior intacta
- Link público aponta para versão mais recente

**Histórico de Versões:**
- Timeline com todas as versões
- v3 (atual) - 27/11/2024 - Draft
- v2 - 20/11/2024 - Enviada - "Ajustou preço"
- v1 - 15/11/2024 - Visualizada

**Comparação de Versões:**
- Side-by-side
- Highlighting de diferenças:
  - Verde: itens adicionados
  - Vermelho: itens removidos
  - Amarelo: valores alterados

---

## 🎨 MÓDULO: TEMPLATES DE MENSAGEM

**Rota:** `/templates`

### Funcionalidades Principais

#### 1. **Lista de Templates (TemplatesManager)**

**Visualização:**
- Cards de templates
- Nome
- Preview do conteúdo
- Categoria
- Contador de uso
- ⭐ Favorito

**Filtros:**
- Por categoria
- Favoritos
- Mais usados
- Busca

**Botões:**
- `+ Novo Template` - Cria template
- Ordenar por (nome, uso, data)

**Ações por Template:**
- Editar
- Duplicar
- Favoritar/Desfavoritar
- Deletar
- Ver estatísticas de uso

#### 2. **Modal de Template**

**Campos:**
- Nome (obrigatório)
- Conteúdo (textarea com preview)
- Categoria (select)
- Variáveis detectadas automaticamente

**Variáveis Disponíveis:**
- `{{nome}}` - Nome do contato
- `{{empresa}}` - Empresa do contato
- `{{vendedor}}` - Nome do vendedor
- `{{data}}` - Data atual
- Variáveis customizadas

**Preview:**
- Mostra como ficará com variáveis substituídas
- Exemplo usando contato selecionado

**Botões:**
- `Salvar`
- `Salvar e Usar Agora`
- `Cancelar`

#### 3. **Uso de Templates no Chat**

**Botão Respostas Rápidas (⚡):**
- Abre popover com lista de templates
- Busca rápida
- Favoritos no topo
- Click para inserir no input
- Substitui variáveis automaticamente
- Incrementa contador de uso

---

## 👥 MÓDULO: GRUPOS WhatsApp

**Rota:** `/groups`

### Funcionalidades Principais

#### 1. **Dashboard de Grupos (GroupDashboard)**

**Cards de Métricas:**
- Total de grupos
- Grupos ativos
- Total de participantes
- Mensagens hoje

**Lista de Grupos:**
- Avatar do grupo
- Nome
- Descrição
- Quantidade de participantes
- Última atividade
- Status (ativo/arquivado)

**Filtros:**
- Ativos/Arquivados
- Busca por nome

#### 2. **Gerenciador de Grupos (GroupManager)**

**Botão:** `+ Criar Grupo`

**Modal de Criação:**
- Nome do grupo (obrigatório)
- Descrição
- Avatar (upload de imagem)
- Seleção de participantes (multi-select de contatos)
- Administradores (multi-select)

**Ações em Grupos Existentes:**
- Editar informações
- Adicionar participantes
- Remover participantes
- Promover/Remover admin
- Sair do grupo
- Arquivar grupo
- Deletar grupo (se admin)

**Botões:**
- `Salvar`
- `Cancelar`

---

## 📊 MÓDULO: SEGMENTOS

**Rota:** `/segments`

### Funcionalidades Principais

#### 1. **Lista de Segmentos**

**Visualização:**
- Cards de segmentos
- Nome
- Descrição
- Quantidade de contatos
- Última atualização
- Ícone/cor

**Botões:**
- `+ Novo Segmento` - Abre construtor
- Filtros (ativos/inativos)

**Ações por Segmento:**
- Editar
- Ver contatos
- Usar em campanha
- Exportar
- Duplicar
- Deletar

#### 2. **Construtor de Segmentos (SegmentBuilder)**

**Interface Visual:**
- Adicionar regras (AND/OR)
- Campos disponíveis:
  - Tags (contém, não contém)
  - Lead Score (maior que, menor que, entre)
  - Última interação (há X dias)
  - Tem deal aberto (sim/não)
  - Valor total de deals (maior/menor que)
  - Fonte (WhatsApp, Manual, etc)
  - Campos personalizados
- Preview de contatos (atualização em tempo real)
- Contador de contatos no segmento

**Botões:**
- `+ Adicionar Regra`
- `+ Adicionar Grupo (AND/OR)`
- `Salvar Segmento`
- `Salvar e Usar em Campanha`
- `Cancelar`

---

## 🔀 MÓDULO: DUPLICADOS

**Rota:** `/duplicates`

### Funcionalidades Principais

#### 1. **Lista de Duplicados Potenciais**

**Visualização:**
- Pares de contatos duplicados
- Score de similaridade (%)
- Motivo da duplicação (telefone, email, nome similar)
- Status (pending, merged, ignored)

**Filtros:**
- Por status
- Por score (>90%, >80%, >70%)
- Por motivo

**Botões:**
- `Detectar Duplicados` - Executa detecção manual
- Filtros de status

**Ações por Par:**
- `Mesclar` - Abre interface de merge
- `Ignorar` - Marca como não duplicado
- Ver detalhes

#### 2. **Interface de Mesclagem**

**Layout Side-by-Side:**
- Contato 1 | Contato 2
- Radio button em cada campo para escolher qual manter
- Campos exibidos:
  - Nome
  - Telefone
  - Email
  - Empresa
  - Tags
  - Campos personalizados
  - Conversas (quantidade)
  - Deals (quantidade)
  - Tarefas (quantidade)

**Preview:**
- Contato resultante após merge
- O que será mantido/descartado

**Botões:**
- `Mesclar Contatos` - Executa merge
- `Cancelar`

**Processo de Merge:**
1. Cria contato unificado com dados selecionados
2. Transfere todas conversas para contato mantido
3. Transfere todos deals para contato mantido
4. Transfere todas tarefas para contato mantido
5. Transfere todas notas para contato mantido
6. Soft-delete do contato descartado (merged_into aponta para mantido)
7. Registra em audit log

---

## 📦 MÓDULO: PRODUTOS

**Rota:** `/products`

### Funcionalidades Principais

#### 1. **Lista de Produtos**

**Visualização:**
- Cards/Grid de produtos
- Imagem principal
- Nome
- SKU
- Preço
- Categoria
- Status (ativo/inativo)

**Filtros:**
- Por categoria
- Ativos/Inativos
- Busca por nome/SKU
- Ordenar por (preço, nome, data)

**Botões:**
- `+ Novo Produto` - Cria produto
- `Importar` - Importa catálogo
- `Exportar` - Exporta catálogo
- Visualização (grid/lista)

#### 2. **Modal de Produto**

**Campos:**
- Nome (obrigatório)
- Descrição (rich text)
- SKU
- Preço de venda (obrigatório)
- Preço de custo
- Categoria
- Imagens (upload múltiplo, drag-drop para ordenar)
- Status (ativo/inativo)
- Metadados (JSONB customizável)

**Botões:**
- `Salvar`
- `Salvar e Adicionar Outro`
- `Cancelar`

#### 3. **Uso em Propostas**

**Seleção de Produtos:**
- Multi-select com busca
- Preview com imagem
- Quantidade editável
- Preço editável (pode ser diferente do cadastrado)
- Desconto por item
- Cálculo automático de totais

---

## 📢 MÓDULO: CAMPANHAS

**Rota:** `/campaigns`

### Funcionalidades Principais

#### 1. **Lista de Campanhas**

**Visualização:**
- Cards de campanhas
- Nome
- Status (draft, scheduled, running, completed, paused)
- Progresso (barra)
- Métricas rápidas (enviados/total, taxa de entrega, taxa de leitura)
- Data de criação/execução

**Filtros:**
- Por status
- Por período
- Busca por nome

**Botões:**
- `+ Nova Campanha` - Inicia wizard
- Filtros de status

**Ações por Campanha:**
- Ver detalhes
- Editar (se draft/scheduled)
- Pausar (se running)
- Retomar (se paused)
- Duplicar
- Ver relatório
- Deletar (se draft)

#### 2. **Wizard de Criação (CampaignBuilder)**

**Etapa 1: Configuração**
- Nome da campanha
- Descrição
- Instância WhatsApp a usar

**Etapa 2: Mensagem**
- Editor de texto
- Variáveis ({{nome}}, {{empresa}})
- Upload de mídia (imagem/vídeo/documento)
- Preview da mensagem
- Tipo: Texto, Imagem com legenda, Vídeo, Documento

**Etapa 3: Destinatários**
- Opções:
  - Selecionar segmento
  - Filtros customizados
  - Upload de CSV
- Preview de contatos (primeiros 10)
- Total de destinatários
- Remoção de bloqueados automática
- Remoção de duplicados automática

**Etapa 4: Agendamento**
- Enviar agora / Agendar
- Data e hora
- Taxa de envio (msgs/min)
- Limite diário por instância
- ✅ Apenas em horário comercial (configurável)
  - Hora início/fim
- ✅ Warmup para instâncias novas (alerta)

**Etapa 5: Revisão**
- Resumo completo
- Preview da mensagem
- Total de destinatários
- Taxa de envio estimada
- ETA de conclusão
- Avisos de segurança

**Botões:**
- `Anterior`
- `Próximo`
- `Salvar Rascunho`
- `Agendar`/`Enviar Agora`

#### 3. **Dashboard da Campanha (CampaignDetail)**

**Métricas em Tempo Real:**
- Total de contatos
- Enviados (com %)
- Entregues (com %)
- Lidos (com %)
- Respondidos (com %)
- Erros (com %)
- Barra de progresso
- ETA de conclusão (se running)

**Gráfico:**
- Evolução temporal (enviados/entregues/lidos)

**Lista de Contatos:**
- Tabela com status individual
- Nome, telefone, status, horário
- Filtros por status (todos/enviado/entregue/lido/erro/respondido)
- Busca

**Ações Individuais:**
- Ver conversa
- Reenviar (se falhou)
- Ver erro (se falhou)

**Botões Principais:**
- `Pausar Campanha` (se running)
- `Retomar` (se paused)
- `Exportar Resultados`
- `Voltar para Campanhas`

#### 4. **Proteções e Safeguards**

**Limites Automáticos:**
- 1000 msgs/dia por instância (configurável)
- Auto-pause se taxa de erro >10%
- Validação de número antes de enviar
- Remoção de bloqueados
- Alerta se mensagem >1000 chars

**Opt-out/Opt-in Automático:**
- Keywords de saída: "sair", "parar", "stop"
- Keywords de entrada: "voltar", "retornar", "continuar"
- Remove/adiciona de todas as campanhas

**Instance Health Dashboard:**
- Taxa de entrega
- Taxa de resposta
- Alertas de risco:
  - Alta taxa de bloqueios
  - Baixa taxa de entrega
  - Instância nova (warmup recomendado)

---

## ⚡ MÓDULO: AUTOMAÇÕES (PLAYBOOKS)

**Rota:** `/automation`

### Funcionalidades Principais

**Tabs:**
- Playbooks
- Execuções

#### 1. **Lista de Playbooks (Tab 1)**

**Visualização:**
- Cards de playbooks
- Nome
- Status (ativo/inativo)
- Trigger (ícone + label)
- Descrição
- Número de steps
- Taxa de uso
- Taxa de sucesso

**Filtros:**
- Ativos/Inativos
- Por tipo de trigger
- Busca por nome

**Botões:**
- `+ Novo Playbook` - Abre builder visual
- Toggle de ativo/inativo (inline)

**Ações por Playbook:**
- Editar (abre builder)
- Duplicar
- Testar
- Ver execuções
- Deletar

#### 2. **Builder Visual (PlaybookFlowBuilder)**

**Interface ReactFlow:**
- Canvas com pan/zoom
- Minimap no canto
- Controles de zoom

**Painel de Nodes (lado esquerdo):**

**Triggers (verde):**
- Manual
- Mensagem recebida
- Deal criado
- Mudança de stage
- Score alterado
- Label adicionada
- Aniversário do contato
- Cron (agendamento)
- Proposta visualizada/aceita/rejeitada
- SLA excedido

**Condições (amarelo):**
- IF/THEN
- Condições múltiplas (AND/OR)
- Horário comercial
- Label específica
- Randomização (A/B test)

**Ações (azul):**
- Enviar WhatsApp
- Enviar Email
- Criar Tarefa
- Mover Stage
- Esperar (delay)
- Atualizar Campo
- Notificar Usuário
- Webhook
- N8N Workflow
- Stop

**Configuração de Node:**
- Painel lateral (direita)
- Campos dinâmicos por tipo de node
- Variáveis disponíveis ({{contato.nome}}, {{negocio.titulo}}, etc)
- Preview da ação

**Conexões:**
- Arrastar de um handle para outro
- Setas indicam fluxo
- Condições podem ter 2 saídas (sim/não)

**Botões:**
- `Salvar Playbook`
- `Testar` - Simula execução
- `Cancelar`

**Campos do Playbook:**
- Nome (obrigatório)
- Descrição

#### 3. **Tester de Playbook (PlaybookTester)**

**Simulação:**
- Seleciona deal/contato para teste
- Executa step-by-step
- Mostra logs em tempo real
- Indica sucesso/erro de cada step

**Execução Real:**
- Opção para executar de verdade (envia mensagens)
- Confirmação obrigatória

#### 4. **Execuções (Tab 2 - PlaybookExecutions)**

**Lista de Execuções:**
- Nome do playbook
- Contato
- Deal
- Status (running, completed, failed, paused)
- Duração
- Data/hora início
- Progresso (step atual/total)

**Filtros:**
- Por status
- Por playbook
- Por período
- Busca por contato/deal

**Ações por Execução:**
- Ver detalhes (logs completos)
- Reexecutar do início
- Reexecutar do ponto de falha
- Cancelar (se running)
- Ver deal relacionado

**Detalhes da Execução:**
- Expandável
- Lista de steps executados
- Timestamp de cada step
- Status de cada step
- Dados de entrada/saída
- Erros (se houver)

---

## 🎮 MÓDULO: GAMIFICAÇÃO

**Rota:** `/gamification`

### Funcionalidades Principais

**Tabs:**
- Minhas Metas
- Conquistas
- Ranking

#### 1. **Minhas Metas (GoalTracker)**

**Visualização:**
- Cards de metas ativas
- Ring de progresso animado
- Meta (ex: R$ 50.000)
- Atual (ex: R$ 35.000)
- Porcentagem (70%)
- Tempo restante (10 dias)
- Status (Em andamento/Concluída/Falhada)

**Tipos de Meta:**
- Receita (valor em R$)
- Número de Deals
- Número de Calls
- Número de Meetings
- Tempo de Resposta Médio

**Períodos:**
- Diária
- Semanal
- Mensal
- Trimestral
- Anual

**Botões:**
- `+ Nova Meta` - Cria meta
- Ver histórico de metas anteriores

**Modal de Meta:**
- Tipo (select)
- Valor alvo
- Período
- Data início/fim
- Descrição

**Marcos de Progresso:**
- Notificação em 50%
- Notificação em 75%
- Notificação em 90%
- Celebração em 100% 🎉

#### 2. **Conquistas (AchievementsBadges)**

**Grid de Badges:**
- Conquistados: coloridos
- Não conquistados: cinza/bloqueado
- Hover mostra critério e progresso

**Conquistas Padrão:**
- 🎯 Primeiro Negócio (1 deal)
- 🥉 Vendedor Bronze (10 deals)
- 🥈 Vendedor Prata (50 deals)
- 🥇 Vendedor Ouro (100 deals)
- ⚡ Resposta Rápida (tempo médio <5min)
- 🏆 Meta Batida (meta mensal concluída)
- 💰 Grande Venda (deal >R$50.000)
- 🔥 Sequência (5 dias consecutivos com vendas)

**Detalhes do Badge:**
- Nome
- Descrição
- Critério
- Progresso atual
- Data de conquista (se conquistado)
- Pontos ganhos

#### 3. **Ranking (Leaderboard)**

**Visualização:**
- Tabela com posições
- Medalhas para top 3 (🥇🥈🥉)
- Avatar e nome do vendedor
- Métrica exibida (configurável)
- Valor/quantidade
- Variação vs período anterior

**Métricas Disponíveis:**
- Receita total
- Número de deals ganhos
- Taxa de conversão
- Tempo médio de resposta
- CSAT médio

**Períodos:**
- Hoje
- Esta semana
- Este mês
- Este trimestre
- Este ano

**Filtros:**
- Por equipe (se houver teams)
- Por região

**Atualização:**
- Tempo real via Supabase Realtime
- Animação quando posições mudam

#### 4. **Celebração (CelebrationModal)**

**Trigger:**
- Deal fechado (moved to "Fechado Ganho")
- Meta batida (100%)
- Conquista desbloqueada

**Efeitos:**
- Confetti (canvas-confetti)
- Som de vitória (opcional)
- Modal com animação
- Mensagem personalizada
- Badge/ícone grande

**Informações Exibidas:**
- Título (ex: "🎉 Negócio Fechado!")
- Valor/descrição
- Pontos ganhos (se houver sistema de pontos)
- Badge desbloqueado (se houver)

**Botões:**
- `Compartilhar com Equipe`
- `Fechar`

---

## 📈 MÓDULO: RELATÓRIOS

### 1. **Dashboard Executivo (/reports)**

**Cards de Métricas:**
- Receita do Mês (vs meta, % de variação)
- Deals em Aberto (quantidade e valor)
- Taxa de Conversão (% e tendência)
- Tempo Médio de Resposta (em minutos/horas)
- CSAT Médio (estrelas e %)
- NPS (score e classificação)

**Gráficos:**

**Receita (RevenueChart):**
- Linha: Receita real vs Meta
- Barras: Por mês
- Seletor de período (últimos 3/6/12 meses)

**Funil de Conversão (ConversionFunnel):**
- Visualização de funil por stages
- Taxa de conversão entre stages
- Tempo médio em cada stage
- Valor total por stage

**Deals que Precisam Atenção:**
- Lista de deals inativos >7 dias
- Deals com alto risco de churn
- Link para abrir cada deal

**Atividades Recentes:**
- Timeline das últimas 20 atividades
- Filtro por tipo e usuário

**Botões:**
- Exportar para PDF
- Agendar envio por email
- Filtros de período

### 2. **Performance da Equipe (/reports/team-performance)**

**Cards de Métricas Agregadas:**
- Total de conversas
- Tempo médio de resposta
- Deals ganhos/perdidos
- Taxa de conversão geral
- Receita total

**Gráficos:**

**Vendas por Vendedor (Bar Chart):**
- Horizontal bars
- Valor de vendas
- Número de deals
- Comparativo com meta

**Taxa de Conversão por Vendedor (Bar Chart):**
- Percentage bars
- Ordenado do maior para o menor

**Ranking de Vendedores (Tabela):**
- Posição (🥇🥈🥉 para top 3)
- Avatar e nome
- Conversas
- Tempo de resposta
- Deals ganhos/perdidos
- Taxa de conversão
- Receita
- CSAT médio
- Progresso de meta (%)

**Filtros:**
- Período (hoje, semana, mês, customizado)
- Equipe (se houver teams)
- Métrica principal (receita, deals, conversão)

**Botões:**
- Exportar para Excel
- Imprimir

### 3. **Insights de IA (/reports - Tab Insights)**

**Cards de Insights:**
- Prioridade (high, medium, low) com cor
- Ícone por tipo
- Título
- Descrição
- Data de geração
- Status (não lido/lido)
- Botão de ação (se actionable)

**Tipos de Insight:**
- ⚠️ Deal em Risco (parado >10 dias)
- 💰 Oportunidade de Upsell (recomendações de produto)
- 📞 Follow-up Necessário (contatos inativos)
- 📈 Tendência Detectada (aumento em métrica)
- 🎯 Progresso de Meta (proximidade de atingir)
- ⏱️ Alerta de Tempo de Resposta (acima da média)
- 🏆 Conquista Próxima (progresso de achievement)

**Ações Disponíveis:**
- Criar tarefa
- Enviar mensagem
- Mover deal
- Atualizar campo
- Ignorar insight

**Filtros:**
- Por prioridade
- Por tipo
- Lidos/Não lidos
- Período

**Botões:**
- Marcar todos como lidos
- Configurar geração de insights

### 4. **Previsão de Vendas (Forecast) - Tab em Reports**

**Visualização:**
- Receita realizada (verde)
- Quota/Meta (linha tracejada)
- Forecast (projeção)

**Breakdown do Pipeline:**
- Tabela por stage
- Quantidade de deals
- Valor total
- Probabilidade média
- Forecast ponderado (valor × probabilidade)

**Cenários:**
- Conservador (apenas deals >75% probabilidade)
- Realista (ponderado por probabilidade)
- Otimista (todos os deals abertos)

**Por Vendedor:**
- Nome
- Forecast individual
- % da quota
- Tendência (↑↓↔)

**Comparação Histórica:**
- Forecast anterior vs Realizado
- Acurácia do forecast
- Ajustes sugeridos

**Alertas:**
- ⚠️ Gap abaixo da quota (quanto falta)
- 💡 Sugestões (reativar leads, acelerar deals)

**Filtros:**
- Período (mês, trimestre, ano)
- Vendedor
- Pipeline

---

## ⚙️ MÓDULO: CONFIGURAÇÕES

**Rota:** `/settings`

### Estrutura de Tabs

#### 1. **Tab Geral (CompanyProfileSettings)**

**Informações da Empresa:**
- Logo (upload)
- Nome
- CNPJ (formatado)
- Email
- Telefone
- Endereço completo (CEP, rua, número, cidade, estado)

**Horário Comercial:**
- Hora início
- Hora fim
- Dias da semana (checkboxes)
- Timezone

**Botões:**
- `Salvar`
- `Cancelar`

#### 2. **Tab WhatsApp (InstancesList + InstanceSettingsForm)**

**Lista de Instâncias:**
- Nome da instância
- Número conectado
- Status (conectado/desconectado/qr_code)
- QR Code (se não conectado)
- Última conexão
- Limite diário de mensagens
- Saúde da instância (%)

**Botões:**
- `+ Nova Instância` - Cria instância Evolution
- Refresh (recarrega status)

**Ações por Instância:**
- Conectar/Reconectar (mostra QR)
- Desconectar
- Editar configurações
- Ver logs de conexão
- Deletar

**Modal de Nova Instância:**
- Nome da instância (obrigatório)
- Limite diário de mensagens
- Aguarda geração de QR Code
- Escaneia QR com WhatsApp
- Confirma conexão

**Configurações da Instância:**
- Nome
- Limite diário
- Webhook URL (para callbacks)
- Configurações avançadas (JSON)

**Health Dashboard (InstanceHealthDashboard):**
- Taxa de entrega (últimos 7 dias)
- Taxa de resposta
- Mensagens enviadas hoje
- Alertas:
  - 🔴 Alta taxa de bloqueios
  - 🟡 Baixa taxa de entrega
  - 🟢 Tudo OK

#### 3. **Tab Pipeline (StagesManager)**

**Lista de Pipelines:**
- Nome
- Descrição
- Número de stages
- Padrão (toggle)
- Ações (editar, deletar)

**Botão:**
- `+ Novo Pipeline`

**Modal de Pipeline:**
- Nome
- Descrição
- Marcar como padrão

**Stages do Pipeline:**
- Drag-drop para reordenar
- Nome
- Cor (color picker)
- Probabilidade padrão (%)
- Marcar como "Fechado Ganho"
- Marcar como "Fechado Perdido"
- Automações ao entrar neste stage

**Botões:**
- `+ Adicionar Stage`
- `Salvar Pipeline`
- `Cancelar`

#### 4. **Tab Campos Personalizados (CustomFieldsManager)**

**Lista de Campos:**
- Agrupados por entidade (Contatos, Deals, Empresas)
- Drag-drop para reordenar
- Nome do campo
- Tipo
- Obrigatório (checkbox)
- Ativo (toggle)

**Tipos de Campo:**
- Texto
- Número
- Data
- Select (dropdown)
- Multi-select
- Boolean (checkbox)
- URL
- Email
- Telefone
- Currency

**Botão:**
- `+ Novo Campo`

**Modal de Campo (CustomFieldModal):**
- Entidade (select)
- Nome (técnico, sem espaços)
- Label (exibição)
- Tipo (select)
- Opções (se select/multi-select, lista editável)
- Valor padrão
- Obrigatório (checkbox)
- Ativo (toggle)

**Botões:**
- `Salvar`
- `Cancelar`

**Uso:**
- Campos aparecem automaticamente nos forms de contato/deal/empresa
- Seção "Campos Personalizados" colapsável

#### 5. **Tab Usuários (UsersPage)**

**Cards de Métricas:**
- Total de usuários
- Usuários ativos
- Online agora
- Equipes

**Lista de Usuários:**
- Avatar
- Nome
- Email
- Role (badge: owner, admin, manager, supervisor, seller, viewer)
- Status (ativo/inativo)
- Online (indicador verde)
- Última visualização
- Equipe
- Ações

**Filtros:**
- Por role
- Ativos/Inativos
- Por equipe
- Busca por nome/email

**Botões:**
- `+ Convidar Usuário` - Envia convite por email

**Modal de Convite:**
- Email (obrigatório)
- Role (select)
- Equipe (select, opcional)
- Mensagem personalizada

**Envio:**
- Cria registro em company_invites
- Envia email com link de ativação
- Status: pending

**Ações por Usuário:**
- Editar (role, equipe, status)
- Gerenciar permissões (modal com checkboxes)
- Ativar/Desativar
- Resetar senha (envia email)
- Remover da empresa (se não for owner)

**Permissões Customizadas:**
- Modal com árvore de permissões
- Checkboxes por módulo
- Override de permissões do role

#### 6. **Tab Filas (QueueManager)**

**Lista de Filas:**
- Nome
- Descrição
- Membros (avatars)
- Atribuição (manual/automática)
- Ações

**Botões:**
- `+ Nova Fila` - Cria fila

**Modal de Fila (QueueModal):**
- Nome
- Descrição
- Tipo de atribuição:
  - Manual
  - Round-robin (revezamento)
  - Menor carga (menos conversas)
- Membros (multi-select de usuários)
- Horário de atendimento
- Mensagem de fora de horário

**Gerenciar Membros (QueueMembersModal):**
- Lista de membros
- Adicionar/remover
- Definir ordem (se round-robin)
- Máximo de conversas simultâneas por membro

#### 7. **Tab Inteligência Artificial (AISettingsPage)**

**Sub-tabs:**
- Geral
- Respostas Automáticas
- Handoff
- N8N Integration
- Métricas

**Sub-tab Geral:**
- ✅ Habilitar IA (toggle global)
- Modo padrão (auto/suggestion/off)
- Idioma (select)
- Personalidade (select: Profissional, Amigável, Técnico, Casual)
- Delay de resposta (ms, para parecer humano)
- Indicador de digitação (toggle)
- Máximo de mensagens antes de handoff

**Sub-tab Respostas Automáticas:**
- Mensagem de saudação
- Mensagem de fora de horário
- Mensagem de handoff
- Comprimento máximo de resposta (chars)
- Prompt do sistema (textarea, customização avançada)

**Sub-tab Handoff:**
- Triggers de handoff:
  - ✅ Sentimento negativo (threshold)
  - ✅ Valor alto (configurar valor mínimo)
  - ✅ Keywords específicas (lista editável)
  - ✅ Solicitação manual do cliente
- Mensagem ao transferir para humano

**Sub-tab N8N Integration:**
- Webhook URL do N8N
- API Key
- Teste de conexão (botão)
- Logs de chamadas (últimas 10)

**Sub-tab Métricas:**
- Cards de métricas de IA:
  - Conversas tratadas
  - Taxa de resolução sem humano
  - Tempo médio de resposta
  - Confidence score médio
  - Handoffs (total, por motivo)
- Gráfico de evolução
- Por período

**Botões:**
- `Salvar Configurações`
- `Testar IA` - Simula conversa
- `Resetar para Padrão`

#### 8. **Tab Email (EmailSettings)**

**Provedor:**
- Resend (padrão)
- SendGrid
- SMTP Customizado

**Configurações por Provedor:**

**Resend:**
- API Key
- Email remetente (verificado)
- Nome do remetente
- Email de resposta

**SendGrid:**
- API Key
- Email remetente
- Template ID (opcional)

**SMTP:**
- Host
- Port
- Username
- Password
- Encryption (TLS/SSL/None)

**Assinatura de Email:**
- Rich text editor
- Variáveis ({{nome}}, {{cargo}}, {{empresa}})
- Preview

**Templates de Email:**
- Lista de templates salvos
- Criar/editar/deletar
- Subject, Body, Variáveis

**Teste:**
- Enviar email de teste
- Campo de email destinatário
- Botão enviar

**Botões:**
- `Salvar Configurações`
- `Enviar Teste`

#### 9. **Tab Google Calendar (GoogleCalendarSettings)**

**Status de Conexão:**
- Conectado (email mostrado)
- Não conectado

**Botões:**
- `Conectar Google Calendar` - Inicia OAuth2
- `Desconectar` - Remove integração

**OAuth Flow:**
1. Click em conectar
2. Popup Google OAuth
3. Autoriza acesso ao calendar
4. Redirect de volta
5. Salva tokens em profiles

**Sincronização:**
- ✅ Sincronizar tarefas tipo "meeting" (toggle)
- ✅ Criar tarefa no CRM quando evento criado no Calendar
- ✅ Atualizar tarefas quando evento muda
- ✅ Deletar tarefas quando evento é deletado
- Intervalo de sincronização (5min, 15min, 30min, 1h)

**Calendários Disponíveis:**
- Lista de calendários da conta Google
- Checkboxes para selecionar quais sincronizar

**Disponibilidade:**
- Exibir slots disponíveis ao criar reunião
- Baseado no Google Calendar

**Botões:**
- `Salvar Preferências`
- `Sincronizar Agora` - Force sync

#### 10. **Tab Satisfação (SatisfactionSettings)**

**Configurações Gerais:**
- ✅ Habilitar pesquisas (toggle)
- Tipo de pesquisa:
  - CSAT (1-5 estrelas)
  - NPS (0-10)
  - Ambos
- Delay após fechamento (minutos)
- Pergunta adicional de feedback (opcional)

**Mensagens:**
- Mensagem de pesquisa CSAT
- Mensagem de pesquisa NPS
- Mensagem de agradecimento
- Mensagem para score baixo (solicitar feedback)

**Variáveis:**
- `{{contato}}`
- `{{vendedor}}`
- `{{empresa}}`

**Regras:**
- Não enviar para mesma conversa 2x
- Expiração da pesquisa (dias)
- Apenas para conversas com >X mensagens

**Webhooks:**
- Notificar quando score baixo (<3 ou <7)
- URL do webhook
- Headers customizados

**Botões:**
- `Salvar Configurações`
- `Enviar Teste` - Simula pesquisa

---

## 🔐 MÓDULO: SUPER ADMIN

**Rota:** `/super-admin`

**Acesso:** Apenas platform_admins

**Proteção:** SuperAdminGate component

### Tabs

#### 1. **Features Globais (FeatureFlagsManager)**

**Lista de Features:**
- Nome da feature
- Descrição
- Status global (ativo/inativo toggle)
- Disponível em (planos)

**Features Controláveis:**
- proposals (Propostas)
- gamification (Gamificação)
- campaigns (Campanhas)
- automation (Automações/Playbooks)
- segments (Segmentos)
- duplicates (Duplicados)
- groups (Grupos WhatsApp)
- ai_assistant (Assistente IA)
- reports_advanced (Relatórios Avançados)
- custom_fields (Campos Personalizados)
- email_integration (Integração Email)
- calendar_integration (Integração Google Calendar)

**Ações:**
- Toggle global (ativa/desativa para todos)
- Editar descrição
- Configurar por plano

**Efeito:**
- Feature desabilitada:
  - Menu item removido do sidebar
  - Rota retorna 404
  - Componentes não renderizam

#### 2. **Planos (PlanFeaturesEditor)**

**Lista de Planos:**
- Free
- Pro
- Business
- Enterprise

**Configuração por Plano:**
- Checkboxes de features incluídas
- Limites por feature:
  - Máximo de usuários
  - Máximo de instâncias WhatsApp
  - Máximo de contatos
  - Máximo de campanhas/mês
  - Armazenamento (GB)

**Visual:**
- Tabela comparativa
- Planos em colunas
- Features em linhas
- ✅/❌ para cada combinação

**Botões:**
- `Salvar Alterações`

#### 3. **Empresas (PlatformCompanies)**

**Lista de Empresas:**
- Logo
- Nome
- CNPJ
- Plano atual
- Status (ativo/inativo/trial)
- Data de criação
- Usuários (quantidade)
- Último acesso

**Filtros:**
- Por plano
- Por status
- Busca por nome/CNPJ

**Ações por Empresa:**
- Ver detalhes
- Alterar plano
- Ativar/Desativar
- Impersonar (entrar como admin da empresa)
- Ver logs de auditoria
- Deletar (com confirmação)

**Modal de Detalhes:**
- Informações completas
- Usuários da empresa
- Métricas de uso
- Features ativas
- Billing info (se integrado com Stripe)

#### 4. **Métricas da Plataforma (PlatformMetrics)**

**Cards Globais:**
- Total de empresas
- Empresas ativas
- Usuários totais
- Receita mensal (se billing)

**Gráficos:**
- Crescimento de empresas (linha temporal)
- Distribuição por plano (pie chart)
- Uso de features (bar chart)
- Retenção (cohort analysis)

**Métricas de Uso:**
- Mensagens enviadas (total plataforma)
- Conversas ativas
- Deals criados
- Propostas enviadas
- Campanhas rodadas

**Saúde da Plataforma:**
- Tempo de resposta médio API
- Taxa de erro
- Uptime
- Jobs atrasados

---

## 🔄 FLUXOS DE TRABALHO PRINCIPAIS

### Fluxo: Atendimento de Cliente via WhatsApp

1. **Mensagem chega** (via Evolution webhook)
2. **Sistema cria/atualiza conversa** em tempo real
3. **Notifica usuário** responsável (ou todos se não atribuída)
4. **Usuário abre chat** em /chat
5. **IA analisa conversa** (sentimento, intent, temperatura)
6. **IA sugere respostas** no painel lateral
7. **Usuário responde** (pode usar sugestão ou escrever)
8. **Sistema envia via Evolution API**
9. **Status de entrega atualiza** em tempo real
10. **Se IA detecta necessidade**: sugere criar deal/tarefa
11. **Usuário resolve conversa** quando finaliza
12. **Sistema envia pesquisa CSAT** (se habilitado)
13. **Cliente responde pesquisa**
14. **Score registrado** e exibido na conversa

### Fluxo: Criação e Gestão de Negócio

1. **Usuário cria deal** em /crm (ou via chat)
2. **Deal aparece no pipeline** Kanban
3. **Sistema cria atividade** "deal_created"
4. **Usuário preenche BANT** ao longo do tempo
5. **Sistema calcula score** de qualificação
6. **Usuário move deal** entre stages (drag-drop)
7. **Sistema registra mudança** na timeline
8. **Playbooks executam** se configurados
9. **Métricas atualizam** (forecast, pipeline value)
10. **Se necessário, cria proposta** vinculada
11. **Envia proposta** via WhatsApp/Email
12. **Cliente visualiza/aprova** via link público
13. **Deal move para "Fechado Ganho"**
14. **Celebração dispara** (confetti + notificação)
15. **Metas atualizam** automaticamente
16. **Achievements verificados**
17. **Ranking atualiza** em tempo real

### Fluxo: Campanha de WhatsApp

1. **Usuário cria campanha** em /campaigns
2. **Wizard guia criação** (4 etapas)
3. **Sistema valida destinatários** (duplicados, bloqueados)
4. **Usuário agenda ou envia**
5. **Sistema enfileira mensagens**
6. **Edge Function processa** com rate limiting
7. **Mensagens enviadas** via Evolution API
8. **Status atualiza** em tempo real (sent/delivered/read)
9. **Se cliente responde**: conversa criada automaticamente
10. **Dashboard mostra progresso** (%)
11. **Alertas disparam** se taxa erro >10%
12. **Sistema auto-pausa** se necessário
13. **Ao completar**: métricas finais geradas
14. **Usuário exporta relatório**

### Fluxo: Automação (Playbook)

1. **Usuário cria playbook** em /automation
2. **Define trigger** (ex: stage_change)
3. **Adiciona nodes** no canvas visual
4. **Configura cada step** (mensagem, delay, condições)
5. **Testa playbook** com deal real
6. **Ativa playbook**
7. **Trigger acontece** (ex: deal move para "Proposta")
8. **Sistema cria playbook_execution**
9. **Executa step 1**: Envia WhatsApp
10. **Aguarda delay** (se houver wait)
11. **Executa step 2**: Cria tarefa
12. **Logs registram** cada step
13. **Se erro**: marca como failed, notifica
14. **Se sucesso**: marca como completed
15. **Usuário vê execução** em tab Execuções

---

## 📱 FUNCIONALIDADES MOBILE

### Bottom Navigation (MobileBottomNav)

**Ícones:**
- 🏠 Dashboard (/)
- 💬 Chat (/chat)
- 🎯 CRM (/crm)
- ✅ Tarefas (/tasks)
- ⋮ Mais (/settings)

### Otimizações Mobile

**Chat:**
- MobileChatLayout responsivo
- Swipe actions em conversas
- Pull-to-refresh
- Lista virtualizada (performance)

**Pipeline:**
- MobilePipelineLayout
- Swipe horizontal entre stages
- Touch-friendly drag cards

**Outros:**
- Floating Action Button para ações rápidas
- Modais full-screen (MobileModal)
- Gestos de swipe
- Teclado otimizado (fecha ao scroll)

### PWA

**Instalação:**
- InstallPrompt mostra banner
- Adicionar à tela inicial
- Ícones (192px, 512px)

**Offline:**
- Service Worker cacheia assets
- Fallback page se offline
- Sync quando reconectar

**Notificações Push:**
- Permissão solicitada
- Notifica novas mensagens
- Notifica tarefas atrasadas
- Notifica deals ganhos

---

## 🔐 SISTEMA DE PERMISSÕES

### Roles (Hierarquia)

**Owner (100):**
- Acesso total
- Não pode ser removido
- Deletar empresa

**Admin (90):**
- Gerenciar usuários
- Configurações avançadas
- Ver tudo
- Não pode deletar empresa

**Manager (70):**
- Gerenciar equipe
- Ver relatórios completos
- Criar campanhas
- Configurar automações

**Supervisor (60):**
- Ver equipe
- Relatórios básicos
- Não pode alterar configurações

**Seller (40):**
- Ver próprios deals/tarefas
- Chat
- Criar propostas
- Não vê outros vendedores

**Viewer (20):**
- Apenas visualização
- Não pode criar/editar
- Relatórios básicos

### Uso de Permissões

**Hook:**
```typescript
const { can, isRole, isAtLeast } = usePermissions();

if (can('deals.delete')) {
  // Mostrar botão deletar
}

if (isAtLeast('manager')) {
  // Mostrar relatórios avançados
}
```

**Component:**
```tsx
<PermissionGate permission="campaigns.create">
  <Button>Nova Campanha</Button>
</PermissionGate>
```

### Categorias de Permissões

- `chat.*` - Chat e conversas
- `contacts.*` - Contatos
- `deals.*` - CRM/Deals
- `tasks.*` - Tarefas
- `proposals.*` - Propostas
- `campaigns.*` - Campanhas
- `reports.*` - Relatórios
- `settings.*` - Configurações
- `automation.*` - Playbooks
- `users.*` - Gerenciar usuários

---

## 🎨 DESIGN SYSTEM

### Cores (HSL)

**Primary:** `#22C55E` (emerald green)
**Background:** `#F7F7F2` (off-white cream)
**Cards:** `#FFFFFF`
**Sidebar Active:** `#1A3A2F` (dark green)
**Text:** `#1F2937`
**Secondary Text:** `#6B7280`

### Componentes

**Buttons:**
- Primary (green)
- Secondary (outline)
- Destructive (red)
- Ghost (transparent)

**Badges:**
- Default, Success, Warning, Danger, Info
- Cores semantic tokens

**Cards:**
- Border-radius: 16px
- Shadow: subtle (0 1px 3px)
- Hover: elevação

**Tables:**
- Striped rows
- Hover highlight
- Responsive (scroll horizontal mobile)

**Forms:**
- Labels claros
- Validação inline
- Error states
- Helper text

---

## 📊 MÉTRICAS E KPIs

### Métricas de Chat

- Tempo médio de primeira resposta
- Tempo médio de resposta
- Conversas abertas/pendentes/resolvidas/fechadas
- Taxa de resposta
- Mensagens enviadas/recebidas
- CSAT médio
- NPS

### Métricas de CRM

- Pipeline value (valor total em aberto)
- Receita fechada (won deals)
- Taxa de conversão geral
- Taxa de conversão por stage
- Tempo médio no pipeline
- Deals criados/ganhos/perdidos
- Ticket médio (valor médio dos deals)

### Métricas de Vendedor

- Receita individual
- Número de deals ganhos/perdidos
- Taxa de conversão pessoal
- Tempo de resposta
- CSAT pessoal
- Progresso de meta (%)
- Pontos de gamificação

### Métricas de Campanha

- Taxa de envio (enviados/total)
- Taxa de entrega (entregues/enviados)
- Taxa de leitura (lidos/entregues)
- Taxa de resposta (responderam/entregues)
- Taxa de erro (erros/enviados)
- ROI (se vinculado a deals)

### Métricas de IA

- Conversas tratadas
- Taxa de resolução sem humano
- Confidence score médio
- Handoffs (total e por motivo)
- Tempo médio de resposta
- Sentiment accuracy (se comparado com humano)
