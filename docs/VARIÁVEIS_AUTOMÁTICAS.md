# Sistema de Variáveis Automáticas

## 📋 Visão Geral

O sistema de variáveis automáticas sincroniza campos personalizados de contatos com variáveis reutilizáveis em todo o sistema. Quando você cria ou apaga um campo personalizado, a variável correspondente é automaticamente criada ou removida.

## 🔄 Como Funciona

### 1. Sincronização Automática via Triggers

O sistema usa **triggers no banco de dados** para manter tudo sincronizado:

```sql
-- Quando um custom_field é criado → cria uma company_variable
-- Quando um custom_field é atualizado → atualiza a company_variable
-- Quando um custom_field é deletado → deleta a company_variable
```

**Arquivo de migration:** `supabase/migrations/20251230000000_auto_sync_custom_fields_variables.sql`

### 2. Triggers Implementados

#### a) `sync_custom_field_to_variable_on_insert()`
- **Quando:** Um novo campo personalizado é criado
- **O que faz:** Cria automaticamente uma variável na tabela `company_variables`
- **Campos sincronizados:**
  - `key` = `field_name`
  - `label` = `field_label`
  - `category` = `'contact'`
  - `value_type` = `field_type`

#### b) `sync_custom_field_to_variable_on_update()`
- **Quando:** Um campo personalizado é atualizado
- **O que faz:** Atualiza a variável correspondente

#### c) `sync_custom_field_to_variable_on_delete()`
- **Quando:** Um campo personalizado é deletado
- **O que faz:** Remove a variável correspondente

## 🎯 Onde as Variáveis Aparecem

As variáveis sincronizadas aparecem automaticamente em:

### ✅ 1. Templates de Mensagem
- Componente: `VariablePicker` (`src/components/chat/VariablePicker.tsx`)
- Usa o hook `useVariables()` que carrega da tabela `company_variables`
- Campos personalizados aparecem com badge "AUTO-SYNC"

### ✅ 2. Propostas
- Componente: `ProposalBuilder` (`src/components/proposals/ProposalBuilder.tsx`)
- Botão "Inserir Variável" nos campos de texto
- Variáveis são substituídas ao gerar a proposta

### ✅ 3. Emails
- Componente: `EmailComposer` (`src/components/crm/EmailComposer.tsx`)
- Disponível em assunto e corpo do email
- Suporta HTML com variáveis

### ✅ 4. Campanhas
- Componente: `CampaignBuilder` (`src/components/campaigns/CampaignBuilder.tsx`)
- Usa `VariablePicker` integrado
- Preview mostra valores de exemplo

### ✅ 5. Chatbot
- Componente: `NodeEditor` (`src/components/chatbot/NodeEditor.tsx`)
- Variáveis disponíveis em todos os nós de mensagem
- Substitui em tempo real durante a conversa

### ✅ 6. Automações (Playbooks)
- Componente: `NodeConfigPanel` (`src/components/automation/NodeConfigPanel.tsx`)
- Usa `VariablePicker` para ações de envio
- Variáveis processadas durante execução

### ✅ 7. Relatórios
- As variáveis fazem parte dos dados dos contatos
- Filtros e agrupamentos podem usar campos personalizados
- Dados já incluem valores de custom fields

### ✅ 8. IA (Assistente)
- Helper: `contactVariablesContext.ts` (`src/lib/ai/contactVariablesContext.ts`)
- Funções:
  - `getContactVariablesContext()` - Busca variáveis disponíveis
  - `buildAIVariablesPrompt()` - Monta prompt para IA com contexto
- A IA pode sugerir mensagens usando as variáveis personalizadas

## 🛠️ Componentes Principais

### 1. Hook: `useContactVariables`
**Arquivo:** `src/hooks/useContactVariables.ts`

```typescript
const {
  allVariables,        // Todas as variáveis (padrão + empresa + custom)
  defaultVariables,    // Variáveis padrão do sistema
  companyVariables,    // Variáveis da empresa
  customVariables      // Campos personalizados (AUTO-SYNC)
} = useContactVariables();
```

**Funções utilitárias:**
- `replaceContactVariables(text, contact, companyVars)` - Substitui variáveis em texto
- `renderContactVariablesPreview(text, companyVars)` - Preview com exemplos

### 2. Componente: `VariablesPicker`
**Arquivo:** `src/components/variables/VariablesPicker.tsx`

```tsx
<VariablesPicker
  onSelect={(key) => {
    // Inserir {{key}} no campo de texto
  }}
  buttonText="Inserir Variável"
  buttonVariant="outline"
  showPreview={true}
/>
```

