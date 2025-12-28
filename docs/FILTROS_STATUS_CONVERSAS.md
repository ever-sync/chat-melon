# Filtros de Status de Conversas

## Visão Geral

O sistema possui filtros rápidos para visualizar conversas por tipo de atendimento. Esses filtros aparecem logo abaixo da barra de busca, com botões grandes e visuais.

## Tipos de Filtros

### 📥 Inbox (Todos)
- **Descrição**: Mostra todas as conversas independente do status
- **Cor**: Azul
- **Uso**: Visão geral de todas as conversas

### 💬 Atendimento
- **Descrição**: Conversas que estão sendo atendidas por um atendente humano
- **Cor**: Verde
- **Critérios de filtro**:
  - Conversa tem `assigned_to` (atribuída a um atendente)
  - Status diferente de `chatbot`
  - Não está com `ai_enabled = true`
- **Uso**: Ver conversas que você ou outros atendentes estão respondendo

### ⏰ Aguardando
- **Descrição**: Conversas que saíram do bot/IA e estão esperando um atendente
- **Cor**: Laranja
- **Critérios de filtro**:
  - Status é `waiting` OU `re_entry`
  - Não tem `assigned_to` (não atribuída)
- **Uso**: Fila de atendimento - conversas que precisam de atenção humana

### 🤖 No Bot
- **Descrição**: Conversas sendo atendidas pelo chatbot
- **Cor**: Roxo
- **Critérios de filtro**:
  - Status é `chatbot`
  - Não está com `ai_enabled = true`
- **Uso**: Monitorar conversas automatizadas pelo bot

### ✨ IA
- **Descrição**: Conversas sendo atendidas pela IA (assistente inteligente)
- **Cor**: Rosa
- **Critérios de filtro**:
  - Campo `ai_enabled = true`
- **Uso**: Ver conversas gerenciadas pela inteligência artificial

## Interface Visual

```
┌─────────────┬─────────────┬─────────────┐
│   [Icon]    │   [Icon]    │   [Icon]    │
│   Inbox     │ Atendimento │  Aguardando │
│    (99)     │    (15)     │     (5)     │
└─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┐
│   [Icon]    │   [Icon]    │
│   No Bot    │     IA      │
│    (23)     │     (7)     │
└─────────────┴─────────────┘
```

### Características Visuais

- **Grid 3x2**: Layout responsivo em 3 colunas
- **Ícones**: Cada botão tem um ícone representativo
- **Contador**: Badge com o número de conversas
- **Estado ativo**: Botão selecionado tem destaque visual
- **Hover**: Efeito de hover com leve aumento (scale 1.02)
- **Animações**: Transições suaves entre estados

## Combinação com Outros Filtros

Os filtros rápidos funcionam **em conjunto** com os outros filtros do sistema:

- ✅ **Filtros de busca**: Texto, data, canal
- ✅ **Filtros avançados**: Setor, labels, mídia
- ✅ **Filtros de atribuição**: "Minhas conversas", "Não atribuídas"

### Exemplo de Uso Combinado

```
Filtro rápido: "Aguardando" (5 conversas)
+
Filtro de busca: "pedido"
=
Resultado: Conversas aguardando atendimento que mencionam "pedido"
```

## Fluxo de Trabalho Recomendado

### Para Atendentes

1. **Começar o dia**:
   - Clique em "Aguardando" para ver fila de espera
   - Pegue uma conversa e comece o atendimento

2. **Durante o expediente**:
   - Use "Atendimento" para ver suas conversas ativas
   - Monitore "Aguardando" periodicamente

3. **Supervisão**:
   - Use "No Bot" para revisar automações
   - Use "IA" para verificar qualidade das respostas

### Para Supervisores

1. **Monitoramento da fila**:
   ```
   Aguardando (15) -> Fila está grande, alocar mais atendentes
   ```

2. **Eficiência da automação**:
   ```
   No Bot (45) -> Bot está resolvendo bem
   Aguardando (3) -> Poucos casos precisam de humano
   ```

3. **Performance da IA**:
   ```
   IA (20) -> Verificar qualidade das respostas
   ```

## Implementação Técnica

### Arquivo Principal
`src/components/chat/sidebar/QuickStatusFilters.tsx`

### Lógica de Filtragem
`src/components/chat/sidebar/ConversationList.tsx` (linhas 249-287)

### Contadores
Calculados em tempo real baseado nas conversas carregadas:

```typescript
const quickModeCounts = {
  all: conversations.length,
  atendimento: conversations.filter(c =>
    c.assigned_to &&
    c.status !== 'chatbot' &&
    !c.ai_enabled
  ).length,
  aguardando: conversations.filter(c =>
    (c.status === 'waiting' || c.status === 're_entry') &&
    !c.assigned_to
  ).length,
  bot: conversations.filter(c =>
    c.status === 'chatbot' &&
    !c.ai_enabled
  ).length,
  ia: conversations.filter(c =>
    c.ai_enabled === true
  ).length,
};
```

## Campos do Banco de Dados

### Tabela: conversations

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `assigned_to` | UUID | ID do atendente responsável |
| `status` | TEXT | Status da conversa (waiting, re_entry, active, chatbot, closed) |
| `ai_enabled` | BOOLEAN | Se a IA está ativa para esta conversa |

## Métricas e KPIs

### Métricas Importantes

1. **Taxa de Automação**:
   ```
   (No Bot + IA) / Total = % de conversas automatizadas
   ```

2. **Tempo Médio de Espera**:
   ```
   Monitorar quanto tempo conversas ficam em "Aguardando"
   ```

3. **Taxa de Resolução da IA**:
   ```
   IA que não passaram para Aguardando / Total IA
   ```

## Personalização

### Alterar Cores

Edite `src/components/chat/sidebar/QuickStatusFilters.tsx`:

```typescript
{
  mode: 'atendimento',
  label: 'Atendimento',
  icon: MessageCircle,
  color: 'text-green-600',      // Cor do ícone
  bgColor: 'bg-green-50',        // Fundo do ícone
  borderColor: 'border-green-200', // Borda quando ativo
  activeColor: 'bg-green-100',    // Fundo quando ativo
}
```

### Adicionar Novo Filtro

1. Adicione o tipo no enum:
```typescript
type FilterMode = 'all' | 'atendimento' | 'aguardando' | 'bot' | 'ia' | 'novo';
```

2. Adicione a configuração visual:
```typescript
{
  mode: 'novo',
  label: 'Novo',
  icon: Star,
  color: 'text-yellow-600',
  bgColor: 'bg-yellow-50',
  borderColor: 'border-yellow-200',
  activeColor: 'bg-yellow-100',
}
```

3. Adicione a lógica de filtragem em `ConversationList.tsx`:
```typescript
if (quickFilterMode === 'novo') {
  return /* sua condição */;
}
```

4. Adicione o contador:
```typescript
novo: conversations.filter(c => /* sua condição */).length,
```

## Troubleshooting

### Contadores não aparecem
- Verifique se há conversas no banco
- Confira os critérios de filtro
- Veja o console para erros

### Filtro não funciona
- Verifique se os campos existem no banco (assigned_to, ai_enabled, status)
- Confira se os dados estão sendo carregados corretamente

### Layout quebrado
- Verifique se o Tailwind está processando as classes
- Confirme que o componente está importado corretamente