**Features:**
- Busca em tempo real
- Categorias organizadas (Padrão, Empresa, Personalizados)
- Badge "AUTO-SYNC" para campos sincronizados
- Preview com descrição

### 3. Componente Existente: `VariablePicker`
**Arquivo:** `src/components/chat/VariablePicker.tsx`

Componente já existente que usa `useVariables()` e `useAllCustomFields()`.
- Já sincronizado automaticamente via triggers
- Usado em campanhas, chatbot e automações

## 📊 Estrutura do Banco de Dados

### Tabela: `custom_fields`
```sql
- id: uuid
- company_id: uuid
- entity_type: text (ex: 'contact', 'deal')
- field_name: text (key da variável)
- field_label: text (label da variável)
- field_type: text (text, number, date, etc.)
- is_active: boolean
```

### Tabela: `company_variables`
```sql
- id: uuid
- company_id: uuid
- key: text (sincronizado com field_name)
- label: text (sincronizado com field_label)
- description: text
- category: text ('contact' para custom fields)
- value_type: text (sincronizado com field_type)
- default_value: text
- is_active: boolean
```

## 🔥 Exemplos de Uso

### Exemplo 1: Criar novo campo personalizado
```typescript
// 1. Usuário cria campo "Data de Nascimento" em Contatos
// 2. Trigger automaticamente cria variável em company_variables:
{
  key: 'data_nascimento',
  label: 'Data de Nascimento',
  category: 'contact',
  value_type: 'date'
}

// 3. Variável aparece automaticamente em:
// - Templates de mensagem
// - Propostas
// - Emails
// - Campanhas
// - Chatbot
// - Automações
// - IA
```

### Exemplo 2: Usar variável em mensagem
```typescript
// Template de mensagem:
"Olá {{nome}}, tudo bem? Vi que sua data de nascimento é {{data_nascimento}}. Parabéns!"

// Ao enviar para contato João Silva (nascido em 15/03/1990):
"Olá João Silva, tudo bem? Vi que sua data de nascimento é 15/03/1990. Parabéns!"
```

### Exemplo 3: Deletar campo personalizado
```typescript
// 1. Usuário deleta campo "Data de Nascimento"
// 2. Trigger automaticamente deleta a variável correspondente
// 3. Variável não aparece mais nos pickers
```

## ⚡ Benefícios

### Para o Usuário:
- ✅ **Zero configuração manual** - Campos viram variáveis automaticamente
- ✅ **Consistência** - Mesma variável em todos os lugares
- ✅ **Tempo real** - Mudanças refletem imediatamente
- ✅ **Sem duplicação** - Um único campo, múltiplos usos

### Para Desenvolvedores:
- ✅ **Menos código** - Triggers fazem o trabalho pesado
- ✅ **Manutenção fácil** - Lógica centralizada no banco
- ✅ **Type-safe** - Hooks tipados com TypeScript
- ✅ **Reutilizável** - Componentes compartilhados

## 🔍 Debugging

### Ver variáveis sincronizadas:
```sql
-- Ver todas as variáveis de contato
SELECT * FROM company_variables
WHERE category = 'contact'
AND is_active = true;

-- Ver campos personalizados
SELECT * FROM custom_fields
WHERE entity_type = 'contact'
AND is_active = true;
```

### Logs dos triggers:
Os triggers têm `RAISE NOTICE` para debug:
```sql
RAISE NOTICE 'Custom field created: %, creating variable', NEW.field_name;
```

## 🚀 Próximos Passos

### Possíveis Melhorias:
1. **Validação de valores** - Validar tipos ao substituir variáveis
2. **Formatação customizada** - Ex: `{{data_nascimento|format:DD/MM/YYYY}}`
3. **Variáveis condicionais** - Ex: `{{#se_vip}}Desconto especial{{/se_vip}}`
4. **Preview em tempo real** - Mostrar como ficará antes de enviar
5. **Histórico de uso** - Rastrear quais variáveis são mais usadas

## 📝 Notas Importantes

- ⚠️ Deletar um campo personalizado **remove permanentemente** a variável
- ⚠️ Templates/mensagens salvos com variáveis deletadas mostrarão vazio
- ✅ Renomear um campo **atualiza automaticamente** a variável
- ✅ Desativar um campo **mantém** a variável mas marca como inativa

## 🤝 Contribuindo

Ao adicionar novos lugares que usam variáveis:

1. Use `useContactVariables()` ou `VariablesPicker` component
2. Use `replaceContactVariables()` para substituir valores
3. Adicione documentação aqui
4. Teste criação/edição/deleção de campos

---

**Última atualização:** 30/12/2025
**Versão:** 1.0.0
